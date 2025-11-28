-- Script OTIMIZADO para forçar pagamento de 5% de rendimento
-- Execute este bloco no Editor SQL do Supabase

BEGIN;
  -- 1. Atualizar total_earned nos investimentos ativos (Acumula o ganho no registro do investimento)
  UPDATE public.user_investments 
  SET total_earned = COALESCE(total_earned, 0) + (amount * 0.05)
  WHERE status = 'active';
  
  -- 2. Atualizar yield_balance dos usuários (Soma ao saldo disponível para saque/reinvestimento)
  UPDATE public.users 
  SET yield_balance = COALESCE(yield_balance, 0) + (
    SELECT COALESCE(SUM(ui.amount * 0.05), 0)
    FROM public.user_investments ui
    WHERE ui.user_id = users.id AND ui.status = 'active'
  )
  WHERE EXISTS (
    SELECT 1 FROM public.user_investments ui 
    WHERE ui.user_id = users.id AND ui.status = 'active'
  );
  
  -- 3. Inserir histórico das transações de rendimento
  INSERT INTO public.transactions (
    user_id, 
    type, 
    amount, 
    payment_method, 
    status, 
    balance_type, 
    created_at,
    data
  )
  SELECT 
    ui.user_id,
    'yield',
    ui.amount * 0.05, -- 5% do valor investido
    'system',
    'approved', -- Status aprovado direto, pois é rendimento automático
    'yield',
    NOW(),
    jsonb_build_object(
      'investment_id', ui.id,
      'product_id', ui.product_id,
      'invested_amount', ui.amount,
      'yield_percentage', 5.0,
      'description', 'Daily yield payment (5%)'
    )
  FROM public.user_investments ui
  WHERE ui.status = 'active';

COMMIT;
