# Sistema de Rendimentos - 8% ao Dia

## 📊 Resumo das Mudanças

O sistema foi atualizado para calcular rendimentos baseados em **8% ao dia** sobre o **valor investido pelo usuário**, ao invés de usar valores fixos do produto.

## 🎯 Características Principais

### Limites de Investimento
- **Mínimo:** R$ 50,00
- **Máximo:** R$ 50.000,00
- **Incremento:** R$ 10,00 (slider)
- **Limite de compras:** Removido - usuário pode comprar quantas vezes quiser

### Cálculo de Rendimentos
- **Taxa diária:** 8% sobre o valor investido
- **Rendimento mensal:** 240% (8% × 30 dias)
- **Fórmula:** `rendimento_diário = valor_investido × 0.08`

### Exemplo Prático
```
Investimento: R$ 730,00
Rendimento diário: R$ 730,00 × 0.08 = R$ 58,40
Rendimento mensal: R$ 58,40 × 30 = R$ 1.752,00
ROI mensal: (R$ 1.752,00 / R$ 730,00) × 100 = 240%
```

## 📝 Arquivos Modificados

### Frontend (TypeScript/React)

1. **`src/components/investment/InvestmentModal.tsx`**
   - ✅ Limites fixos: R$ 50 - R$ 50.000
   - ✅ Cálculo de rendimento: 8% sobre `investAmount`
   - ✅ Atualização em tempo real ao mover o slider
   - ✅ Validação de saldo insuficiente

2. **`src/services/investment.service.ts`**
   - ✅ `calculateDailyYields()`: Usa `amount × 0.08`
   - ✅ `getInvestmentStats()`: Calcula `dailyYield` como 8% do total investido

3. **`src/services/investment-expiration.service.ts`**
   - ✅ `computeEarnedSoFar()`: Calcula rendimentos acumulados com 8%

### Backend (SQL)

4. **`database/update_yield_calculation.sql`** (NOVO)
   - 📄 Script SQL para atualizar a função `pay_daily_yields()`
   - ⚠️ **IMPORTANTE:** Este script precisa ser executado no Supabase

## ⚠️ Ações Necessárias no Backend

### Executar no Supabase SQL Editor

```sql
-- Atualizar a função de pagamento diário
CREATE OR REPLACE FUNCTION pay_daily_yields()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar total_earned (8% sobre amount)
  UPDATE user_investments 
  SET total_earned = total_earned + (amount * 0.08)
  WHERE status = 'active';
  
  -- Atualizar saldo dos usuários
  UPDATE users 
  SET balance = balance + (
    SELECT COALESCE(SUM(ui.amount * 0.08), 0)
    FROM user_investments ui
    WHERE ui.user_id = users.id AND ui.status = 'active'
  );
  
  -- Inserir transações de rendimento
  INSERT INTO transactions (user_id, type, amount, payment_method, status, data)
  SELECT 
    ui.user_id,
    'yield',
    ui.amount * 0.08,
    'system',
    'approved',
    jsonb_build_object(
      'investment_id', ui.id,
      'product_id', ui.product_id,
      'invested_amount', ui.amount,
      'yield_percentage', 0.08
    )
  FROM user_investments ui
  WHERE ui.status = 'active';
END;
$$;
```

## 🔍 Campos do Banco de Dados

### Tabela `user_investments`
- **`amount`**: Valor investido pelo usuário (usado para cálculo)
- **`total_earned`**: Total acumulado de rendimentos
- **`status`**: 'active' | 'completed' | 'cancelled'

### Tabela `products`
- **`daily_yield`**: ⚠️ Não é mais usado para cálculo de rendimentos
- **`min_investment`**: Ignorado (fixo em R$ 50)
- **`max_investment`**: Ignorado (fixo em R$ 50.000)

### Tabela `transactions`
- **`type`**: 'yield' para rendimentos diários
- **`amount`**: Valor do rendimento (8% do investimento)
- **`data`**: JSON com detalhes do investimento

## 🧪 Testando o Sistema

### 1. Testar no Frontend
1. Abrir modal de investimento
2. Mover o slider entre R$ 50 e R$ 50.000
3. Verificar que os rendimentos atualizam em tempo real
4. Confirmar que ROI mensal sempre mostra ~240%

### 2. Testar Pagamento Diário
```sql
-- Executar manualmente no Supabase
SELECT pay_daily_yields();

-- Verificar transações criadas
SELECT * FROM transactions 
WHERE type = 'yield' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Verificar Estatísticas
```typescript
// No código frontend
const stats = await InvestmentService.getInvestmentStats(userId);
console.log('Daily Yield:', stats.dailyYield); // Deve ser 8% do totalInvested
```

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Base de cálculo | `product.daily_yield` fixo | `amount × 0.08` |
| Limites | Configuráveis por produto | Fixo: R$ 50 - R$ 50.000 |
| Rendimento | Variável por produto | 8% para todos |
| ROI mensal | Variável | 240% fixo |

## 🚀 Próximos Passos

1. ✅ Atualizar frontend (concluído)
2. ⏳ Executar script SQL no Supabase
3. ⏳ Testar pagamentos diários
4. ⏳ Validar com investimentos reais
5. ⏳ Monitorar logs de transações

## 📞 Suporte

Se houver dúvidas sobre a implementação:
- Verificar logs do console no navegador
- Checar transações no Supabase Dashboard
- Revisar este documento para referência
