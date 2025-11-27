-- =====================================================
-- SISTEMA COMPLETO: 300% = RENDIMENTO + COMISSÕES
-- =====================================================
-- COPIE E EXECUTE TODO ESTE CÓDIGO NO SUPABASE SQL EDITOR
-- =====================================================
-- IMPORTANTE: Este código é compatível com seu schema atual
-- DURAÇÃO: 60 dias de rendimento (5% × 60 = 300%)
-- =====================================================

-- Função para calcular quanto falta para atingir 300%
CREATE OR REPLACE FUNCTION get_investment_progress(p_user_id UUID)
RETURNS TABLE (
  total_invested NUMERIC,
  total_limit NUMERIC,
  total_earned_yield NUMERIC,
  total_earned_commission NUMERIC,
  total_earned NUMERIC,
  remaining_to_limit NUMERIC,
  percentage_completed NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH active_investments AS (
    SELECT COALESCE(SUM(amount), 0)::NUMERIC as total
    FROM public.user_investments
    WHERE user_id = p_user_id AND status = 'active'
  ),
  yield_earnings AS (
    SELECT COALESCE(SUM(total_earned), 0)::NUMERIC as total
    FROM public.user_investments
    WHERE user_id = p_user_id AND status = 'active'
  ),
  commission_earnings AS (
    SELECT COALESCE(SUM(amount), 0)::NUMERIC as total
    FROM public.commissions
    WHERE beneficiary_id = p_user_id
  )
  SELECT 
    ai.total::NUMERIC as total_invested,
    (ai.total * 3)::NUMERIC as total_limit,  -- 300% do investido
    ye.total::NUMERIC as total_earned_yield,
    ce.total::NUMERIC as total_earned_commission,
    (ye.total + ce.total)::NUMERIC as total_earned,
    GREATEST(0, (ai.total * 3) - (ye.total + ce.total))::NUMERIC as remaining_to_limit,
    CASE 
      WHEN ai.total > 0 THEN (((ye.total + ce.total) / (ai.total * 3)) * 100)::NUMERIC
      ELSE 0::NUMERIC
    END as percentage_completed
  FROM active_investments ai, yield_earnings ye, commission_earnings ce;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar pagamento de comissão com limite total
CREATE OR REPLACE FUNCTION process_commission_payment_with_limit(
  p_beneficiary_id UUID,
  p_commission_amount NUMERIC,
  p_source_user_id UUID,
  p_investment_id UUID,
  p_level INTEGER,
  p_percentage NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_progress RECORD;
  v_allowed_amount NUMERIC;
  v_investment RECORD;
  v_total_remaining NUMERIC;
  v_proportion NUMERIC;
  v_amount_to_add NUMERIC;
  v_new_total_earned NUMERIC;
BEGIN
  -- Verificar progresso atual (rendimento + comissões)
  SELECT * INTO v_progress FROM get_investment_progress(p_beneficiary_id);
  
  -- Se já atingiu 300%, não pode receber mais nada
  IF v_progress.remaining_to_limit <= 0 THEN
    RAISE NOTICE 'Usuário % atingiu limite de 300%% (R$ % de R$ %)', 
      p_beneficiary_id, v_progress.total_earned, v_progress.total_limit;
    RETURN 0;
  END IF;
  
  -- Determinar quanto pode receber
  IF p_commission_amount > v_progress.remaining_to_limit THEN
    v_allowed_amount := v_progress.remaining_to_limit;
    RAISE NOTICE 'Comissão limitada de R$ % para R$ % (faltam %.2f%% para 300%%)', 
      p_commission_amount, v_allowed_amount, (100 - v_progress.percentage_completed);
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
  
  -- Adicionar ao saldo de comissão
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
    data
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
      'remaining_to_300', v_progress.remaining_to_limit - v_allowed_amount,
      'commission_type', '7_level_system_with_300_limit'
    )
  );
  
  -- FINALIZAÇÃO: Distribuir comissão entre produtos ativos
  -- Calcular total que ainda precisa render (considerando rendimento + comissões)
  SELECT COALESCE(SUM(
    (ui.amount * 3) - COALESCE(ui.total_earned, 0)
  ), 0)::NUMERIC
  INTO v_total_remaining
  FROM public.user_investments ui
  WHERE ui.user_id = p_beneficiary_id
    AND ui.status = 'active'
    AND (ui.amount * 3) > COALESCE(ui.total_earned, 0);
  
  -- Se há produtos para finalizar, distribuir a comissão
  IF v_total_remaining > 0 THEN
    FOR v_investment IN
      SELECT 
        ui.id,
        ui.amount,
        COALESCE(ui.total_earned, 0) as total_earned,
        (ui.amount * 3) as total_expected,  -- 300% do investimento
        (ui.amount * 3) - COALESCE(ui.total_earned, 0) as remaining
      FROM public.user_investments ui
      WHERE ui.user_id = p_beneficiary_id
        AND ui.status = 'active'
        AND (ui.amount * 3) > COALESCE(ui.total_earned, 0)
    LOOP
      -- Calcular proporção deste produto
      v_proportion := v_investment.remaining / v_total_remaining;
      v_amount_to_add := v_allowed_amount * v_proportion;
      v_new_total_earned := v_investment.total_earned + v_amount_to_add;
      
      -- Atualizar total_earned (agora inclui comissões)
      UPDATE public.user_investments
      SET total_earned = v_new_total_earned
      WHERE id = v_investment.id;
      
      -- Se atingiu 300% (R$ 3.000 para investimento de R$ 1.000), marcar como completo
      IF v_new_total_earned >= v_investment.total_expected THEN
        UPDATE public.user_investments
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = v_investment.id;
        
        RAISE NOTICE 'Investimento % finalizado! Atingiu 300%% (R$ % de R$ %)', 
          v_investment.id, v_new_total_earned, v_investment.amount;
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_allowed_amount;
END;
$$ LANGUAGE plpgsql;

