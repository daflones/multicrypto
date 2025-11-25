-- =====================================================
-- CORRIGIR FUNÇÃO COM ASSINATURA CORRETA
-- =====================================================

-- PASSO 1: Dropar todas as versões da função
DROP FUNCTION IF EXISTS calculate_and_distribute_commissions(UUID, DECIMAL, UUID);
DROP FUNCTION IF EXISTS calculate_and_distribute_commissions(UUID, NUMERIC, UUID);
DROP FUNCTION IF EXISTS calculate_and_distribute_commissions(UUID, NUMERIC);
DROP FUNCTION IF EXISTS distribute_commissions(UUID, DECIMAL, UUID);
DROP FUNCTION IF EXISTS distribute_commissions(UUID, NUMERIC, UUID);

-- PASSO 2: Criar função com assinatura que o sistema espera (2 parâmetros)
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
    
    -- Inserir registro de comissão
    INSERT INTO commissions (
      beneficiary_id, 
      source_user_id, 
      investment_id,
      level, 
      percentage, 
      amount
    )
    VALUES (
      referrer_id,
      buyer_user_id,
      investment_record.id, -- usar o ID do investimento encontrado
      current_level,
      commission_percentage * 100, -- Armazenar como 10, 4, 2, 1, etc
      commission_amount
    );
    
    -- Atualizar saldo do beneficiário
    UPDATE users 
    SET balance = balance + commission_amount 
    WHERE id = referrer_id;
    
    -- Criar transação de comissão
    INSERT INTO transactions (
      user_id,
      type,
      amount,
      payment_method,
      status,
      data
    )
    VALUES (
      referrer_id,
      'commission',
      commission_amount,
      'system',
      'approved',
      jsonb_build_object(
        'investment_id', investment_record.id,
        'source_user_id', buyer_user_id,
        'level', current_level,
        'percentage', commission_percentage * 100,
        'commission_type', '7_level_system'
      )
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

-- PASSO 3: Verificar se a função foi criada corretamente
SELECT 
  proname as nome_funcao,
  pg_get_function_arguments(oid) as parametros,
  pg_get_function_result(oid) as retorno
FROM pg_proc 
WHERE proname = 'calculate_and_distribute_commissions';

-- PASSO 4: Teste rápido (descomente para testar)
/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Pegar um usuário de teste
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  -- Testar a função
  PERFORM calculate_and_distribute_commissions(test_user_id, 1000.00);
  
  RAISE NOTICE 'Teste concluído com sucesso!';
END $$;
*/
