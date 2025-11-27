-- =====================================================
-- CORREÇÃO FINAL: CÁLCULO PRECISO DE REDUÇÃO DE TEMPO
-- =====================================================

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
BEGIN
  -- Proteção contra duplicidade
  IF EXISTS (
    SELECT 1 FROM public.commissions 
    WHERE investment_id = p_investment_id 
      AND level = p_level 
      AND beneficiary_id = p_beneficiary_id
  ) THEN
    RETURN 0;
  END IF;

  -- Verificar limite de 300%
  SELECT * INTO v_progress FROM get_investment_progress(p_beneficiary_id);
  
  IF v_progress.remaining_to_limit <= 0 THEN
    RAISE NOTICE 'Usuário % atingiu limite 300%%', p_beneficiary_id;
    RETURN 0;
  END IF;
  
  -- Determinar valor permitido
  v_allowed_amount := LEAST(p_commission_amount, v_progress.remaining_to_limit);
  
  -- Registrar Comissão e Transação
  INSERT INTO public.commissions (beneficiary_id, source_user_id, investment_id, level, percentage, amount, created_at)
  VALUES (p_beneficiary_id, p_source_user_id, p_investment_id, p_level, p_percentage, v_allowed_amount, NOW());
  
  UPDATE public.users SET commission_balance = commission_balance + v_allowed_amount WHERE id = p_beneficiary_id;
  
  INSERT INTO public.transactions (user_id, type, amount, payment_method, status, data, created_at)
  VALUES (p_beneficiary_id, 'commission', v_allowed_amount, 'system', 'approved', 
    jsonb_build_object('commission_type', '7_level_with_300_limit', 'level', p_level), NOW());
  
  -- LOG
  RAISE NOTICE 'Processando comissão R$ % para usuário %', v_allowed_amount, p_beneficiary_id;

  -- Distribuir entre investimentos ativos
  SELECT COALESCE(SUM((ui.amount * 3) - COALESCE(ui.total_earned, 0)), 0)
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
      -- Calcular proporção
      v_proportion := v_investment.remaining / v_total_remaining;
      v_amount_to_add := v_allowed_amount * v_proportion;
      v_new_total_earned := v_investment.total_earned + v_amount_to_add;
      v_daily_yield_val := v_investment.amount * 0.05;

      -- ⏰ CÁLCULO PRECISO DE REDUÇÃO DE TEMPO
      -- Se rende R$ 50 por dia e ganha R$ 25 de comissão, reduz 0.5 dias (12 horas)
      IF v_daily_yield_val > 0 AND v_investment.end_date IS NOT NULL THEN
        -- Regra de 3: v_daily_yield_val = 1 dia -> v_amount_to_add = X dias
        v_reduction_interval := (v_amount_to_add / v_daily_yield_val) * INTERVAL '1 day';
        
        -- Aplicar redução
        UPDATE public.user_investments
        SET total_earned = v_new_total_earned,
            end_date = GREATEST(NOW(), end_date - v_reduction_interval)
        WHERE id = v_investment.id;
        
        RAISE NOTICE 'Investimento %: Ganho R$ %, Reduzido %', v_investment.id, v_amount_to_add, v_reduction_interval;
      ELSE
        -- Apenas atualiza valor sem mudar data (se algo estiver errado com rendimento)
        UPDATE public.user_investments
        SET total_earned = v_new_total_earned
        WHERE id = v_investment.id;
      END IF;
      
      -- Finalizar se atingiu 300%
      IF v_new_total_earned >= v_investment.total_expected THEN
        UPDATE public.user_investments
        SET status = 'completed', completed_at = NOW()
        WHERE id = v_investment.id;
        RAISE NOTICE 'Investimento % FINALIZADO via comissão!', v_investment.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_allowed_amount;
END;
$$;

-- GARANTIR QUE O TRIGGER ESTÁ ATIVO
DROP TRIGGER IF EXISTS trg_auto_commissions ON public.user_investments;

CREATE TRIGGER trg_auto_commissions
AFTER INSERT ON public.user_investments
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION trigger_auto_distribute_commissions();
