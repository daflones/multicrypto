-- =====================================================
-- AUTOMAÇÃO TOTAL: TRIGGER DE COMISSÕES E REDUÇÃO DE PRAZO
-- =====================================================

-- 1. Atualizar função de pagamento para evitar duplicidade
-- (Isso impede que pague duas vezes se o site e o banco tentarem processar juntos)
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
  -- 🛡️ PROTEÇÃO: Verificar se já existe comissão paga para este investimento e nível
  IF EXISTS (
    SELECT 1 FROM public.commissions 
    WHERE investment_id = p_investment_id 
      AND level = p_level 
      AND beneficiary_id = p_beneficiary_id
  ) THEN
    -- Já pago, ignora silenciosamente
    RETURN 0;
  END IF;

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
  
  -- ⚡ FINALIZAÇÃO ANTECIPADA: Distribuir comissão entre produtos ativos
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
      
      -- ⬇️ REDUZIR DIAS DO INVESTIMENTO
      DECLARE
        v_daily_yield_val NUMERIC;
        v_days_to_reduce INTEGER;
        v_new_end_date_val TIMESTAMP WITH TIME ZONE;
      BEGIN
        v_daily_yield_val := v_investment.amount * 0.05;
        
        IF v_daily_yield_val > 0 THEN
          -- Calcula quantos dias a comissão paga
          v_days_to_reduce := FLOOR(v_amount_to_add / v_daily_yield_val)::INTEGER;
          
          IF v_days_to_reduce > 0 AND v_investment.end_date IS NOT NULL THEN
            -- Subtrai os dias da data final
            v_new_end_date_val := v_investment.end_date - (v_days_to_reduce || ' days')::INTERVAL;
            
            -- Não permite data no passado (mínimo é agora)
            IF v_new_end_date_val < NOW() THEN 
              v_new_end_date_val := NOW(); 
            END IF;
          ELSE
            v_new_end_date_val := v_investment.end_date;
          END IF;
        ELSE
          v_new_end_date_val := v_investment.end_date;
        END IF;

        -- Atualiza o investimento com novo total e nova data
        UPDATE public.user_investments
        SET total_earned = v_new_total_earned,
            end_date = v_new_end_date_val
        WHERE id = v_investment.id;
      END;
      
      -- Verifica se finalizou
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

-- 2. Criar Função do Trigger
CREATE OR REPLACE FUNCTION trigger_auto_distribute_commissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Chama a distribuição automaticamente quando um investimento é criado
  PERFORM calculate_and_distribute_commissions(NEW.user_id, NEW.amount);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar Trigger na tabela user_investments
DROP TRIGGER IF EXISTS trg_auto_commissions ON public.user_investments;

CREATE TRIGGER trg_auto_commissions
AFTER INSERT ON public.user_investments
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION trigger_auto_distribute_commissions();

-- Confirmação
SELECT 'Automação Ativada com Sucesso!' as status;
