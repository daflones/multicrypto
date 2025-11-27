# Plano de Implementação de Traduções

## ✅ FASE 1: ARQUIVOS DE TRADUÇÃO (CONCLUÍDO)
- [x] Expandir pt-BR.json com TODOS os termos
- [ ] Copiar estrutura para en-US.json
- [ ] Copiar estrutura para es-ES.json
- [ ] Copiar estrutura para outros idiomas

## 🔄 FASE 2: COMPONENTES PRIORITÁRIOS (EM ANDAMENTO)

### PRIORIDADE ALTA - Visíveis nas screenshots:
1. [ ] **TeamTree.tsx** - Resumo de Comissões, Níveis
2. [ ] **WithdrawForm.tsx** - Informações Importantes, Tipos de saldo
3. [ ] **Profile.tsx** - Código de Convite, Configurações
4. [ ] **ReferralLink.tsx** - Código de convite, Compartilhar
5. [ ] **InvestmentModal.tsx** - Investir Agora, Confirmar
6. [ ] **ProductCard.tsx** - Investimento mínimo, Rendimento

### PRIORIDADE MÉDIA:
7. [ ] **InvestmentList.tsx** - Meus Investimentos
8. [ ] **TransactionHistory.tsx** - Histórico, Filtros
9. [ ] **ChangePasswordModal.tsx**
10. [ ] **ChangePhoneModal.tsx**

### PRIORIDADE BAIXA:
11. [ ] Admin components (se necessário)

## 📋 CHECKLIST DE IMPLEMENTAÇÃO:

Para cada componente:
1. ✅ Ler arquivo completo
2. ✅ Identificar TODOS os textos hardcoded
3. ✅ Adicionar import `useTranslation`
4. ✅ Adicionar hook `const { t } = useTranslation()`
5. ✅ Substituir textos por `t('chave.de.traducao')`
6. ✅ Verificar se todas as chaves existem no pt-BR.json
7. ✅ Testar no navegador

## 🎯 OBJETIVO:
**100% do projeto traduzido para 9 idiomas**

## 📊 PROGRESSO ATUAL:
- Arquivos de tradução: 30% completo
- Componentes traduzidos: 25% completo
- **META: 100% até o final desta sessão**
