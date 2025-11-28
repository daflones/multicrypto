-- 1. Habilitar a extensão pg_cron (Necessário para agendamentos)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar a Função que processa os pagamentos
-- Esta função encapsula a lógica para ser chamada pelo Cron
CREATE OR REPLACE FUNCTION process_daily_yield_5_percent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões de admin
AS $$
BEGIN
    -- A. Atualizar total_earned nos investimentos ativos QUE ESTÃO DENTRO DO PRAZO
    -- Verifica se hoje está entre start_date e end_date
    UPDATE public.user_investments 
    SET total_earned = COALESCE(total_earned, 0) + (amount * 0.05)
    WHERE status = 'active'
      AND start_date <= CURRENT_TIMESTAMP
      AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP);
    
    -- B. Atualizar saldos do usuário (balance E yield_balance)
    -- Soma APENAS dos investimentos válidos hoje
    UPDATE public.users 
    SET 
        yield_balance = COALESCE(yield_balance, 0) + (
            SELECT COALESCE(SUM(ui.amount * 0.05), 0)
            FROM public.user_investments ui
            WHERE ui.user_id = users.id 
              AND ui.status = 'active'
              AND ui.start_date <= CURRENT_TIMESTAMP
              AND (ui.end_date IS NULL OR ui.end_date >= CURRENT_TIMESTAMP)
        ),
        balance = COALESCE(balance, 0) + (
            SELECT COALESCE(SUM(ui.amount * 0.05), 0)
            FROM public.user_investments ui
            WHERE ui.user_id = users.id 
              AND ui.status = 'active'
              AND ui.start_date <= CURRENT_TIMESTAMP
              AND (ui.end_date IS NULL OR ui.end_date >= CURRENT_TIMESTAMP)
        )
    WHERE EXISTS (
        SELECT 1 FROM public.user_investments ui 
        WHERE ui.user_id = users.id 
          AND ui.status = 'active'
          AND ui.start_date <= CURRENT_TIMESTAMP
          AND (ui.end_date IS NULL OR ui.end_date >= CURRENT_TIMESTAMP)
    );
    
    -- C. Gerar histórico de transações
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
        ui.amount * 0.05,
        'system',
        'approved',
        'yield', -- Tipo de saldo impactado visualmente no histórico
        NOW(),
        jsonb_build_object(
            'investment_id', ui.id,
            'product_id', ui.product_id,
            'invested_amount', ui.amount,
            'yield_percentage', 5.0,
            'description', 'Daily automatic yield (5%) - Active Period'
        )
    FROM public.user_investments ui
    WHERE ui.status = 'active'
      AND ui.start_date <= CURRENT_TIMESTAMP
      AND (ui.end_date IS NULL OR ui.end_date >= CURRENT_TIMESTAMP);

END;
$$;

-- 3. Agendar o Cron Job para rodar todo dia às 05:00 AM
-- Remove agendamento anterior para evitar duplicidade se já existir
SELECT cron.unschedule('daily-yield-payout');

SELECT cron.schedule(
    'daily-yield-payout', -- Nome do job (único)
    '0 5 * * *',          -- Horário (05:00 UTC)
    'SELECT process_daily_yield_5_percent()'
);
