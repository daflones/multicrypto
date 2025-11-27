-- =====================================================
-- SEPARAÇÃO DE SALDOS: Cliente e Comissão
-- =====================================================
-- Adiciona saldo de comissão separado e migra dados existentes
-- =====================================================

-- Adicionar nova coluna para saldo de comissão
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS commission_balance DECIMAL(10,2) DEFAULT 0.00;

-- Comentários nas colunas para clareza
COMMENT ON COLUMN users.balance IS 'Saldo principal do cliente (depósitos + rendimentos)';
COMMENT ON COLUMN users.commission_balance IS 'Saldo de comissões por indicações';

-- Migrar comissões existentes do saldo principal para saldo de comissão
-- Calcular total de comissões já recebidas por cada usuário
UPDATE users 
SET commission_balance = (
  SELECT COALESCE(SUM(t.amount), 0)
  FROM transactions t
  WHERE t.user_id = users.id 
    AND t.type = 'commission'
    AND t.status = 'approved'
);

-- Remover comissões do saldo principal (já foram movidas para commission_balance)
UPDATE users 
SET balance = balance - commission_balance
WHERE commission_balance > 0;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_commission_balance ON users(commission_balance);
CREATE INDEX IF NOT EXISTS idx_transactions_commission ON transactions(type, user_id) WHERE type = 'commission';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. balance = Saldo principal (depósitos + rendimentos)
-- 2. commission_balance = Saldo de comissões (indicações)
-- 3. As funções existentes no Supabase serão usadas:
--    - calculate_and_distribute_commissions()
--    - process_commission_payment()
-- 4. Frontend atualizado para mostrar ambos os saldos
-- =====================================================