-- Atualizar função principal
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
    
    -- Porcentagens de comissão
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
    
    IF actual_paid = 0 THEN
      RAISE NOTICE 'Nível % não recebeu comissão (300%% atingido)', current_level;
    ELSIF actual_paid < commission_amount THEN
      RAISE NOTICE 'Nível % recebeu parcial: R$ % de R$ %', current_level, actual_paid, commission_amount;
    END IF;
    
    current_user_id := referrer_id;
  END LOOP;
  
  RAISE NOTICE 'Comissões distribuídas para usuário % com valor R$ %', buyer_user_id, investment_amount;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao distribuir comissões: %', SQLERRM;
    RAISE;
END;
$$;

-- Comentários
COMMENT ON FUNCTION get_investment_progress IS 'Calcula progresso total (rendimento + comissões) rumo aos 300%';
COMMENT ON FUNCTION process_commission_payment_with_limit IS 'Processa comissão respeitando limite de 300% TOTAL (rendimento + comissões)';
COMMENT ON FUNCTION calculate_and_distribute_commissions IS 'Distribui comissões em 7 níveis COM LIMITE TOTAL DE 300%';

-- =====================================================
-- VERIFICAÇÃO: Execute para confirmar que funcionou
-- =====================================================
SELECT 
  proname as nome_funcao,
  pg_get_function_arguments(oid) as parametros
FROM pg_proc 
WHERE proname IN (
  'get_investment_progress',
  'process_commission_payment_with_limit',
  'calculate_and_distribute_commissions'
)
ORDER BY proname;

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Copie TODO este arquivo
-- 2. Abra Supabase Dashboard > SQL Editor
-- 3. Cole e clique em RUN
-- 4. Verifique se as 3 funções aparecem na lista
-- 5. Pronto! Sistema com limite de 300% ativado
-- =====================================================
