-- Script para corrigir a função calculate_and_distribute_commissions
-- Execute este script no Editor SQL do Supabase

-- Dropar a função existente se ela existir
DROP FUNCTION IF EXISTS calculate_and_distribute_commissions(UUID, NUMERIC);

-- Criar a função corrigida que passa todos os 6 parâmetros para process_commission_payment_with_limit
CREATE OR REPLACE FUNCTION calculate_and_distribute_commissions(buyer_user_id UUID, investment_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referrer_id UUID;
    v_current_user_id UUID := buyer_user_id;
    v_investment_id UUID := COALESCE((SELECT id FROM user_investments WHERE user_id = buyer_user_id ORDER BY created_at DESC LIMIT 1), gen_random_uuid());
    v_commission_percent NUMERIC;
    v_commission_amount NUMERIC;
    v_level INTEGER;
BEGIN
    -- Níveis de comissão (7 níveis)
    -- Nível 1: 10%
    -- Nível 2: 5%
    -- Nível 3: 3%
    -- Nível 4: 2%
    -- Nível 5: 1%
    -- Nível 6: 1%
    -- Nível 7: 1%
    
    FOR v_level IN 1..7 LOOP
        -- Buscar o indicador do usuário atual
        SELECT referred_by INTO v_referrer_id
        FROM users
        WHERE id = v_current_user_id;
        
        -- Se não houver indicador, parar o loop
        IF v_referrer_id IS NULL THEN
            EXIT;
        END IF;
        
        -- Calcular porcentagem baseada no nível
        CASE v_level
            WHEN 1 THEN v_commission_percent := 10.0;
            WHEN 2 THEN v_commission_percent := 5.0;
            WHEN 3 THEN v_commission_percent := 3.0;
            WHEN 4 THEN v_commission_percent := 2.0;
            WHEN 5 THEN v_commission_percent := 1.0;
            WHEN 6 THEN v_commission_percent := 1.0;
            WHEN 7 THEN v_commission_percent := 1.0;
            ELSE v_commission_percent := 0;
        END CASE;
        
        -- Calcular valor da comissão
        v_commission_amount := investment_amount * (v_commission_percent / 100.0);
        
        -- Chamar process_commission_payment_with_limit com todos os 6 parâmetros
        PERFORM process_commission_payment_with_limit(
            v_referrer_id,                    -- p_beneficiary_id
            v_commission_amount,              -- p_commission_amount
            buyer_user_id,                    -- p_source_user_id
            v_investment_id,                  -- p_investment_id
            v_level,                          -- p_level
            v_commission_percent              -- p_percentage
        );
        
        -- Mover para o próximo nível (o indicador se torna o usuário atual)
        v_current_user_id := v_referrer_id;
    END LOOP;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION calculate_and_distribute_commissions(UUID, NUMERIC) TO authenticated;

-- Verificar se a função foi criada corretamente
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'calculate_and_distribute_commissions';
