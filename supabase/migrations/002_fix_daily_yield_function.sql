-- =====================================================
-- CORREÇÃO: Sistema de Rendimentos - 5% ao dia
-- =====================================================
-- Este script corrige a função de pagamento diário para calcular
-- 5% sobre o valor investido (amount) de forma consistente
-- =====================================================

-- Atualizar a função de pagamento diário de rendimentos
CREATE OR REPLACE FUNCTION pay_daily_yields()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar total_earned nos investimentos ativos
  -- Calcula 5% sobre o amount investido
  UPDATE user_investments 
  SET total_earned = total_earned + (amount * 0.05)
  WHERE status = 'active';
  
  -- Atualizar saldo dos usuários
  -- Soma 5% de cada investimento ativo
  UPDATE users 
  SET balance = balance + (
    SELECT COALESCE(SUM(ui.amount * 0.05), 0)
    FROM user_investments ui
    WHERE ui.user_id = users.id AND ui.status = 'active'
  );
  
  -- Inserir transações de rendimento
  -- Registra 5% do valor investido como rendimento diário
  INSERT INTO transactions (user_id, type, amount, payment_method, status, data)
  SELECT 
    ui.user_id,
    'yield',
    ui.amount * 0.05,  -- 5% do valor investido
    'system',
    'approved',
    jsonb_build_object(
      'investment_id', ui.id,
      'product_id', ui.product_id,
      'invested_amount', ui.amount,
      'yield_percentage', 0.05
    )
  FROM user_investments ui
  WHERE ui.status = 'active';
END;
$$;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Todos os investimentos agora pagam 5% ao dia sobre o valor investido
-- 2. O campo 'daily_yield' da tabela 'products' não é mais usado para cálculo
-- 3. O valor investido está armazenado em 'user_investments.amount'
-- 4. Limites de investimento: R$ 50,00 (mín) a R$ 50.000,00 (máx)
-- 5. ROI mensal: 150% (5% x 30 dias)
-- =====================================================

-- Exemplo de cálculo:
-- Investimento: R$ 1.000,00
-- Rendimento diário: R$ 1.000,00 x 0.05 = R$ 50,00
-- Rendimento mensal: R$ 50,00 x 30 = R$ 1.500,00
-- ROI mensal: (R$ 1.500,00 / R$ 1.000,00) x 100 = 150%
-- =====================================================
