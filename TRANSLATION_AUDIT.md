# Auditoria de Traduções - CryptoYield

## 📋 ARQUIVOS QUE PRECISAM DE TRADUÇÃO

### ✅ JÁ TRADUZIDOS:
- [x] Login.tsx
- [x] Register.tsx  
- [x] RegisterForm.tsx
- [x] LoginForm.tsx
- [x] About.tsx
- [x] BottomNavigation.tsx
- [x] MobileNavbar.tsx

### ❌ PRECISAM SER TRADUZIDOS:

#### 🏠 PÁGINAS PRINCIPAIS:
- [ ] Home.tsx - Parcialmente traduzido (falta "Overview", "Deposit + Total Earned")
- [ ] Invest.tsx - Traduzido
- [ ] MyInvestments.tsx - Traduzido
- [ ] Team.tsx - Traduzido (mas componentes filhos não)
- [ ] Profile.tsx - Parcialmente traduzido
- [ ] Deposit.tsx - Parcialmente traduzido
- [ ] Withdraw.tsx - Parcialmente traduzido

#### 👥 COMPONENTES DE TEAM:
- [ ] TeamTree.tsx - NÃO TRADUZIDO
  - "Resumo de Comissões"
  - "Total de Comissões"
  - "Este mês"
  - "Nível 1 - Diretos"
  - "Nenhum membro neste nível ainda"
  - "membros"
  
- [ ] ReferralLink.tsx - NÃO TRADUZIDO
  - "Código de Convite"
  - "Compartilhe este código para convidar amigos"
  - "Copiar código"

#### 💰 COMPONENTES DE INVESTIMENTO:
- [ ] InvestmentModal.tsx - NÃO TRADUZIDO
  - "Investir Agora"
  - "Valor do investimento"
  - "Rendimento diário"
  - "ROI total"
  - "Duração"
  - "Rendimento total"
  - "Confirmar Investimento"
  
- [ ] InvestmentList.tsx - NÃO TRADUZIDO
  - "Meus Investimentos"
  - "Ver produtos"
  
- [ ] ProductCard.tsx - NÃO TRADUZIDO
  - "Investimento mínimo"
  - "Rendimento diário"
  - "Duração"
  - "ROI total"

#### 💳 COMPONENTES FINANCEIROS:
- [ ] WithdrawForm.tsx - PARCIALMENTE TRADUZIDO
  - "Saldo Disponível"
  - "Tipo de saldo para saque"
  - "Saldo Principal"
  - "Saldo de Comissão"
  - "Valor do saque"
  - "Método de recebimento"
  - "Tipo da Chave PIX"
  - "Chave PIX"
  - "Digite sua chave PIX"
  - "Informações Importantes"
  - "Taxa de saque: 5% sobre o valor solicitado"
  - "Mínimo: R$ 50,00"
  - "Máximo: R$ 10.000,00"
  - "Saques permitidos apenas às segundas-feiras"
  - "Necessário ter investimento ativo"
  - "Solicitar Saque"
  
- [ ] DepositFormDBX.tsx - PARCIALMENTE TRADUZIDO
  - Vários textos hardcoded

#### 👤 COMPONENTES DE PERFIL:
- [ ] Profile.tsx - PARCIALMENTE TRADUZIDO
  - "Código de Convite"
  - "Compartilhe este código para convidar amigos"
  - "Configurações de Conta"
  - "Alterar Senha"
  - "Alterar Telefone"
  - "Histórico de Transações"
  - "Precisa de Ajuda?"
  - "Falar com Suporte (WhatsApp)"
  - "Entrar no Grupo do WhatsApp"
  - "Sair da Conta"
  
- [ ] TransactionHistory.tsx - NÃO TRADUZIDO
  - "Histórico de Transações"
  - "Todas"
  - "Depósitos"
  - "Saques"
  - "Investimentos"
  - "Nenhuma transação encontrada"
  
- [ ] ChangePasswordModal.tsx - NÃO TRADUZIDO
- [ ] ChangePhoneModal.tsx - NÃO TRADUZIDO

#### 🔔 OUTROS COMPONENTES:
- [ ] NotificationBell.tsx - NÃO TRADUZIDO

#### 🎯 ADMIN (se aplicável):
- [ ] AdminSidebar.tsx
- [ ] UsersSection.tsx
- [ ] TransactionsSection.tsx
- [ ] InvestmentsSection.tsx
- [ ] WithdrawalsSection.tsx
- [ ] ProductsSection.tsx
- [ ] SettingsSection.tsx
- [ ] AnalyticsSection.tsx

## 📝 TERMOS FALTANTES NOS ARQUIVOS DE TRADUÇÃO:

### pt-BR.json - ADICIONAR:
```json
{
  "profile": {
    "referralCode": "Código de Convite",
    "shareReferralCode": "Compartilhe este código para convidar amigos",
    "accountSettings": "Configurações de Conta",
    "changePassword": "Alterar Senha",
    "changePhone": "Alterar Telefone",
    "transactionHistory": "Histórico de Transações",
    "needHelp": "Precisa de Ajuda?",
    "contactSupport": "Falar com Suporte (WhatsApp)",
    "joinWhatsAppGroup": "Entrar no Grupo do WhatsApp",
    "logoutAccount": "Sair da Conta"
  },
  "withdraw": {
    "balanceType": "Tipo de saldo para saque",
    "mainBalance": "Saldo Principal",
    "commissionBalance": "Saldo de Comissão",
    "withdrawAmount": "Valor do saque",
    "paymentMethod": "Método de recebimento",
    "pixKeyType": "Tipo da Chave PIX",
    "enterPixKey": "Digite sua chave PIX",
    "importantInfo": "Informações Importantes",
    "withdrawFee": "Taxa de saque: 5% sobre o valor solicitado",
    "minAmount": "Mínimo: R$ 50,00",
    "maxAmount": "Máximo: R$ 10.000,00",
    "mondayOnly": "Saques permitidos apenas às segundas-feiras",
    "activeInvestmentRequired": "Necessário ter investimento ativo"
  }
}
```

## 🎯 PRIORIDADES:
1. **ALTA**: TeamTree.tsx, WithdrawForm.tsx, Profile.tsx
2. **MÉDIA**: InvestmentModal.tsx, ProductCard.tsx, TransactionHistory.tsx
3. **BAIXA**: Admin components

## 📊 ESTATÍSTICAS:
- Total de arquivos: ~43 TSX
- Traduzidos: ~10 (23%)
- Parcialmente traduzidos: ~8 (19%)
- Não traduzidos: ~25 (58%)
