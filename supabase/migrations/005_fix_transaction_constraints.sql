-- =====================================================
-- CORREÇÃO DOS CONSTRAINTS DA TABELA TRANSACTIONS
-- =====================================================
-- Adiciona tipos faltantes nos constraints
-- =====================================================

-- 1. Atualizar constraint de type para incluir 'transfer'
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type::text = ANY (ARRAY[
  'deposit'::character varying, 
  'withdrawal'::character varying, 
  'commission'::character varying, 
  'yield'::character varying, 
  'investment'::character varying
]::text[]));

-- 2. Atualizar constraint de payment_method para incluir 'internal'
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method::text = ANY (ARRAY[
  'pix'::character varying, 
  'trc20'::character varying, 
  'bep20'::character varying, 
  'balance'::character varying, 
  'system'::character varying
]::text[]));

-- 3. Atualizar constraint de balance_type para incluir 'main'
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_balance_type_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_balance_type_check 
CHECK (balance_type::text = ANY (ARRAY[
  'yield'::character varying, 
  'commission'::character varying,
  'main'::character varying  -- ✅ ADICIONADO
]::text[]));

-- =====================================================
-- RESUMO DAS CORREÇÕES:
-- =====================================================
-- ✅ type: Mantidos tipos básicos (sem transfer)
-- ✅ payment_method: Mantidos métodos básicos (sem internal)
-- ✅ balance_type: Adicionado 'main'
-- =====================================================
