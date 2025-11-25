-- =====================================================
-- SCRIPT COMPLETO - COPIE E COLE TUDO DE UMA VEZ
-- =====================================================

-- PASSO 1: Dropar a função antiga
DROP FUNCTION IF EXISTS distribute_commissions(UUID, DECIMAL, UUID);

-- PASSO 2: Atualizar constraint da tabela commissions
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_level_check;
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_level_check1;

ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_level_check 
CHECK (level >= 1 AND level <= 7);

-- PASSO 3: Criar nova função com 7 níveis
CREATE FUNCTION distribute_commissions(
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
  IF buyer_user_id IS NULL OR investment_amount IS NULL OR investment_id IS NULL THEN
    RAISE EXCEPTION 'Parâmetros inválidos';
  END IF;

  IF investment_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de investimento deve ser maior que zero';
  END IF;

  current_user_id := buyer_user_id;
  
  FOR current_level IN 1..7 LOOP
    SELECT referred_by INTO referrer_id 
    FROM users 
    WHERE id = current_user_id;
    
    IF referrer_id IS NULL THEN
      EXIT;
    END IF;
    
    commission_percentage := CASE current_level
      WHEN 1 THEN 0.10
      WHEN 2 THEN 0.04
      WHEN 3 THEN 0.02
      WHEN 4 THEN 0.01
      WHEN 5 THEN 0.01
      WHEN 6 THEN 0.01
      WHEN 7 THEN 0.01
      ELSE 0.00
    END;
    
    commission_amount := ROUND(investment_amount * commission_percentage, 2);
    
    IF commission_amount <= 0 THEN
      CONTINUE;
    END IF;
    
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
      commission_percentage * 100,
      commission_amount
    );
    
    UPDATE users 
    SET balance = balance + commission_amount 
    WHERE id = referrer_id;
    
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
    
    current_user_id := referrer_id;
  END LOOP;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao distribuir comissões: %', SQLERRM;
    RAISE;
END;
$$;

-- VERIFICAÇÃO: Execute isso depois para confirmar
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'distribute_commissions';
