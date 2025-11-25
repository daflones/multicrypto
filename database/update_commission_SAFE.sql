-- =====================================================
-- ATUALIZAÇÃO SEGURA: Sistema de Comissões de 7 Níveis
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Verificar constraint atual
-- Execute primeiro para ver o nome da constraint:
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.commissions'::regclass 
AND contype = 'c';

-- PASSO 2: Dropar constraint antiga
-- ATENÇÃO: Substitua 'commissions_level_check' pelo nome real se for diferente
ALTER TABLE public.commissions 
DROP CONSTRAINT IF EXISTS commissions_level_check;

-- Se o nome for diferente, use este formato:
-- ALTER TABLE public.commissions DROP CONSTRAINT nome_da_constraint_aqui;

-- PASSO 3: Adicionar nova constraint para 7 níveis
ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_level_check 
CHECK (level >= 1 AND level <= 7);

-- =====================================================
-- PASSO 4: Criar função de distribuição de comissões
-- =====================================================
CREATE OR REPLACE FUNCTION distribute_commissions(
  buyer_user_id UUID,
  investment_amount DECIMAL,
  investment_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  referrer_id UUID;
  commission_amount DECIMAL;
  commission_percentage DECIMAL;
  current_level INTEGER;
BEGIN
  -- Validar inputs
  IF buyer_user_id IS NULL OR investment_amount IS NULL OR investment_id IS NULL THEN
    RAISE EXCEPTION 'Parâmetros inválidos';
  END IF;

  IF investment_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de investimento deve ser maior que zero';
  END IF;

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
      investment_id,
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
        'investment_id', investment_id,
        'source_user_id', buyer_user_id,
        'level', current_level,
        'percentage', commission_percentage * 100,
        'commission_type', '7_level_system'
      )
    );
    
    -- Mover para o próximo nível
    current_user_id := referrer_id;
  END LOOP;
  
  -- Log de sucesso (opcional)
  RAISE NOTICE 'Comissões distribuídas com sucesso para investimento %', investment_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro
    RAISE WARNING 'Erro ao distribuir comissões: %', SQLERRM;
    RAISE;
END;
$$;

-- =====================================================
-- TESTES E VERIFICAÇÕES
-- =====================================================

-- 1. Verificar se a constraint foi atualizada
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.commissions'::regclass 
AND contype = 'c';

-- 2. Verificar se a função foi criada
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'distribute_commissions';

-- =====================================================
-- EXEMPLO DE USO (COMENTADO - DESCOMENTE PARA TESTAR)
-- =====================================================

-- Teste com valores fictícios:
/*
DO $$
DECLARE
  test_user_id UUID;
  test_investment_id UUID;
BEGIN
  -- Pegar um usuário de teste
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  -- Criar investimento de teste
  INSERT INTO user_investments (user_id, product_id, amount, status)
  VALUES (
    test_user_id,
    (SELECT id FROM products LIMIT 1),
    1000.00,
    'active'
  )
  RETURNING id INTO test_investment_id;
  
  -- Distribuir comissões
  PERFORM distribute_commissions(test_user_id, 1000.00, test_investment_id);
  
  -- Ver resultado
  RAISE NOTICE 'Teste concluído. Investment ID: %', test_investment_id;
END $$;

-- Ver comissões criadas
SELECT * FROM commissions ORDER BY created_at DESC LIMIT 10;
*/

-- =====================================================
-- TABELA DE REFERÊNCIA
-- =====================================================
-- Nível 1: 10% (R$ 100 em R$ 1.000)
-- Nível 2: 4%  (R$ 40 em R$ 1.000)
-- Nível 3: 2%  (R$ 20 em R$ 1.000)
-- Nível 4: 1%  (R$ 10 em R$ 1.000)
-- Nível 5: 1%  (R$ 10 em R$ 1.000)
-- Nível 6: 1%  (R$ 10 em R$ 1.000)
-- Nível 7: 1%  (R$ 10 em R$ 1.000)
-- TOTAL:  20% (R$ 200 em R$ 1.000)
-- =====================================================
