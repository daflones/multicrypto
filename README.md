# Multi Crypto - Plataforma de Investimentos em Criptomoedas

Uma plataforma completa de investimentos em criptomoedas com sistema de referência, rendimentos diários e interface mobile-first.

## 🚀 Funcionalidades

### Para Usuários
- ✅ **Autenticação Completa**: Login/registro com validação de CPF e código de convite
- ✅ **Sistema de Investimentos**: 8 produtos diferentes (básico e premium)
- ✅ **Rendimentos Diários**: Cálculo automático de rendimentos
- ✅ **Depósitos**: PIX com QR Code, USDT TRC20/BEP20
- ✅ **Saques**: PIX e criptomoedas com validação
- ✅ **Sistema de Referência**: 3 níveis com comissões de 10%, 5% e 3%
- ✅ **Dashboard Completo**: Estatísticas e acompanhamento em tempo real
- ✅ **Interface Mobile-First**: Totalmente responsiva

### Para Administradores
- ✅ **Painel Administrativo**: Controle total da plataforma
- ✅ **Gestão de Transações**: Aprovar/rejeitar depósitos e saques
- ✅ **Gestão de Usuários**: Visualizar e gerenciar contas
- ✅ **Gestão de Produtos**: Criar e editar produtos de investimento
- ✅ **Relatórios**: Métricas e estatísticas da plataforma

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + bcrypt
- **Validation**: Zod
- **Icons**: Lucide React
- **QR Code**: react-qr-code
- **Date Handling**: date-fns

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd MultiCrypto
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Configure o banco de dados**

Execute os seguintes comandos SQL no seu projeto Supabase:

```sql
-- Tabela users
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  password_hash TEXT NOT NULL,
  referral_code VARCHAR(8) UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  daily_yield DECIMAL(10,2) NOT NULL,
  max_purchases INT NOT NULL,
  image_path VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  product_type VARCHAR(20) CHECK (product_type IN ('basic', 'premium')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela user_investments
CREATE TABLE user_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  purchase_date TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  total_earned DECIMAL(10,2) DEFAULT 0
);

-- Tabela transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'commission', 'yield')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'trc20', 'bep20')),
  status VARCHAR(20) DEFAULT 'pending',
  proof_file_url TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela commissions
CREATE TABLE commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficiary_id UUID REFERENCES users(id),
  source_user_id UUID REFERENCES users(id),
  investment_id UUID REFERENCES user_investments(id),
  level INT CHECK (level IN (1, 2, 3)),
  percentage DECIMAL(5,2),
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

5. **Configure o Storage no Supabase**

Crie os seguintes buckets no Supabase Storage:
- `proof-files` (para comprovantes de pagamento)
- `product-images` (para imagens dos produtos)

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Componentes de layout (Navbar, Bottom Navigation)
│   ├── auth/            # Componentes de autenticação
│   ├── investment/      # Componentes de investimento
│   ├── deposit/         # Componentes de depósito
│   ├── team/            # Componentes de equipe/referência
│   ├── withdraw/        # Componentes de saque
│   └── admin/           # Componentes administrativos
├── pages/               # Páginas da aplicação
├── services/            # Serviços (Supabase, API calls)
├── store/               # Estado global (Zustand)
├── utils/               # Utilitários (formatters, validators)
└── styles/              # Estilos globais
```

## 💰 Sistema de Comissões

O sistema de referência funciona em 3 níveis:

- **Nível 1 (Diretos)**: 10% de comissão
- **Nível 2 (Indiretos)**: 5% de comissão  
- **Nível 3**: 3% de comissão

**Total**: Até 18% de comissão sobre todos os investimentos da sua rede!

## 📱 Produtos de Investimento

### Básicos
1. **Crypto Starter** - R$ 40 (R$ 2/dia)
2. **Bitcoin Bronze** - R$ 100 (R$ 5/dia)
3. **Ethereum Silver** - R$ 250 (R$ 15/dia)
4. **DeFi Basic** - R$ 500 (R$ 30/dia)

### Premium
5. **Bitcoin Gold** - R$ 750 (R$ 50/dia)
6. **Ethereum Platinum** - R$ 1.000 (R$ 80/dia)
7. **DeFi Advanced** - R$ 1.500 (R$ 150/dia)
8. **Crypto Master** - R$ 2.500 (R$ 300/dia)

## 🔒 Segurança

- ✅ Validação de CPF brasileira
- ✅ Sanitização de inputs (XSS protection)
- ✅ Validação de dados com Zod
- ✅ Hash de senhas com bcrypt
- ✅ Validação de carteiras crypto
- ✅ Upload seguro de arquivos

## 🚀 Deploy

1. **Build da aplicação**
```bash
npm run build
```

2. **Preview da build**
```bash
npm run preview
```

## 📞 Suporte

Para suporte técnico ou dúvidas sobre a plataforma, entre em contato através dos canais oficiais.

## 📄 Licença

Este projeto é propriedade da Multi Crypto. Todos os direitos reservados.

---

**⚠️ Aviso Legal**: Investimentos em criptomoedas envolvem riscos. Invista apenas o que você pode perder.
