-- =====================================================
-- SISTEMA CORRIGIDO FINAL: 300% COM COMISSÕES HISTÓRICAS
-- =====================================================
-- Baseado no schema real do banco de dados
-- =====================================================

-- 1. Função para calcular progresso do usuário
CREATE OR REPLACE FUNCTION get_investment_progress(p_user_id UUID)
RETURNS TABLE (
  total_invested NUMERIC,
  total_limit NUMERIC,
  total_earned_yield NUMERIC,
  total_earned_commission NUMERIC,
  total_earned NUMERIC,
  remaining_to_limit NUMERIC,
  percentage_completed NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_investments AS (
    SELECT COALESCE(SUM(amount), 0) as total
    FROM public.user_investments
    WHERE user_id = p_user_id AND status = 'active'
  ),
  yield_earnings AS (
    SELECT COALESCE(SUM(total_earned), 0) as total
    FROM public.user_investments
    WHERE user_id = p_user_id AND status = 'active'
  ),
  commission_earnings AS (
    SELECT COALESCE(SUM(amount), 0) as total
    FROM public.commissions
    WHERE beneficiary_id = p_user_id
  )
  SELECT 
    ai.total::NUMERIC,
    (ai.total * 3)::NUMERIC,
    ye.total::NUMERIC,
    ce.total::NUMERIC,
    (ye.total + ce.total)::NUMERIC,
    GREATEST(0, (ai.total * 3) - (ye.total + ce.total))::NUMERIC,
    CASE 
      WHEN ai.total > 0 THEN (((ye.total + ce.total) / (ai.total * 3)) * 100)::NUMERIC
      ELSE 0::NUMERIC
    END
  FROM active_investments ai, yield_earnings ye, commission_earnings ce;
END;
$$;

-- 2. Função para aplicar comissões históricas a novo investimento
CREATE OR REPLACE FUNCTION apply_historical_commissions_to_investment(
  p_user_id UUID,
  p_investment_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_commissions NUMERIC;
  v_investment_amount NUMERIC;
  v_investment_end_date TIMESTAMP WITH TIME ZONE;
  v_current_earned NUMERIC;
  v_daily_yield NUMERIC;
  v_days_equivalent INTEGER;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
  v_amount_to_apply NUMERIC;
BEGIN
  -- Buscar total de comissões do usuário
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_commissions
  FROM public.commissions
  WHERE beneficiary_id = p_user_id;
  
  -- Se não tem comissões, sair
  IF v_total_commissions <= 0 THEN
    RETURN;
  END IF;
  
  -- Buscar dados do investimento
  SELECT amount, end_date, COALESCE(total_earned, 0)
  INTO v_investment_amount, v_investment_end_date, v_current_earned
  FROM public.user_investments
  WHERE id = p_investment_id;
  
  -- Calcular quanto pode aplicar (máximo 300% - já ganho)
  v_amount_to_apply := LEAST(
    v_total_commissions, 
    (v_investment_amount * 3) - v_current_earned
  );
  
  IF v_amount_to_apply > 0 THEN
    -- Rendimento diário = 5% do investimento
    v_daily_yield := v_investment_amount * 0.05;
    
    -- Quantos dias as comissões equivalem
    IF v_daily_yield > 0 THEN
      v_days_equivalent := FLOOR(v_amount_to_apply / v_daily_yield)::INTEGER;
      
      -- Calcular nova data de término
      IF v_days_equivalent > 0 AND v_investment_end_date IS NOT NULL THEN
        v_new_end_date := v_investment_end_date - (v_days_equivalent || ' days')::INTERVAL;
        
        -- Não pode ser antes de agora
        IF v_new_end_date < NOW() THEN
          v_new_end_date := NOW();
        END IF;
      ELSE
        v_new_end_date := v_investment_end_date;
      END IF;
      
      -- Atualizar investimento
      UPDATE public.user_investments
      SET 
        total_earned = v_current_earned + v_amount_to_apply,
        end_date = v_new_end_date
      WHERE id = p_investment_id;
      
      -- Se atingiu 300%, marcar como completo
      IF (v_current_earned + v_amount_to_apply) >= (v_investment_amount * 3) THEN
        UPDATE public.user_investments
        SET 
          status = 'completed',
          completed_at = NOW()
        WHERE id = p_investment_id;
      END IF;
    END IF;
  END IF;
END;
$$;

-- 3. Função para processar comissão com limite
CREATE OR REPLACE FUNCTION process_commission_payment_with_limit(
  p_beneficiary_id UUID,
  p_commission_amount NUMERIC,
  p_source_user_id UUID,
  p_investment_id UUID,
  p_level INTEGER,
  p_percentage NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress RECORD;
  v_allowed_amount NUMERIC;
BEGIN
  -- Verificar progresso atual
  SELECT * INTO v_progress FROM get_investment_progress(p_beneficiary_id);
  
  -- Se atingiu 300%, não recebe mais
  IF v_progress.remaining_to_limit <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Determinar quanto pode receber
  IF p_commission_amount > v_progress.remaining_to_limit THEN
    v_allowed_amount := v_progress.remaining_to_limit;
  ELSE
    v_allowed_amount := p_commission_amount;
  END IF;
  
  -- Registrar comissão
  INSERT INTO public.commissions (
    beneficiary_id,
    source_user_id,
    investment_id,
    level,
    percentage,
    amount,
    created_at
  ) VALUES (
    p_beneficiary_id,
    p_source_user_id,
    p_investment_id,
    p_level,
    p_percentage,
    v_allowed_amount,
    NOW()
  );
  
  -- Adicionar ao saldo
  UPDATE public.users
  SET commission_balance = commission_balance + v_allowed_amount
  WHERE id = p_beneficiary_id;
  
  -- Criar transação
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    payment_method,
    status,
    data,
    created_at
  ) VALUES (
    p_beneficiary_id,
    'commission',
    v_allowed_amount,
    'system',
    'approved',
    jsonb_build_object(
      'investment_id', p_investment_id,
      'source_user_id', p_source_user_id,
      'level', p_level,
      'percentage', p_percentage,
      'original_amount', p_commission_amount,
      'limited_amount', v_allowed_amount,
      'commission_type', '7_level_with_300_limit'
    ),
    NOW()
  );
  
  RETURN v_allowed_amount;
END;
$$;

-- 4. Função principal de distribuição de comissões
CREATE OR REPLACE FUNCTION calculate_and_distribute_commissions(
  buyer_user_id UUID,
  investment_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  referrer_id UUID;
  commission_amount NUMERIC;
  commission_percentage NUMERIC;
  current_level INTEGER;
  investment_record RECORD;
  actual_paid NUMERIC;
BEGIN
  -- Validar inputs
  IF buyer_user_id IS NULL OR investment_amount IS NULL THEN
    RAISE EXCEPTION 'Parâmetros inválidos';
  END IF;

  IF investment_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de investimento deve ser maior que zero';
  END IF;

  -- Buscar o investimento mais recente
  SELECT * INTO investment_record
  FROM public.user_investments 
  WHERE user_id = buyer_user_id 
  ORDER BY purchase_date DESC 
  LIMIT 1;

  current_user_id := buyer_user_id;
  
  -- Loop através dos 7 níveis
  FOR current_level IN 1..7 LOOP
    SELECT referred_by INTO referrer_id 
    FROM public.users 
    WHERE id = current_user_id;
    
    IF referrer_id IS NULL THEN
      EXIT;
    END IF;
    
    -- Definir porcentagem de comissão baseada no nível
    commission_percentage := CASE current_level
      WHEN 1 THEN 0.10  -- 10%
      WHEN 2 THEN 0.04  -- 4%
      WHEN 3 THEN 0.02  -- 2%
      WHEN 4 THEN 0.01  -- 1%
      WHEN 5 THEN 0.01  -- 1%
      WHEN 6 THEN 0.01  -- 1%
      WHEN 7 THEN 0.01  -- 1%
      ELSE 0.00
    END;
    
    commission_amount := ROUND(investment_amount * commission_percentage, 2);
    
    IF commission_amount <= 0 THEN
      CONTINUE;
    END IF;
    
    -- Processar pagamento COM LIMITE DE 300%
    actual_paid := process_commission_payment_with_limit(
      referrer_id,
      commission_amount,
      buyer_user_id,
      investment_record.id,
      current_level,
      commission_percentage * 100
    );
    
    current_user_id := referrer_id;
  END LOOP;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao distribuir comissões: %', SQLERRM;
    RAISE;
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION get_investment_progress IS 'Calcula progresso total (rendimento + comissões) rumo aos 300%';
COMMENT ON FUNCTION apply_historical_commissions_to_investment IS 'Aplica comissões históricas a novo investimento, diminuindo os dias';
COMMENT ON FUNCTION process_commission_payment_with_limit IS 'Processa comissão respeitando limite de 300% TOTAL';
COMMENT ON FUNCTION calculate_and_distribute_commissions IS 'Distribui comissões em 7 níveis COM LIMITE TOTAL DE 300%';

-- Verificação final
SELECT 
  proname as funcao_criada,
  pg_get_function_arguments(oid) as parametros
FROM pg_proc 
WHERE proname IN (
  'get_investment_progress',
  'apply_historical_commissions_to_investment', 
  'process_commission_payment_with_limit',
  'calculate_and_distribute_commissions'
)
ORDER BY proname;

-- Teste rápido (descomente para testar)
/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Pegar um usuário de teste
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Testar função de progresso
    PERFORM get_investment_progress(test_user_id);
    RAISE NOTICE 'Funções criadas e testadas com sucesso!';
  ELSE
    RAISE NOTICE 'Nenhum usuário encontrado para teste';
  END IF;
END $$;
*/
