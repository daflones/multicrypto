export const PRODUCTS = [
  { 
    id: 1, 
    name: 'Crypto Starter', 
    price: 40, 
    dailyYield: 2, 
    type: 'basic', 
    maxPurchases: 3, 
    image: '/images/investimentos/crypto-starter.jpg',
    description: 'Ideal para iniciantes no mundo das criptomoedas'
  },
  { 
    id: 2, 
    name: 'Bitcoin Bronze', 
    price: 100, 
    dailyYield: 5, 
    type: 'basic', 
    maxPurchases: 3, 
    image: '/images/investimentos/bitcoin-bronze.jpg',
    description: 'Investimento básico em Bitcoin com rendimento diário'
  },
  { 
    id: 3, 
    name: 'Ethereum Silver', 
    price: 250, 
    dailyYield: 15, 
    type: 'basic', 
    maxPurchases: 3, 
    image: '/images/investimentos/ethereum-silver.jpg',
    description: 'Plano intermediário focado em Ethereum'
  },
  { 
    id: 4, 
    name: 'DeFi Basic', 
    price: 500, 
    dailyYield: 30, 
    type: 'basic', 
    maxPurchases: 3, 
    image: '/images/investimentos/defi-basic.jpg',
    description: 'Introdução ao mundo DeFi com rendimentos atrativos'
  },
  { 
    id: 5, 
    name: 'Bitcoin Gold', 
    price: 750, 
    dailyYield: 50, 
    type: 'premium', 
    maxPurchases: 2, 
    image: '/images/investimentos/bitcoin-gold.jpg',
    description: 'Plano premium com foco em Bitcoin'
  },
  { 
    id: 6, 
    name: 'Ethereum Platinum', 
    price: 1000, 
    dailyYield: 80, 
    type: 'premium', 
    maxPurchases: 2, 
    image: '/images/investimentos/ethereum-platinum.jpg',
    description: 'Investimento premium em Ethereum'
  },
  { 
    id: 7, 
    name: 'DeFi Advanced', 
    price: 1500, 
    dailyYield: 150, 
    type: 'premium', 
    maxPurchases: 2, 
    image: '/images/investimentos/defi-advanced.jpg',
    description: 'Estratégias avançadas de DeFi para investidores experientes'
  },
  { 
    id: 8, 
    name: 'Crypto Master', 
    price: 2500, 
    dailyYield: 300, 
    type: 'premium', 
    maxPurchases: 2, 
    image: '/images/investimentos/crypto-master.jpg',
    description: 'O plano mais exclusivo para grandes investidores'
  }
];

export const COMMISSION_RATES = {
  LEVEL_1: 0.10, // Nível 1 - 10%
  LEVEL_2: 0.04, // Nível 2 - 4%
  LEVEL_3: 0.02, // Nível 3 - 2%
  LEVEL_4: 0.01, // Nível 4 - 1%
  LEVEL_5: 0.01, // Nível 5 - 1%
  LEVEL_6: 0.01, // Nível 6 - 1%
  LEVEL_7: 0.01  // Nível 7 - 1%
  // Total: 20%
};


export const PAYMENT_METHODS = [
  { id: 'pix', name: 'PIX', icon: '🏦' },
  { id: 'trc20', name: 'USDT TRC20', icon: '₮' },
  { id: 'bep20', name: 'USDT BEP20', icon: '₮' }
];

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const USER_LEVELS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip'
};

export const APP_CONFIG = {
  MIN_WITHDRAWAL: 50,
  MAX_WITHDRAWAL: 10000,
  MIN_DEPOSIT: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
};
