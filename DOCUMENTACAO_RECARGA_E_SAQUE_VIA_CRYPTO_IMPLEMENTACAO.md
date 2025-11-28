# 📘 Documentação de Implementação - Sistema de Criptomoedas DBXPay

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Depósitos em Criptomoedas](#depósitos-em-criptomoedas)
4. [Saques em Criptomoedas](#saques-em-criptomoedas)
5. [Conversão Crypto para PIX](#conversão-crypto-para-pix)
6. [Configuração do Sistema](#configuração-do-sistema)
7. [Fluxo de Transações](#fluxo-de-transações)
8. [Taxas e Comissões](#taxas-e-comissões)
9. [API de Integração](#api-de-integração)
10. [Segurança](#segurança)
11. [Troubleshooting](#troubleshooting)

---

## 🌟 Visão Geral

A DBXPay oferece uma solução completa de pagamentos com criptomoedas, permitindo que seus clientes:
- Depositem saldo usando **USDT** (Tether)
- Saquem saldo convertendo BRL para **USDT**
- Convertam **USDT para BRL** (PIX) instantaneamente
- Utilizem duas redes blockchain: **BEP20** (Binance Smart Chain) e **TRC20** (TRON)

### Tecnologias
- **Gateway**: DBXPay
- **Criptomoedas**: USDT (Tether)
- **Redes Blockchain**: BEP20 (BSC) e TRC20 (TRON)
- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **Banco de Dados**: MongoDB

---

## 🎯 Funcionalidades Implementadas

### 1. Depósitos em Criptomoedas ✅
- Geração de endereço único de depósito por usuário
- Suporte para USDT BEP20 e TRC20
- QR Code gerado automaticamente
- Preview de conversão em tempo real
- Taxas configuráveis por rede
- Confirmação automática via blockchain

### 2. Saques em Criptomoedas ✅
- Saque de BRL para USDT
- Validação de endereço de carteira
- Validação de PIN de segurança
- Taxa configurável por rede
- Processamento automático na blockchain

### 3. Conversão Crypto para PIX ✅
- Conversão instantânea de USDT para BRL
- Sem taxa adicional de conversão
- Crédito automático na conta BRL do usuário
- Histórico de conversões

---

## 💰 Depósitos em Criptomoedas

### Como Funciona

#### 1. Usuário Acessa a Carteira Crypto
- Menu: **Carteira Crypto**
- Rota: `/crypto-wallet`

#### 2. Geração de Endereço de Depósito
```javascript
// O sistema verifica se já existe um endereço
GET /api/crypto/deposit/addresses

// Se não existir, gera um novo endereço único
POST /api/crypto/deposit/address
{
  "currency": "USDT_BSC" // ou "USDT_TRC20"
}
```

**Resposta:**
```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "currency": "USDT_BSC",
  "network": "BEP20",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  "qr_code_url": "https://api.dbxpay.com/qr/...",
  "created_at": "2025-11-27T..."
}
```

#### 3. Preview de Conversão
O sistema mostra em tempo real quanto o usuário receberá:

**Exemplo:**
- **Valor a depositar**: R$ 100,00
- **Cotação USDT**: R$ 5,33
- **Taxa de entrada (5%)**: -0.0938 USDT
- **Você receberá**: 1.7824 USDT (≈ R$ 9,50)

**Cálculo:**
```javascript
// 1. Calcular valor líquido em BRL
const netBRL = depositBRL * (1 - taxaCripto / 100);
// netBRL = 100 * (1 - 0.05) = 95.00

// 2. Converter para USDT
const usdtAmount = netBRL / usdtQuote;
// usdtAmount = 95.00 / 5.33 = 17.824 USDT
```

#### 4. Seleção de Rede
Usuário escolhe entre:
- **BEP20** (Binance Smart Chain) - Taxa padrão: 5%
- **TRC20** (TRON Network) - Taxa padrão: 5%

#### 5. Geração do QR Code
- QR Code gerado automaticamente pelo sistema
- Endereço copiável com um clique
- Timer de 60 minutos para expiração

#### 6. Usuário Envia a Criptomoeda
- Transfere USDT para o endereço fornecido
- Aguarda confirmação na blockchain

#### 7. Sistema Confirma o Depósito
Quando a transação é detectada na blockchain:

```python
# Notificação recebida do sistema de blockchain
{
  "txn_id": "transaction_id",
  "status": "completed",
  "source_amount": "17.824",  # USDT enviado
  "source_currency": "USDT",
  "amount": "95.00",  # BRL equivalente
  "user_id": "user_id",
  "network": "USDT_BSC"
}
```

**Processamento do Backend:**
```python
# 1. Calcular taxa da plataforma
taxa_entrada = user.taxa_cripto_entrada_usdt_bep20  # 5%
fee_crypto = source_amount * (taxa_entrada / 100)
amount_after_fee = source_amount - fee_crypto

# 2. Calcular valor em BRL
amount_brl_after_fee = amount_after_fee * usdt_quote

# 3. Creditar na conta do usuário
user.saldo_usdt += amount_after_fee
await db.users.update_one(...)

# 4. Criar registro da transação
await db.crypto_transactions.insert_one({
  "user_id": user_id,
  "type": "deposit",
  "amount_crypto": source_amount,
  "amount_after_fee": amount_after_fee,
  "fee_crypto": fee_crypto,
  "amount_brl": amount_brl_after_fee,
  "status": "completed",
  ...
})
```

#### 8. Notificação ao Usuário
- Toast notification no frontend
- Email de confirmação (opcional)
- Histórico atualizado

---

## 💸 Saques em Criptomoedas

### Como Funciona

#### 1. Usuário Solicita Saque
- Acessa **Carteira Crypto** → **Sacar**
- Informa:
  - Valor em BRL que deseja sacar
  - Endereço da carteira de destino
  - Rede (BEP20 ou TRC20)
  - PIN de segurança (5 dígitos)

#### 2. Validações do Sistema

**Validação de Saldo:**
```python
if valor_solicitado > user.saldo_usdt_brl:
    raise HTTPException(400, "Saldo insuficiente")
```

**Validação de PIN:**
```python
if not bcrypt.checkpw(pin.encode(), user.pin_saque.encode()):
    raise HTTPException(401, "PIN incorreto")
```

**Validação de Endereço:**
```python
# Verificar formato do endereço
if network == "BEP20" and not address.startswith("0x"):
    raise HTTPException(400, "Endereço BEP20 inválido")
if network == "TRC20" and not address.startswith("T"):
    raise HTTPException(400, "Endereço TRC20 inválido")
```

#### 3. Cálculo do Saque

**Exemplo:**
- **Valor solicitado**: R$ 100,00
- **Cotação USDT**: R$ 5,33
- **Taxa de saída (2%)**: -0.3752 USDT
- **Valor enviado**: 18.384 USDT

**Cálculo:**
```javascript
// 1. Converter BRL para USDT
const usdtGross = valorBRL / usdtQuote;
// usdtGross = 100 / 5.33 = 18.76 USDT

// 2. Descontar taxa
const fee = usdtGross * (taxaSaida / 100);
const usdtNet = usdtGross - fee;
// fee = 18.76 * 0.02 = 0.3752 USDT
// usdtNet = 18.76 - 0.3752 = 18.384 USDT
```

#### 4. Processamento do Saque

```python
# Processar saque na blockchain
withdrawal_data = await process_crypto_withdrawal(
    currency="USDT_BSC",  # ou USDT_TRC20
    amount=usdt_net,
    to_address=wallet_address,
    description=f"Saque DBXPay - {user.name}"
)
```

#### 5. Atualização do Saldo
```python
# Debitar do saldo USDT do usuário
user.saldo_usdt -= valor_em_usdt
await db.users.update_one(...)

# Criar registro do saque
await db.crypto_withdrawals.insert_one({
    "user_id": user_id,
    "type": "withdrawal",
    "amount_brl": valor_brl,
    "amount_crypto": usdt_net,
    "fee_crypto": fee,
    "destination_address": wallet_address,
    "network": network,
    "status": "processing",
    "txn_id": withdrawal_data["txn_id"],
    ...
})
```

#### 6. Confirmação na Blockchain
- Status atualizado automaticamente pelo sistema
- Usuário pode acompanhar pela TX hash

---

## 🔄 Conversão Crypto para PIX

### Como Funciona

#### 1. Usuário Acessa a Conversão
- **Carteira Crypto** → **Converter para PIX**
- Interface mostra saldo USDT disponível

#### 2. Solicita Conversão
```javascript
POST /api/crypto/convert-to-pix
{
  "amount_usdt": 10.5  // Valor em USDT a converter
}
```

#### 3. Processamento da Conversão

**Backend:**
```python
# 1. Validar saldo
if amount_usdt > user.saldo_usdt:
    raise HTTPException(400, "Saldo USDT insuficiente")

# 2. Obter cotação atual
usdt_quote = await get_usdt_quote()  # Ex: 5.33

# 3. Calcular valor em BRL (SEM TAXA ADICIONAL)
amount_brl = amount_usdt * usdt_quote
# amount_brl = 10.5 * 5.33 = 55.965 BRL

# 4. Atualizar saldos
user.saldo_usdt -= amount_usdt
user.saldo += amount_brl  # Crédito em BRL

# 5. Registrar conversão
await db.crypto_conversions.insert_one({
    "user_id": user_id,
    "amount_usdt": amount_usdt,
    "amount_brl": amount_brl,
    "usdt_quote": usdt_quote,
    "status": "completed",
    "created_at": datetime.now()
})
```

#### 4. Confirmação
- Saldo BRL atualizado instantaneamente
- Usuário pode sacar via PIX normalmente

**Importante:**
- ✅ **Não há taxa** na conversão USDT → BRL
- ✅ Conversão é **instantânea**
- ✅ Usa cotação em **tempo real**

---

## ⚙️ Configuração do Sistema

### Painel Administrativo

Acesse: **Admin Panel** → **Configurações** → **Criptomoedas**

#### Taxas Configuráveis

**Depósito:**
- `taxa_cripto_entrada_bep20`: Taxa para depósitos USDT BEP20 (padrão: 5%)
- `taxa_cripto_entrada_trc20`: Taxa para depósitos USDT TRC20 (padrão: 5%)

**Saque:**
- `taxa_cripto_saida_bep20`: Taxa para saques USDT BEP20 (padrão: 2%)
- `taxa_cripto_saida_trc20`: Taxa para saques USDT TRC20 (padrão: 2%)

**Limites:**
- `cripto_deposito_minimo`: Valor mínimo de depósito em BRL (padrão: R$ 10,00)
- `cripto_saque_minimo`: Valor mínimo de saque em BRL (padrão: R$ 10,00)

#### Exemplo de Configuração

```javascript
// Estado no frontend
{
  taxa_cripto_entrada_bep20: 5.0,   // 5%
  taxa_cripto_entrada_trc20: 5.0,   // 5%
  taxa_cripto_saida_bep20: 2.0,     // 2%
  taxa_cripto_saida_trc20: 2.0,     // 2%
  cripto_deposito_minimo: 10.0,     // R$ 10,00
  cripto_saque_minimo: 10.0         // R$ 10,00
}
```

### Taxas por Usuário

Você pode configurar taxas personalizadas para cada cliente:

**Admin Panel** → **Clientes** → **[Selecionar Cliente]** → **Editar Taxas**

```javascript
{
  "taxa_cripto_entrada_usdt_bep20": 3.0,  // 3% ao invés de 5%
  "taxa_cripto_entrada_usdt_trc20": 3.0,
  "taxa_cripto": 2.0  // Taxa genérica de crypto
}
```

---

## 🔐 Segurança

### PIN de Saque

Todos os saques crypto exigem um PIN de 5 dígitos:

#### Configuração do PIN
```javascript
POST /api/auth/pin/setup
{
  "pin": "12345"
}
```

**Backend:**
```python
# Criptografar PIN com bcrypt
hashed_pin = bcrypt.hashpw(pin.encode(), bcrypt.gensalt())
await db.users.update_one(
    {"id": user_id},
    {"$set": {"pin_saque": hashed_pin.decode()}}
)
```

#### Validação do PIN
```python
# No momento do saque
stored_pin = user.get("pin_saque")
if not bcrypt.checkpw(pin.encode(), stored_pin.encode()):
    raise HTTPException(401, "PIN incorreto")
```

### Validação de Endereços

**BEP20 (Binance Smart Chain):**
- Começa com `0x`
- 42 caracteres hexadecimais
- Exemplo: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4`

**TRC20 (TRON Network):**
- Começa com `T`
- 34 caracteres
- Exemplo: `TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9`

### Notificações do Sistema
- Assinatura criptográfica para validação
- Verificação de origem das transações
- Idempotência para evitar duplicação

---

## 📊 Fluxo de Transações

### Diagrama de Depósito

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ 1. Solicita depósito
       ▼
┌─────────────────┐
│  Gera Endereço  │ ← Sistema DBXPay
└──────┬──────────┘
       │ 2. Recebe endereço + QR Code
       ▼
┌─────────────────┐
│  Envia USDT     │
│  (Carteira)     │
└──────┬──────────┘
       │ 3. Transação na blockchain
       ▼
┌─────────────────┐
│  Sistema        │
│  Blockchain     │
└──────┬──────────┘
       │ 4. Detecta depósito confirmado
       ▼
┌─────────────────┐
│  Backend DBXPay │
│  - Calcula taxa │
│  - Credita saldo│
└──────┬──────────┘
       │ 5. Saldo atualizado
       ▼
┌─────────────────┐
│  Notifica User  │
└─────────────────┘
```

### Diagrama de Saque

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ 1. Solicita saque + PIN
       ▼
┌─────────────────┐
│  Valida PIN     │
│  Valida Saldo   │
└──────┬──────────┘
       │ 2. Aprovado
       ▼
┌─────────────────┐
│  Calcula Taxa   │
│  Debita Saldo   │
└──────┬──────────┘
       │ 3. Processa saque
       ▼
┌─────────────────┐
│  Sistema DBXPay │
│  Blockchain     │
└──────┬──────────┘
       │ 4. Envia para blockchain
       ▼
┌─────────────────┐
│  Confirmação    │
│  Blockchain     │
└──────┬──────────┘
       │ 5. Confirma TX
       ▼
┌─────────────────┐
│  Atualiza Status│
│  (Backend)      │
└──────┬──────────┘
       │ 6. Saque concluído
       ▼
┌─────────────────┐
│  Notifica User  │
└─────────────────┘
```

---

## 🔧 API de Integração

### Endpoints Disponíveis

#### 1. Gerar Endereço de Depósito
```bash
POST /api/crypto/deposit/address
Authorization: Bearer {token}
Content-Type: application/json

{
  "currency": "USDT_BSC"  # ou "USDT_TRC20"
}
```

**Resposta:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  "qr_code_url": "https://api.dbxpay.com/qr/...",
  "network": "BEP20",
  "expires_at": "2025-11-27T15:00:00Z"
}
```

#### 2. Listar Endereços de Depósito
```bash
GET /api/crypto/deposit/addresses
Authorization: Bearer {token}
```

#### 3. Solicitar Saque
```bash
POST /api/crypto/withdraw
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount_brl": 100.00,
  "wallet_address": "0x742d35...",
  "network": "BEP20",
  "pin": "12345"
}
```

#### 4. Converter USDT para BRL
```bash
POST /api/crypto/convert-to-pix
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount_usdt": 10.5
}
```

#### 5. Obter Cotação Atual
```bash
GET /api/crypto/quote
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "usdt_brl": 5.33,
  "updated_at": "2025-11-27T14:30:00Z"
}
```

### Autenticação

Todas as requisições requerem token JWT no header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📈 Relatórios e Análises

### Métricas Disponíveis

**Admin Panel → Overview:**
- Total de depósitos crypto
- Total de saques crypto
- Volume total transacionado
- Taxas cobradas

**Admin Panel → Transações:**
- Filtro por tipo (depósito/saque/conversão)
- Filtro por status
- Filtro por rede (BEP20/TRC20)
- Exportação para Excel

### Dados de Transação

**Crypto Transaction Model:**
```javascript
{
  "id": "uuid",
  "user_id": "user_uuid",
  "type": "deposit|withdrawal|conversion",
  "amount_crypto": 10.5,
  "amount_brl": 55.965,
  "fee_crypto": 0.525,
  "fee_brl": 2.798,
  "network": "BEP20|TRC20",
  "status": "pending|completed|failed",
  "tx_hash": "0x...",
  "plisio_txn_id": "plisio_id",
  "created_at": "2025-11-27T...",
  "completed_at": "2025-11-27T..."
}
```

---

## ❗ Troubleshooting

### Problemas Comuns

#### 1. Depósito não confirmado

**Sintoma:** Usuário enviou USDT mas saldo não foi creditado

**Verificação:**
```bash
# Verificar logs do sistema
tail -f /var/log/supervisor/backend.*.log | grep crypto

# Verificar transação no banco de dados
db.crypto_transactions.find({"user_id": "user_id"}).sort({"created_at": -1})

# Verificar no painel administrativo
Admin Panel → Transações → Crypto Deposits
```

**Soluções:**
- Verificar se notificação foi recebida
- Verificar se há erro nos logs do sistema
- Consultar status na blockchain (BSCScan ou TronScan)
- Reprocessar transação manualmente se necessário

#### 2. Cotação incorreta

**Sintoma:** Valor convertido diferente do esperado

**Causa:** Cotação desatualizada ou erro na API

**Solução:**
```python
# API de backup para cotação
import requests
response = requests.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl"
)
usdt_quote = response.json()["tether"]["brl"]
```

#### 3. PIN esquecido

**Sintoma:** Usuário não lembra o PIN de saque

**Solução:**
```python
# Endpoint de recuperação
POST /api/auth/pin/recover
{
  "email": "user@example.com"
}

# Envia email com token para resetar o PIN
# Ou permite que admin resete manualmente
```

#### 4. Saque pendente

**Sintoma:** Saque não processado

**Verificação:**
```bash
# Verificar status da transação
GET /api/crypto/withdrawals/{withdrawal_id}

# Verificar histórico de transações
GET /api/crypto/transactions?type=withdrawal
```

**Soluções:**
- Verificar se há saldo suficiente no sistema
- Verificar se endereço está correto
- Consultar logs do sistema
- Entrar em contato com suporte DBXPay

---

## 📞 Suporte

### Recursos Úteis
- [USDT on BSC (BEP20)](https://bscscan.com/token/0x55d398326f99059ff775485246999027b3197955)
- [USDT on TRON (TRC20)](https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
- [Documentação API DBXPay](https://docs.dbxpay.com)

### Contatos
- **Suporte Técnico**: suporte@dbxpay.com
- **Suporte Comercial**: comercial@dbxpay.com
- **Documentação**: https://docs.dbxpay.com

---

## 🚀 Próximos Passos

### Melhorias Futuras
1. Suporte para outras criptomoedas (BTC, ETH)
2. Conversão direta USDT → PIX (sem passar pelo saldo)
3. Histórico de preços e gráficos
4. Alertas de preço
5. API pública para clientes

---

**Última atualização:** 27 de Novembro de 2025
**Versão:** 1.0.0
