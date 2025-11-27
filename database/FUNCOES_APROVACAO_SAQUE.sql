-- =====================================================
-- FUNÇÕES PARA APROVAÇÃO E REJEIÇÃO DE SAQUES
-- =====================================================

-- Função para aprovar saque
CREATE OR REPLACE FUNCTION approve_withdrawal(transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_fee NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  -- Buscar a transação
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = transaction_id AND type = 'withdraw' AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação de saque não encontrada ou não está pendente';
  END IF;

  -- Calcular taxa (5%)
  v_fee := v_transaction.amount * 0.05;
  v_net_amount := v_transaction.amount - v_fee;

  -- Atualizar status da transação
  UPDATE public.transactions
  SET 
    status = 'approved',
    fee = v_fee,
    updated_at = NOW()
  WHERE id = transaction_id;

  -- Criar notificação para o usuário
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    is_read,
    created_at
  ) VALUES (
    v_transaction.user_id,
    'withdraw_approved',
    'Saque Aprovado',
    'Seu saque de ' || v_transaction.amount::text || ' foi aprovado. Taxa: ' || v_fee::text || '. Valor líquido: ' || v_net_amount::text || '.',
    false,
    NOW()
  );

  RAISE NOTICE 'Saque aprovado com sucesso. ID: %, Valor: %, Taxa: %, Líquido: %', 
    transaction_id, v_transaction.amount, v_fee, v_net_amount;
END;
$$;

-- Função para rejeitar saque
CREATE OR REPLACE FUNCTION reject_withdrawal(
  transaction_id UUID,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_user RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Buscar a transação
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = transaction_id AND type = 'withdraw' AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação de saque não encontrada ou não está pendente';
  END IF;

  -- Buscar dados do usuário
  SELECT * INTO v_user
  FROM public.users
  WHERE id = v_transaction.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Devolver o valor para o saldo correto
  IF v_transaction.balance_type = 'commission' THEN
    v_new_balance := v_user.commission_balance + v_transaction.amount;
    UPDATE public.users
    SET commission_balance = v_new_balance
    WHERE id = v_transaction.user_id;
  ELSE
    v_new_balance := v_user.balance + v_transaction.amount;
    UPDATE public.users
    SET balance = v_new_balance
    WHERE id = v_transaction.user_id;
  END IF;

  -- Atualizar status da transação
  UPDATE public.transactions
  SET 
    status = 'rejected',
    data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('rejection_reason', rejection_reason),
    updated_at = NOW()
  WHERE id = transaction_id;

  -- Criar notificação para o usuário
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    is_read,
    created_at
  ) VALUES (
    v_transaction.user_id,
    'withdraw_rejected',
    'Saque Rejeitado',
    'Seu saque de ' || v_transaction.amount::text || ' foi rejeitado. Motivo: ' || COALESCE(rejection_reason, 'Não especificado') || '. O valor foi devolvido para sua conta.',
    false,
    NOW()
  );

  RAISE NOTICE 'Saque rejeitado com sucesso. ID: %, Valor devolvido: %, Tipo saldo: %', 
    transaction_id, v_transaction.amount, v_transaction.balance_type;
END;
$$;

-- Função para buscar saques pendentes (helper)
CREATE OR REPLACE FUNCTION get_pending_withdrawals()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  amount NUMERIC,
  payment_method TEXT,
  balance_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    u.name as user_name,
    u.email as user_email,
    t.amount,
    t.payment_method,
    t.balance_type,
    t.created_at,
    t.data
  FROM public.transactions t
  JOIN public.users u ON t.user_id = u.id
  WHERE t.type = 'withdraw' AND t.status = 'pending'
  ORDER BY t.created_at ASC;
END;
$$;

-- Verificação
SELECT 'Funções de aprovação de saque criadas com sucesso!' as status;
