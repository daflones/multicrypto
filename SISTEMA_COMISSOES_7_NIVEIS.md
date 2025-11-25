# Sistema de Comissões - 7 Níveis

## 📊 Resumo das Mudanças

O sistema de comissões foi expandido de **3 níveis** para **7 níveis**, aumentando o total de comissões de 18% para **20%**.

## 🎯 Estrutura de Comissões

### Distribuição por Nível

| Nível | Percentual | Descrição |
|-------|-----------|-----------|
| **Nível 1** | 10% | Diretos - pessoas que você convidou |
| **Nível 2** | 4% | Indiretos - convidados dos seus diretos |
| **Nível 3** | 2% | Terceiro nível da rede |
| **Nível 4** | 1% | Quarto nível da rede |
| **Nível 5** | 1% | Quinto nível da rede |
| **Nível 6** | 1% | Sexto nível da rede |
| **Nível 7** | 1% | Sétimo nível da rede |
| **TOTAL** | **20%** | Comissão total sobre investimentos |

### Exemplo Prático

**Investimento de R$ 1.000,00:**
- Nível 1: R$ 100,00 (10%)
- Nível 2: R$ 40,00 (4%)
- Nível 3: R$ 20,00 (2%)
- Nível 4: R$ 10,00 (1%)
- Nível 5: R$ 10,00 (1%)
- Nível 6: R$ 10,00 (1%)
- Nível 7: R$ 10,00 (1%)
- **Total distribuído: R$ 200,00 (20%)**

## 📝 Arquivos Modificados

### Frontend (TypeScript/React)

#### 1. **Constantes** (`src/utils/constants.ts`)
```typescript
export const COMMISSION_RATES = {
  LEVEL_1: 0.10, // 10%
  LEVEL_2: 0.04, // 4%
  LEVEL_3: 0.02, // 2%
  LEVEL_4: 0.01, // 1%
  LEVEL_5: 0.01, // 1%
  LEVEL_6: 0.01, // 1%
  LEVEL_7: 0.01  // 1%
  // Total: 20%
};
```

#### 2. **Serviço de Comissões** (`src/services/commission.service.ts`)
- ✅ `calculateCommissions()`: Calcula comissões para 7 níveis
- ✅ `getReferrerChain()`: Busca até 7 níveis de referenciadores
- ✅ `getCommissionStats()`: Estatísticas incluem níveis 4-7
- ✅ `getTeamStats()`: Conta membros em todos os 7 níveis

#### 3. **Serviço de Autenticação** (`src/services/auth.service.ts`)
- ✅ `getReferralTree()`: Busca árvore de referências com 7 níveis

#### 4. **Interface Commission** (`src/services/supabase.ts`)
```typescript
export interface Commission {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  // ... outros campos
}
```

#### 5. **Componente TeamTree** (`src/components/team/TeamTree.tsx`)
- ✅ Exibe todos os 7 níveis de equipe
- ✅ Mostra estatísticas de comissões por nível
- ✅ Cards expansíveis para cada nível
- ✅ Percentuais corretos (10%, 4%, 2%, 1%, 1%, 1%, 1%)

#### 6. **Componente ReferralLink** (`src/components/team/ReferralLink.tsx`)
- ✅ Estrutura visual dos 7 níveis
- ✅ Total atualizado para 20%
- ✅ Layout responsivo com grid para níveis 4-7

### Backend (SQL)

#### 7. **Script SQL** (`database/update_commission_system_7_levels.sql`)
- ✅ Atualiza constraint da tabela `commissions`
- ✅ Função `distribute_commissions()` para 7 níveis
- ✅ Cálculo automático de comissões
- ✅ Criação de transações para cada comissão

## 🔧 Implementação Técnica

### Fluxo de Distribuição de Comissões

1. **Usuário faz investimento** → Valor: R$ 1.000,00
2. **Sistema busca cadeia de referências** → Até 7 níveis acima
3. **Calcula comissão por nível:**
   - Nível 1: R$ 1.000 × 10% = R$ 100
   - Nível 2: R$ 1.000 × 4% = R$ 40
   - Nível 3: R$ 1.000 × 2% = R$ 20
   - Níveis 4-7: R$ 1.000 × 1% = R$ 10 cada
4. **Credita saldo** de cada beneficiário
5. **Cria registro** na tabela `commissions`
6. **Cria transação** do tipo `commission`

### Estrutura de Dados

```sql
-- Tabela commissions
CREATE TABLE commissions (
  id UUID PRIMARY KEY,
  beneficiary_id UUID REFERENCES users(id),
  source_user_id UUID REFERENCES users(id),
  investment_id UUID REFERENCES user_investments(id),
  level INTEGER CHECK (level IN (1,2,3,4,5,6,7)),
  percentage DECIMAL,
  amount DECIMAL,
  created_at TIMESTAMP
);
```

