-- Script para corrigir as funções de aprovação e rejeição de saques
-- Execute este script no Editor SQL do Supabase

-- 0. Dropar funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS approve_withdrawal(UUID);
DROP FUNCTION IF EXISTS reject_withdrawal(UUID, TEXT);

-- 1. Função para APROVAR saque
CREATE OR REPLACE FUNCTION approve_withdrawal(transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
BEGIN
    -- Buscar a transação de saque (qualquer status para debug)
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = transaction_id
      AND type = 'withdrawal';
    
    IF NOT FOUND THEN
        -- Tentar buscar sem filtro de tipo para ver se existe
        SELECT type, status INTO v_transaction
        FROM transactions
        WHERE id = transaction_id;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Transação encontrada mas tipo é "%" e status é "%". Esperado tipo "withdrawal" e status "pending".', v_transaction.type, v_transaction.status;
        ELSE
            RAISE EXCEPTION 'Transação com ID % não existe na tabela transactions.', transaction_id;
        END IF;
    END IF;
    
    -- Verificar se está pendente ou falhou (permite reprocessar)
    IF v_transaction.status NOT IN ('pending', 'failed') THEN
        RAISE EXCEPTION 'Transação não pode ser processada. Status atual: %', v_transaction.status;
    END IF;
    
    -- Atualizar status para aprovado
    UPDATE transactions
    SET status = 'approved',
        data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('approved_at', NOW())
    WHERE id = transaction_id;
    
END;
$$;

-- 2. Função para REJEITAR saque (devolve o saldo ao usuário)
CREATE OR REPLACE FUNCTION reject_withdrawal(transaction_id UUID, reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
    v_user RECORD;
    v_refund_amount NUMERIC;
BEGIN
    -- Buscar a transação de saque (qualquer status para debug)
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = transaction_id
      AND type = 'withdrawal';
    
    IF NOT FOUND THEN
        -- Tentar buscar sem filtro de tipo para ver se existe
        SELECT type, status INTO v_transaction
        FROM transactions
        WHERE id = transaction_id;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Transação encontrada mas tipo é "%" e status é "%". Esperado tipo "withdrawal" e status "pending".', v_transaction.type, v_transaction.status;
        ELSE
            RAISE EXCEPTION 'Transação com ID % não existe na tabela transactions.', transaction_id;
        END IF;
    END IF;
    
    -- Verificar se está pendente ou falhou (permite reprocessar/rejeitar)
    IF v_transaction.status NOT IN ('pending', 'failed') THEN
        RAISE EXCEPTION 'Transação não pode ser processada. Status atual: %', v_transaction.status;
    END IF;
    
    -- Buscar usuário
    SELECT * INTO v_user
    FROM users
    WHERE id = v_transaction.user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Calcular valor a devolver (valor original solicitado)
    -- O totalDeducted no data representa o que foi debitado do saldo
    v_refund_amount := COALESCE((v_transaction.data->>'totalDeducted')::NUMERIC, v_transaction.amount);
    
    -- Devolver o saldo ao usuário baseado no balance_type
    IF v_transaction.balance_type = 'yield' THEN
        UPDATE users
        SET yield_balance = COALESCE(yield_balance, 0) + v_refund_amount
        WHERE id = v_transaction.user_id;
    ELSIF v_transaction.balance_type = 'commission' THEN
        UPDATE users
        SET commission_balance = COALESCE(commission_balance, 0) + v_refund_amount
        WHERE id = v_transaction.user_id;
    ELSE
        UPDATE users
        SET balance = COALESCE(balance, 0) + v_refund_amount
        WHERE id = v_transaction.user_id;
    END IF;
    
    -- Atualizar status da transação para rejeitado
    UPDATE transactions
    SET status = 'rejected',
        rejection_reason = reason,
        data = COALESCE(data, '{}'::jsonb) || jsonb_build_object(
            'rejected_at', NOW(),
            'rejection_reason', reason,
            'refunded_amount', v_refund_amount
        )
    WHERE id = transaction_id;
    
END;
$$;

-- 3. Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION approve_withdrawal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_withdrawal(UUID, TEXT) TO authenticated;

-- Verificar se as funções foram criadas corretamente
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('approve_withdrawal', 'reject_withdrawal');
