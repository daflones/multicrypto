-- =====================================================
-- CORREÇÃO DEFINITIVA: SISTEMA 300% + AMBIGUIDADE RESOLVIDA
-- =====================================================

-- 1. Limpar funções antigas para evitar conflitos
DROP FUNCTION IF EXISTS get_investment_progress(UUID);
DROP FUNCTION IF EXISTS process_commission_payment_with_limit(UUID, NUMERIC, UUID, UUID, INTEGER, NUMERIC);
DROP FUNCTION IF EXISTS apply_historical_commissions_to_investment(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_and_distribute_commissions(UUID, NUMERIC);

-- 2. Função para calcular progresso (CORRIGIDA AMBIGUIDADE)
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
    SELECT COALESCE(SUM(ui.amount), 0) as total
    FROM public.user_investments ui
    WHERE ui.user_id = p_user_id AND ui.status = 'active'
  ),
  yield_earnings AS (
    SELECT COALESCE(SUM(ui.total_earned), 0) as total
    FROM public.user_investments ui
    WHERE ui.user_id = p_user_id AND ui.status = 'active'
  ),
  commission_earnings AS (
    SELECT COALESCE(SUM(c.amount), 0) as total
    FROM public.commissions c
    WHERE c.beneficiary_id = p_user_id
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

-- 3. Função para aplicar comissões históricas (CORRIGIDA AMBIGUIDADE)
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
  SELECT COALESCE(SUM(c.amount), 0)
  INTO v_total_commissions
  FROM public.commissions c
  WHERE c.beneficiary_id = p_user_id;
  
  -- Se não tem comissões, sair
  IF v_total_commissions <= 0 THEN
    RETURN;
  END IF;
  
  -- Buscar dados do investimento
  SELECT ui.amount, ui.end_date, COALESCE(ui.total_earned, 0)
  INTO v_investment_amount, v_investment_end_date, v_current_earned
  FROM public.user_investments ui
  WHERE ui.id = p_investment_id;
  
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

-- 4. Função para processar comissão com limite (CORRIGIDA AMBIGUIDADE)
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
  v_investment RECORD;
  v_total_remaining NUMERIC;
  v_proportion NUMERIC;
  v_amount_to_add NUMERIC;
  v_new_total_earned NUMERIC;
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
  
  -- Distribuir comissão entre produtos ativos (FINALIZAÇÃO ANTECIPADA)
  SELECT COALESCE(SUM((ui.amount * 3) - COALESCE(ui.total_earned, 0)), 0)
  INTO v_total_remaining
  FROM public.user_investments ui
  WHERE ui.user_id = p_beneficiary_id
    AND ui.status = 'active'
    AND (ui.amount * 3) > COALESCE(ui.total_earned, 0);
  
  IF v_total_remaining > 0 THEN
    FOR v_investment IN
      SELECT 
        ui.id,
        ui.amount,
        COALESCE(ui.total_earned, 0) as total_earned,
        (ui.amount * 3) as total_expected,
        (ui.amount * 3) - COALESCE(ui.total_earned, 0) as remaining,
        ui.end_date
      FROM public.user_investments ui
      WHERE ui.user_id = p_beneficiary_id
        AND ui.status = 'active'
        AND (ui.amount * 3) > COALESCE(ui.total_earned, 0)
    LOOP
      -- Calcular proporção
      v_proportion := v_investment.remaining / v_total_remaining;
      v_amount_to_add := v_allowed_amount * v_proportion;
      v_new_total_earned := v_investment.total_earned + v_amount_to_add;
      
      -- Calcular redução de dias (baseado no rendimento de 5%)
      DECLARE
        v_daily_yield_val NUMERIC;
        v_days_to_reduce INTEGER;
        v_new_end_date_val TIMESTAMP WITH TIME ZONE;
      BEGIN
        v_daily_yield_val := v_investment.amount * 0.05;
        IF v_daily_yield_val > 0 THEN
          v_days_to_reduce := FLOOR(v_amount_to_add / v_daily_yield_val)::INTEGER;
          
          IF v_days_to_reduce > 0 AND v_investment.end_date IS NOT NULL THEN
            v_new_end_date_val := v_investment.end_date - (v_days_to_reduce || ' days')::INTERVAL;
            IF v_new_end_date_val < NOW() THEN v_new_end_date_val := NOW(); END IF;
          ELSE
            v_new_end_date_val := v_investment.end_date;
          END IF;
        ELSE
          v_new_end_date_val := v_investment.end_date;
        END IF;

        UPDATE public.user_investments
        SET total_earned = v_new_total_earned,
            end_date = v_new_end_date_val
        WHERE id = v_investment.id;
      END;
      
      IF v_new_total_earned >= v_investment.total_expected THEN
        UPDATE public.user_investments
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = v_investment.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_allowed_amount;
END;
$$;

-- 5. Função principal de distribuição (CORRIGIDA AMBIGUIDADE)
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
  
  FOR current_level IN 1..7 LOOP
    SELECT referred_by INTO referrer_id 
    FROM public.users 
    WHERE id = current_user_id;
    
    IF referrer_id IS NULL THEN
      EXIT;
    END IF;
    
    commission_percentage := CASE current_level
      WHEN 1 THEN 0.10
      WHEN 2 THEN 0.04
      WHEN 3 THEN 0.02
      WHEN 4 THEN 0.01
      WHEN 5 THEN 0.01
      WHEN 6 THEN 0.01
      WHEN 7 THEN 0.01
      ELSE 0.00
    END;
    
    commission_amount := ROUND(investment_amount * commission_percentage, 2);
    
    IF commission_amount <= 0 THEN
      CONTINUE;
    END IF;
    
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

-- Verificação
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname IN (
  'get_investment_progress',
  'apply_historical_commissions_to_investment', 
  'process_commission_payment_with_limit',
  'calculate_and_distribute_commissions'
);
