# 🚀 Guia de Deploy - CryptoYield

## 📋 Pré-requisitos

- Domínio configurado: `multicrypto.com.br`
- Conta no serviço de hospedagem (Vercel, Railway, etc.)
- Variáveis de ambiente configuradas

---

## 🎯 Arquitetura de Deploy

```
Frontend (Vite)          →  Vercel/Netlify
Backend (Express)        →  Railway/Render/Heroku
Webhook DBXBankPay       →  https://multicrypto.com.br/api/webhooks/dbxbankpay
```

---

## 1️⃣ Deploy do Backend (Express)

### Opção A: Railway (Recomendado)

1. **Criar conta no Railway:** https://railway.app
2. **Criar novo projeto:**
   - New Project → Deploy from GitHub
   - Selecionar repositório
   - Root Directory: `/server`

3. **Configurar variáveis de ambiente:**
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   DBXPAY_WEBHOOK_SECRET=seu_webhook_secret
   PORT=3001
   NODE_ENV=production
   ```

4. **Configurar domínio:**
   - Settings → Networking → Custom Domain
   - Adicionar: `multicrypto.com.br`
   - Configurar DNS (A record ou CNAME)

### Opção B: Render

1. **Criar conta no Render:** https://render.com
2. **New Web Service:**
   - Connect repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Adicionar variáveis de ambiente** (mesmo do Railway)

4. **Configurar domínio customizado**

---

## 2️⃣ Deploy do Frontend (Vite)

### Vercel (Recomendado)

1. **Criar conta no Vercel:** https://vercel.com
2. **Import Project:**
   - Conectar repositório GitHub
   - Framework Preset: Vite
   - Root Directory: `/` (raiz do projeto)

3. **Configurar variáveis de ambiente:**
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_anon_key
   VITE_DBXPAY_API_KEY=sua_api_key_dbxpay
   VITE_WEBHOOK_URL=https://multicrypto.com.br/api/webhooks/dbxbankpay
   ```

4. **Deploy automático** configurado!

---

## 3️⃣ Configurar DNS

### No seu provedor de domínio:

**Para Backend (Railway/Render):**
```
Tipo: A ou CNAME
Nome: @ (ou multicrypto.com.br)
Valor: [IP ou domínio fornecido pelo Railway/Render]
```

**Para rota /api (opcional):**
```
Tipo: CNAME
Nome: api
Valor: [domínio do backend]
```

---

## 4️⃣ Configurar DBXBankPay

1. **Acessar painel DBXBankPay**
2. **Configurações → Webhooks**
3. **Adicionar webhook URL:**
   ```
   https://multicrypto.com.br/api/webhooks/dbxbankpay
   ```
4. **Copiar Webhook Secret** e adicionar nas variáveis de ambiente do backend

---

## 5️⃣ Variáveis de Ambiente Completas

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_DBXPAY_API_KEY=dbx_live_sua_key_aqui
VITE_WEBHOOK_URL=https://multicrypto.com.br/api/webhooks/dbxbankpay
VITE_PIX_KEY=sua_chave_pix (opcional)
VITE_BEP20_KEY=seu_endereco_bep20 (opcional)
VITE_TRC20_KEY=seu_endereco_trc20 (opcional)
```

### Backend (server/.env)
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
DBXPAY_WEBHOOK_SECRET=seu_webhook_secret_aqui
PORT=3001
NODE_ENV=production
```

---

## 6️⃣ Testar Deploy

### Checklist:
- [ ] Frontend acessível em `https://multicrypto.com.br`
- [ ] Backend respondendo em `https://multicrypto.com.br/api/webhooks/dbxbankpay`
- [ ] Criar pagamento PIX funciona
- [ ] QR Code é exibido corretamente
- [ ] Webhook recebe notificações do DBXBankPay
- [ ] Saldo é creditado automaticamente após pagamento

### Testar Webhook:
```bash
curl -X POST https://multicrypto.com.br/api/webhooks/dbxbankpay \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.approved","transaction_id":"test123","status":"approved","amount":10}'
```

---

## 🔒 Segurança

- ✅ HTTPS obrigatório (Vercel/Railway fornecem SSL grátis)
- ✅ Validação HMAC no webhook
- ✅ Variáveis de ambiente nunca no código
- ✅ Service Role Key apenas no backend
- ✅ CORS configurado corretamente

---

## 📊 Monitoramento

### Logs do Backend (Railway):
```bash
railway logs
```

### Logs do Frontend (Vercel):
- Dashboard → Deployments → Logs

### Webhook DBXBankPay:
- Painel DBXBankPay → Webhooks → Histórico

---

## ⚠️ Problemas Comuns

### Webhook não recebe notificações:
1. Verificar se URL está acessível publicamente
2. Verificar SSL/HTTPS
3. Verificar logs do backend
4. Testar com curl manualmente

### Pagamento não é criado:
1. Verificar API Key do DBXBankPay
2. Verificar logs do frontend (console)
3. Verificar CPF e dados obrigatórios

### CORS Error:
1. Adicionar domínio do frontend no backend:
   ```javascript
   app.use(cors({
     origin: ['https://multicrypto.com.br', 'http://localhost:3000']
   }));
   ```

---

## 🎉 Deploy Completo!

Após seguir todos os passos, seu sistema estará 100% funcional em produção!
