-- =====================================================
-- SCRIPT COMPLETO: SISTEMA DE COMISSÕES COM REDUÇÃO DE TEMPO
-- =====================================================
-- Este script contém TODAS as funções necessárias
-- =====================================================

-- 1. Função de Progresso
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
    (ad.invested * 3)::NUMERIC,
    ad.earned,
    0::NUMERIC,
    ad.earned,
    GREATEST(0, (ad.invested * 3) - ad.earned)::NUMERIC,
    CASE 
      WHEN ad.invested > 0 THEN ((ad.earned / (ad.invested * 3)) * 100)::NUMERIC
      ELSE 0::NUMERIC
    END
  FROM active_data ad;
END;
$$;

-- 2. Função de Processamento de Comissão (COM REDUÇÃO DE TEMPO)
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
  v_total_remaining NUMERIC;
  v_proportion NUMERIC;
  v_amount_to_add NUMERIC;
  v_new_total_earned NUMERIC;
  v_reduction_interval INTERVAL;
  v_daily_yield_val NUMERIC;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
  v_investment RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Proteção contra duplicidade
  IF EXISTS (
    SELECT 1 FROM public.commissions 
    WHERE investment_id = p_investment_id 
      AND level = p_level 
      AND beneficiary_id = p_beneficiary_id
  ) THEN
    RAISE NOTICE 'Comissão já paga anteriormente';
    RETURN 0;
  END IF;

  -- Verificar Limite
  SELECT * INTO v_progress FROM get_investment_progress(p_beneficiary_id);
  
  IF v_progress.remaining_to_limit <= 0 THEN
    RAISE NOTICE 'Usuário % atingiu limite de 300%%', p_beneficiary_id;
    RETURN 0;
  END IF;
  
  v_allowed_amount := LEAST(p_commission_amount, v_progress.remaining_to_limit);
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PAGANDO R$ % ao usuário %', v_allowed_amount, p_beneficiary_id;
  
  -- Registrar Comissão
  INSERT INTO public.commissions (beneficiary_id, source_user_id, investment_id, level, percentage, amount, created_at)
  VALUES (p_beneficiary_id, p_source_user_id, p_investment_id, p_level, p_percentage, v_allowed_amount, NOW()::timestamp);
  
  -- Atualizar Saldo
  UPDATE public.users SET commission_balance = commission_balance + v_allowed_amount WHERE id = p_beneficiary_id;
  
  -- Transação
  INSERT INTO public.transactions (user_id, type, amount, payment_method, status, data, created_at)
  VALUES (p_beneficiary_id, 'commission', v_allowed_amount, 'system', 'approved', 
    jsonb_build_object('commission_type', '7_level_with_300_limit', 'level', p_level), NOW()::timestamp);
  
  -- Calcular Total Restante
  SELECT COALESCE(SUM((ui.amount * 3) - COALESCE(ui.total_earned, 0)), 0)::NUMERIC
  INTO v_total_remaining
  FROM public.user_investments ui
  WHERE ui.user_id = p_beneficiary_id 
    AND ui.status = 'active' 
    AND (ui.amount * 3) > COALESCE(ui.total_earned, 0);
  
  RAISE NOTICE 'Total restante nos investimentos: R$ %', v_total_remaining;
  
  -- Distribuir entre Investimentos
  IF v_total_remaining > 0 THEN
    FOR v_investment IN
      SELECT ui.id, ui.amount, COALESCE(ui.total_earned, 0) as total_earned, 
             (ui.amount * 3) as total_expected, 
             (ui.amount * 3) - COALESCE(ui.total_earned, 0) as remaining, 
             ui.end_date
      FROM public.user_investments ui
      WHERE ui.user_id = p_beneficiary_id 
        AND ui.status = 'active' 
        AND (ui.amount * 3) > COALESCE(ui.total_earned, 0)
    LOOP
      v_count := v_count + 1;
      v_proportion := v_investment.remaining / v_total_remaining;
      v_amount_to_add := v_allowed_amount * v_proportion;
      v_new_total_earned := v_investment.total_earned + v_amount_to_add;
      v_daily_yield_val := v_investment.amount * 0.05;

      RAISE NOTICE '  Investimento %: Investido=R$%, Ganho=R$%, Falta=R$%', 
        v_investment.id, v_investment.amount, v_investment.total_earned, v_investment.remaining;

      IF v_daily_yield_val > 0 AND v_investment.end_date IS NOT NULL THEN
        v_reduction_interval := (v_amount_to_add / v_daily_yield_val) * INTERVAL '1 day';
        v_new_end_date := v_investment.end_date - v_reduction_interval;
        
        RAISE NOTICE '    -> Adicionando R$% ao total_earned', v_amount_to_add;
        RAISE NOTICE '    -> Reduzindo % do prazo', v_reduction_interval;
        RAISE NOTICE '    -> Data antiga: %, Nova data: %', v_investment.end_date, v_new_end_date;
        
        -- Se a nova data é hoje ou no passado, finalizar imediatamente
        IF v_new_end_date <= NOW() THEN
          UPDATE public.user_investments
          SET total_earned = v_new_total_earned,
              end_date = NOW(),
              status = 'completed',
              completed_at = NOW()::timestamp
          WHERE id = v_investment.id;
          RAISE NOTICE '    -> INVESTIMENTO FINALIZADO (data atingida)!';
        ELSE
          UPDATE public.user_investments
          SET total_earned = v_new_total_earned,
              end_date = v_new_end_date
          WHERE id = v_investment.id;
        END IF;
      ELSE
        UPDATE public.user_investments
        SET total_earned = v_new_total_earned
        WHERE id = v_investment.id;
      END IF;
      
      -- Verificar se atingiu 300% (além da verificação de data)
      IF v_new_total_earned >= v_investment.total_expected THEN
        UPDATE public.user_investments
        SET status = 'completed', completed_at = NOW()::timestamp
        WHERE id = v_investment.id;
        RAISE NOTICE '    -> INVESTIMENTO FINALIZADO (300%% atingido)!';
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de investimentos atualizados: %', v_count;
  ELSE
    RAISE NOTICE 'Nenhum investimento ativo encontrado para distribuir';
  END IF;
  
  RAISE NOTICE '========================================';
  
  RETURN v_allowed_amount;
END;
$$;

-- 3. Função de Distribuição de Comissões (7 Níveis)
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
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;

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
    RAISE WARNING 'Erro: %', SQLERRM;
    RAISE;
END;
$$;

-- 4. Trigger
CREATE OR REPLACE FUNCTION trigger_auto_distribute_commissions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_and_distribute_commissions(NEW.user_id, NEW.amount);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_commissions ON public.user_investments;

CREATE TRIGGER trg_auto_commissions
AFTER INSERT ON public.user_investments
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION trigger_auto_distribute_commissions();

-- Verificação
SELECT 'Sistema instalado com sucesso!' as status;
