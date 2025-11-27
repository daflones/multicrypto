-- =====================================================
-- OTIMIZAÇÃO DAS FUNÇÕES DE COMISSÃO
-- =====================================================
-- Consolida funções duplicadas e corrige inconsistências
-- =====================================================

-- 1. ATUALIZAR calculate_and_distribute_commissions para usar commission_balance
CREATE OR REPLACE FUNCTION calculate_and_distribute_commissions(
  buyer_user_id UUID,
  investment_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  referrer_id UUID;
  commission_amount NUMERIC;
  commission_percentage NUMERIC;
  current_level INTEGER;
  investment_record RECORD;
BEGIN
  -- Validar inputs
  IF buyer_user_id IS NULL OR investment_amount IS NULL THEN
    RAISE EXCEPTION 'Parâmetros inválidos';
  END IF;

  IF investment_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de investimento deve ser maior que zero';
  END IF;

  -- Buscar o investimento mais recente do usuário para pegar o investment_id
  SELECT * INTO investment_record
  FROM user_investments 
  WHERE user_id = buyer_user_id 
  ORDER BY purchase_date DESC 
  LIMIT 1;

  -- Inicializar com o comprador
  current_user_id := buyer_user_id;
  
  -- Loop através dos 7 níveis
  FOR current_level IN 1..7 LOOP
    -- Buscar o referenciador do usuário atual
    SELECT referred_by INTO referrer_id 
    FROM users 
    WHERE id = current_user_id;
    
    -- Se não há referenciador, parar
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
    
    -- Calcular valor da comissão
    commission_amount := ROUND(investment_amount * commission_percentage, 2);
    
    -- Pular se comissão for zero
    IF commission_amount <= 0 THEN
      CONTINUE;
    END IF;
    
    -- Usar a função process_commission_payment para consistência
    PERFORM process_commission_payment(
      referrer_id,
      commission_amount,
      buyer_user_id,
      investment_record.id,
      current_level,
      commission_percentage * 100
    );
    
    -- Mover para o próximo nível
    current_user_id := referrer_id;
  END LOOP;
  
  -- Log de sucesso
  RAISE NOTICE 'Comissões de 7 níveis distribuídas para usuário % com valor %', buyer_user_id, investment_amount;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro
    RAISE WARNING 'Erro ao distribuir comissões: %', SQLERRM;
    RAISE;
END;
$$;

-- 2. ATUALIZAR process_commission_payment para incluir level e percentage
CREATE OR REPLACE FUNCTION process_commission_payment(
  p_beneficiary_id UUID,
  p_amount NUMERIC,
  p_source_user_id UUID,
  p_investment_id UUID,
  p_level INTEGER DEFAULT 1,
  p_percentage NUMERIC DEFAULT 10.0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Inserir registro de comissão
  INSERT INTO commissions (
    beneficiary_id, 
    source_user_id, 
    investment_id, 
    level, 
    percentage, 
    amount
  ) VALUES (
    p_beneficiary_id, 
    p_source_user_id, 
    p_investment_id, 
    p_level, 
    p_percentage, 
    p_amount
  );
  
  -- Atualizar commission_balance do beneficiário (NÃO balance)
  UPDATE users 
  SET commission_balance = COALESCE(commission_balance, 0) + p_amount
  WHERE id = p_beneficiary_id;
  
  -- Registrar transação de comissão
  INSERT INTO transactions (
    user_id, 
    type, 
    amount, 
    payment_method, 
    status, 
    data
  ) VALUES (
    p_beneficiary_id,
    'commission',
    p_amount,
    'system',
    'approved',
    jsonb_build_object(
      'source_user_id', p_source_user_id,
      'investment_id', p_investment_id,
      'level', p_level,
      'percentage', p_percentage,
      'balance_type', 'commission'
    )
  );
END;
$$;

-- 3. REMOVER trigger desnecessário (se existir)
DROP TRIGGER IF EXISTS trigger_distribute_commissions ON user_investments;

-- 4. MANTER notify_new_referral (é útil para notificações)
-- Esta função já está correta e será mantida

-- 5. Função de transferência removida - não será permitida

-- =====================================================
-- RESUMO DAS OTIMIZAÇÕES:
-- =====================================================
-- ✅ calculate_and_distribute_commissions agora usa commission_balance
-- ✅ process_commission_payment consolidado e melhorado
-- ✅ Removido trigger desnecessário
-- ❌ Função de transferência removida (não permitida)
-- ✅ Mantida função de notificação
-- =====================================================
