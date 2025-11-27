-- =====================================================
-- CORREÇÃO FINAL: ADAPTADO AO SCHEMA REAL DO BANCO
-- =====================================================

-- 1. Função de Progresso (Ajustada para tipos NUMERIC)
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
  WITH active_data AS (
    SELECT 
      COALESCE(SUM(ui.amount), 0)::NUMERIC as invested,
      COALESCE(SUM(ui.total_earned), 0)::NUMERIC as earned
    FROM public.user_investments ui
    WHERE ui.user_id = p_user_id AND ui.status = 'active'
  )
  SELECT 
    ad.invested,
    (ad.invested * 3)::NUMERIC as total_limit,
    ad.earned as total_earned_yield,
    0::NUMERIC as total_earned_commission,
    ad.earned as total_earned,
    GREATEST(0, (ad.invested * 3) - ad.earned)::NUMERIC as remaining_to_limit,
    CASE 
      WHEN ad.invested > 0 THEN ((ad.earned / (ad.invested * 3)) * 100)::NUMERIC
      ELSE 0::NUMERIC
    END
  FROM active_data ad;
END;
$$;

-- 2. Função de Processamento (Ajustada para Timestamp With Time Zone)
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
  v_reduction_interval INTERVAL;
  v_daily_yield_val NUMERIC;
  v_new_end_date TIMESTAMP WITH TIME ZONE; -- Tipo correto para end_date
BEGIN
  -- 1. Proteção contra duplicidade
  IF EXISTS (
    SELECT 1 FROM public.commissions 
    WHERE investment_id = p_investment_id 
      AND level = p_level 
      AND beneficiary_id = p_beneficiary_id
  ) THEN
    RETURN 0;
  END IF;

  -- 2. Verificar Limite
  SELECT * INTO v_progress FROM get_investment_progress(p_beneficiary_id);
  
  IF v_progress.remaining_to_limit <= 0 THEN
    RAISE NOTICE 'Limite 300%% atingido para %', p_beneficiary_id;
    RETURN 0;
  END IF;
  
  v_allowed_amount := LEAST(p_commission_amount, v_progress.remaining_to_limit);
  
  -- 3. Insert Commissions (created_at é timestamp sem timezone, NOW() funciona)
  INSERT INTO public.commissions (beneficiary_id, source_user_id, investment_id, level, percentage, amount, created_at)
  VALUES (p_beneficiary_id, p_source_user_id, p_investment_id, p_level, p_percentage, v_allowed_amount, NOW()::timestamp);
  
  -- 4. Update Users
  UPDATE public.users SET commission_balance = commission_balance + v_allowed_amount WHERE id = p_beneficiary_id;
  
  -- 5. Insert Transaction
  INSERT INTO public.transactions (user_id, type, amount, payment_method, status, data, created_at)
  VALUES (p_beneficiary_id, 'commission', v_allowed_amount, 'system', 'approved', 
    jsonb_build_object('commission_type', '7_level_with_300_limit', 'level', p_level), NOW()::timestamp);
  
  -- 6. Distribuir e Reduzir Tempo
  SELECT COALESCE(SUM((ui.amount * 3) - COALESCE(ui.total_earned, 0)), 0)::NUMERIC
  INTO v_total_remaining
  FROM public.user_investments ui
  WHERE ui.user_id = p_beneficiary_id AND ui.status = 'active' AND (ui.amount * 3) > COALESCE(ui.total_earned, 0);
  
  IF v_total_remaining > 0 THEN
    FOR v_investment IN
      SELECT ui.id, ui.amount, COALESCE(ui.total_earned, 0) as total_earned, (ui.amount * 3) as total_expected, 
             (ui.amount * 3) - COALESCE(ui.total_earned, 0) as remaining, ui.end_date
      FROM public.user_investments ui
      WHERE ui.user_id = p_beneficiary_id AND ui.status = 'active' AND (ui.amount * 3) > COALESCE(ui.total_earned, 0)
    LOOP
      v_proportion := v_investment.remaining / v_total_remaining;
      v_amount_to_add := v_allowed_amount * v_proportion;
      v_new_total_earned := v_investment.total_earned + v_amount_to_add;
      v_daily_yield_val := v_investment.amount * 0.05;

      IF v_daily_yield_val > 0 AND v_investment.end_date IS NOT NULL THEN
        -- Redução Precisa
        v_reduction_interval := (v_amount_to_add / v_daily_yield_val) * INTERVAL '1 day';
        v_new_end_date := GREATEST(NOW(), v_investment.end_date - v_reduction_interval);
        
        UPDATE public.user_investments
        SET total_earned = v_new_total_earned,
            end_date = v_new_end_date
        WHERE id = v_investment.id;
      ELSE
        UPDATE public.user_investments
        SET total_earned = v_new_total_earned
        WHERE id = v_investment.id;
      END IF;
      
      -- Finalizar se completou (completed_at é timestamp sem timezone)
      IF v_new_total_earned >= v_investment.total_expected THEN
        UPDATE public.user_investments
        SET status = 'completed', completed_at = NOW()::timestamp
        WHERE id = v_investment.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_allowed_amount;
END;
$$;