## 🚀 Como Usar

### No Frontend

```typescript
// Calcular comissões ao criar investimento
await CommissionService.calculateCommissions(
  userId,
  investmentAmount,
  investmentId
);

// Buscar estatísticas de comissões
const stats = await CommissionService.getCommissionStats(userId);
// Retorna: { level1Total, level2Total, ..., level7Total, totalCommissions }

// Buscar estatísticas da equipe
const teamStats = await CommissionService.getTeamStats(userId);
// Retorna: { level1Count, level2Count, ..., level7Count, totalTeamSize }
```

### No Backend (SQL)

```sql
-- Distribuir comissões manualmente
SELECT distribute_commissions(
  'user_id_do_comprador'::UUID,
  1000.00, -- valor do investimento
  'investment_id'::UUID
);

-- Ver comissões de um usuário
SELECT * FROM commissions 
WHERE beneficiary_id = 'user_id' 
ORDER BY created_at DESC;

-- Estatísticas por nível
SELECT 
  level,
  COUNT(*) as total_comissoes,
  SUM(amount) as total_valor,
  AVG(amount) as media_valor
FROM commissions
GROUP BY level
ORDER BY level;
```

## ⚠️ Ações Necessárias

### 1. Executar Script SQL no Supabase

```sql
-- Copiar e executar o conteúdo de:
database/update_commission_system_7_levels.sql
```

### 2. Verificar Funcionamento

1. Criar um investimento de teste
2. Verificar se comissões foram distribuídas corretamente
3. Conferir saldos dos beneficiários
4. Validar registros na tabela `commissions`

### 3. Testar Interface

1. Acessar página "Minha Equipe"
2. Verificar se todos os 7 níveis aparecem
3. Confirmar percentuais corretos
4. Testar expansão/colapso dos níveis
5. Validar estatísticas de comissões

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes (3 níveis) | Depois (7 níveis) |
|---------|------------------|-------------------|
| **Níveis** | 3 | 7 |
| **Nível 1** | 10% | 10% |
| **Nível 2** | 5% | 4% |
| **Nível 3** | 3% | 2% |
| **Nível 4** | - | 1% |
| **Nível 5** | - | 1% |
| **Nível 6** | - | 1% |
| **Nível 7** | - | 1% |
| **Total** | 18% | **20%** |

## 🎨 Interface Visual

### Página de Equipe

**Resumo de Comissões:**
- Grid 3 colunas para níveis 1-3 (maiores)
- Grid 4 colunas para níveis 4-7 (menores)
- Total de comissões em destaque
- Comissões do mês atual

**Árvore de Equipe:**
- 7 cards expansíveis (um por nível)
- Badge com número do nível
- Percentual de comissão visível
- Contador de membros
- Lista de membros com detalhes

**Link de Convite:**
- Estrutura visual dos 7 níveis
- Níveis 1-3 em cards maiores
- Níveis 4-7 em grid compacto
- Total de 20% em destaque

## 🔍 Monitoramento

### Queries Úteis

```sql
-- Total de comissões por usuário
SELECT 
  u.email,
  COUNT(c.id) as total_comissoes,
  SUM(c.amount) as total_ganho
FROM users u
LEFT JOIN commissions c ON c.beneficiary_id = u.id
GROUP BY u.id, u.email
ORDER BY total_ganho DESC;

-- Comissões por nível (global)
SELECT 
  level,
  COUNT(*) as quantidade,
  SUM(amount) as total,
  AVG(amount) as media
FROM commissions
GROUP BY level
ORDER BY level;

-- Usuários com mais membros na rede
SELECT 
  u.email,
  u.referral_code,
  COUNT(DISTINCT r.id) as total_referidos
FROM users u
LEFT JOIN users r ON r.referred_by = u.id
GROUP BY u.id, u.email, u.referral_code
ORDER BY total_referidos DESC
LIMIT 10;
```

## ✅ Checklist de Implementação

- [x] Atualizar constantes de comissão
- [x] Modificar serviço de comissões
- [x] Atualizar interface Commission
- [x] Expandir getReferralTree para 7 níveis
- [x] Atualizar componente TeamTree
- [x] Atualizar componente ReferralLink
- [x] Criar script SQL para banco de dados
- [x] Documentar mudanças
- [ ] Executar script SQL no Supabase
- [ ] Testar distribuição de comissões
- [ ] Validar interface visual
- [ ] Monitorar logs e erros

## 📞 Suporte

Em caso de dúvidas:
1. Verificar logs do console no navegador
2. Checar transações no Supabase Dashboard
3. Revisar este documento para referência
4. Testar com investimentos de valores pequenos primeiro
