-- =====================================================
-- ATUALIZAÇÃO: Sistema de Comissões de 7 Níveis
-- =====================================================
-- Este script atualiza o sistema de comissões para 7 níveis
-- Níveis: 10%, 4%, 2%, 1%, 1%, 1%, 1% = 20% total
-- =====================================================

-- 1. Atualizar constraint da tabela commissions para aceitar níveis 1-7
-- Primeiro, dropar a constraint antiga (pode ter nome diferente dependendo do Supabase)
DO $$ 
BEGIN
    -- Tentar dropar possíveis nomes de constraint
    ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_level_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_level_check1;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Adicionar nova constraint para níveis 1-7
ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_level_check 
CHECK (level = ANY (ARRAY[1, 2, 3, 4, 5, 6, 7]));

-- =====================================================
-- 2. Função para distribuir comissões em 7 níveis
-- =====================================================
CREATE OR REPLACE FUNCTION distribute_commissions(
  buyer_user_id UUID,
  investment_amount DECIMAL,
  investment_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  referrer_id UUID;
  commission_amount DECIMAL;
  commission_percentage DECIMAL;
  current_level INTEGER;
BEGIN
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
    CASE current_level
      WHEN 1 THEN commission_percentage := 0.10; -- 10%
      WHEN 2 THEN commission_percentage := 0.04; -- 4%
      WHEN 3 THEN commission_percentage := 0.02; -- 2%
      WHEN 4 THEN commission_percentage := 0.01; -- 1%
      WHEN 5 THEN commission_percentage := 0.01; -- 1%
      WHEN 6 THEN commission_percentage := 0.01; -- 1%
      WHEN 7 THEN commission_percentage := 0.01; -- 1%
      ELSE commission_percentage := 0.00;
    END CASE;
    
    -- Calcular valor da comissão
    commission_amount := investment_amount * commission_percentage;
    
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
      commission_percentage * 100, -- Converter para porcentagem (10, 4, 2, 1, etc)
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
        'percentage', commission_percentage * 100
      )
    );
    
    -- Mover para o próximo nível (referenciador se torna o usuário atual)
    current_user_id := referrer_id;
  END LOOP;
END;
$$;

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================
-- SELECT distribute_commissions(
--   'user_id_do_comprador'::UUID,
--   1000.00, -- valor do investimento
--   'investment_id'::UUID
-- );

-- =====================================================
-- TABELA DE COMISSÕES POR NÍVEL:
-- =====================================================
-- Nível 1: 10% (direto)
-- Nível 2: 4%
-- Nível 3: 2%
-- Nível 4: 1%
-- Nível 5: 1%
-- Nível 6: 1%
-- Nível 7: 1%
-- TOTAL: 20%
--
-- Exemplo com investimento de R$ 1.000,00:
-- Nível 1: R$ 100,00
-- Nível 2: R$ 40,00
-- Nível 3: R$ 20,00
-- Nível 4: R$ 10,00
-- Nível 5: R$ 10,00
-- Nível 6: R$ 10,00
-- Nível 7: R$ 10,00
-- TOTAL: R$ 200,00 (20%)
-- =====================================================

-- =====================================================
-- VERIFICAÇÃO:
-- =====================================================
-- Ver comissões de um usuário específico:
-- SELECT * FROM commissions WHERE beneficiary_id = 'user_id' ORDER BY created_at DESC;
--
-- Ver estatísticas de comissões por nível:
-- SELECT 
--   level,
--   COUNT(*) as total_comissoes,
--   SUM(amount) as total_valor,
--   AVG(amount) as media_valor
-- FROM commissions
-- GROUP BY level
-- ORDER BY level;
-- =====================================================
