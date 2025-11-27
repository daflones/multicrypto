-- =====================================================
-- CORREÇÃO: REMOVER COMISSÕES HISTÓRICAS EM NOVOS INVESTIMENTOS
-- =====================================================
-- Apenas comissões NOVAS devem ajudar a finalizar produtos
-- =====================================================

-- 1. Remover função problemática de comissões históricas
DROP FUNCTION IF EXISTS apply_historical_commissions_to_investment(UUID, UUID);

-- 2. Recriar função de cálculo de progresso (Manter lógica de 300%)
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

-- 3. Função para processar comissão (Mantém lógica de finalizar produtos ATIVOS com NOVAS comissões)
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
  
  -- Distribuir APENAS ESTA NOVA COMISSÃO entre produtos ativos
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
          -- Só reduz dias com base no valor DESTA comissão
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
