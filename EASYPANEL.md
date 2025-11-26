# 🚀 Deploy no EasyPanel - CryptoYield

## 📋 Passo a Passo

### 1️⃣ Preparar Repositório

1. **Commit e push do código:**
   ```bash
   git add .
   git commit -m "Preparar para deploy no EasyPanel"
   git push origin main
   ```

---

### 2️⃣ Configurar no EasyPanel

1. **Acessar EasyPanel:** https://easypanel.io
2. **Criar novo projeto:**
   - New Project → From GitHub
   - Selecionar repositório: `CryptoYield`
   - Branch: `main`

3. **Configurar Build:**
   - **Build Method:** Dockerfile
   - **Dockerfile Path:** `./Dockerfile`
   - **Port:** `3001`

---

### 3️⃣ Variáveis de Ambiente

Adicionar as seguintes variáveis no EasyPanel:

#### **Backend:**
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
DBXPAY_WEBHOOK_SECRET=seu_webhook_secret_aqui
PORT=3001
NODE_ENV=production
```

#### **Frontend (build time):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_DBXPAY_API_KEY=dbx_live_sua_key_aqui
VITE_WEBHOOK_URL=https://multicrypto.com.br/api/webhooks/dbxbankpay
```

---

### 4️⃣ Configurar Domínio

1. **No EasyPanel:**
   - Settings → Domains
   - Adicionar: `multicrypto.com.br`
   - SSL automático ✅

2. **No provedor de DNS:**
   - Tipo: `A` ou `CNAME`
   - Nome: `@` (ou `multicrypto.com.br`)
   - Valor: `[IP fornecido pelo EasyPanel]`

---

### 5️⃣ Deploy

1. **Fazer deploy:**
   - No EasyPanel, clicar em "Deploy"
   - Aguardar build (pode levar 2-5 minutos)

2. **Verificar logs:**
   - Logs → Ver se aparece:
     ```
     🚀 Servidor rodando na porta 3001
     📡 Webhook URL: https://multicrypto.com.br/api/webhooks/dbxbankpay
     ```

---

### 6️⃣ Configurar DBXBankPay

1. **Acessar painel DBXBankPay**
2. **Configurações → Webhooks**
3. **Adicionar URL:**
   ```
   https://multicrypto.com.br/api/webhooks/dbxbankpay
   ```
4. **Copiar Webhook Secret** e adicionar nas variáveis de ambiente

---

## ✅ Checklist Final

- [ ] Código commitado e pushed
- [ ] Projeto criado no EasyPanel
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado
- [ ] Deploy realizado com sucesso
- [ ] Frontend acessível em `https://multicrypto.com.br`
- [ ] API respondendo em `https://multicrypto.com.br/api/health`
- [ ] Webhook configurado no DBXBankPay
- [ ] Teste de pagamento PIX funcionando

---

## 🧪 Testar Aplicação

### 1. Testar Frontend:
```
https://multicrypto.com.br
```

### 2. Testar API:
```bash
curl https://multicrypto.com.br/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T...",
  "service": "CryptoYield API"
}
```

### 3. Testar Webhook (manual):
```bash
curl -X POST https://multicrypto.com.br/api/webhooks/dbxbankpay \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.approved",
    "transaction_id": "test123",
    "external_reference": "user_test_123",
    "status": "approved",
    "amount": 10
  }'
```

### 4. Testar Pagamento PIX:
1. Acessar `/deposit`
2. Inserir valor (mínimo R$ 10,00)
3. Clicar em "Continuar"
4. Verificar se QR Code aparece
5. Fazer pagamento PIX
6. Verificar se saldo é creditado automaticamente

---

## 📊 Monitoramento

### Logs em tempo real:
```
EasyPanel → Seu Projeto → Logs
```

### Métricas:
- CPU Usage
- Memory Usage
- Network Traffic
- Request Count

---

## 🔧 Troubleshooting

### Build falha:
- Verificar logs de build
- Verificar se todas as dependências estão no `package.json`
- Verificar se `Dockerfile` está correto

### Aplicação não inicia:
- Verificar variáveis de ambiente
- Verificar logs do container
- Verificar porta (deve ser 3001)

### Webhook não funciona:
- Verificar se URL está acessível: `https://multicrypto.com.br/api/webhooks/dbxbankpay`
- Verificar SSL/HTTPS
- Verificar logs quando webhook é chamado
- Testar com curl manualmente

### Frontend não carrega:
- Verificar se build foi feito corretamente
- Verificar se `dist/` existe
- Verificar rota `*` no Express

---

## 🎉 Pronto!

Seu sistema está 100% funcional em produção no EasyPanel!

**URL:** https://multicrypto.com.br
**API:** https://multicrypto.com.br/api
**Webhook:** https://multicrypto.com.br/api/webhooks/dbxbankpay
