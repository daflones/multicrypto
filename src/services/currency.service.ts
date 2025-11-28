// Serviço de conversão de moedas
// Taxas de câmbio atualizadas (BRL como base)

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Taxa de conversão de BRL para esta moeda
}

// Mapeamento de idioma para moeda
export const LANGUAGE_TO_CURRENCY: Record<string, string> = {
  'pt-BR': 'BRL',
  'en-US': 'USD',
  'es-ES': 'EUR',
  'vi-VN': 'VND',
  'ar-SA': 'SAR',
  'ru-RU': 'RUB',
  'pl-PL': 'PLN',
  'ur-PK': 'PKR',
  'fa-IR': 'IRR'
};

// Informações das moedas com taxas aproximadas (BRL como base)
// Taxas atualizadas em Nov 2024 - 1 BRL = X moeda estrangeira
export const CURRENCIES: Record<string, CurrencyInfo> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    rate: 1
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 0.17 // 1 BRL ≈ 0.17 USD (1 USD ≈ 5.90 BRL)
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.16 // 1 BRL ≈ 0.16 EUR (1 EUR ≈ 6.25 BRL)
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    rate: 4237 // 1 BRL ≈ 4237 VND
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    rate: 0.64 // 1 BRL ≈ 0.64 SAR
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    rate: 17.5 // 1 BRL ≈ 17.5 RUB
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Zloty',
    rate: 0.69 // 1 BRL ≈ 0.69 PLN
  },
  PKR: {
    code: 'PKR',
    symbol: '₨',
    name: 'Pakistani Rupee',
    rate: 47.5 // 1 BRL ≈ 47.5 PKR
  },
  IRR: {
    code: 'IRR',
    symbol: '﷼',
    name: 'Iranian Rial',
    rate: 7150 // 1 BRL ≈ 7150 IRR
  }
};

// Cache para taxas de câmbio
let cachedRates: Record<string, number> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

// Buscar taxas de câmbio atualizadas da API
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  const now = Date.now();
  
  // Usar cache se ainda válido
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Usar API gratuita de taxas de câmbio
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
    const data = await response.json();
    
    cachedRates = data.rates;
    lastFetchTime = now;
    
    // Atualizar taxas locais com valores da API
    Object.keys(CURRENCIES).forEach(code => {
      if (data.rates[code]) {
        CURRENCIES[code].rate = data.rates[code];
      }
    });
    
    return data.rates;
  } catch (error) {
    console.error('Erro ao buscar taxas de câmbio:', error);
    // Retornar taxas padrão em caso de erro
    const defaultRates: Record<string, number> = {};
    Object.keys(CURRENCIES).forEach(code => {
      defaultRates[code] = CURRENCIES[code].rate;
    });
    return defaultRates;
  }
};

// Converter valor de BRL para outra moeda
export const convertFromBRL = (amountBRL: number, targetCurrency: string): number => {
  const currency = CURRENCIES[targetCurrency];
  if (!currency) return amountBRL;
  return amountBRL * currency.rate;
};

// Converter valor de outra moeda para BRL
export const convertToBRL = (amount: number, sourceCurrency: string): number => {
  const currency = CURRENCIES[sourceCurrency];
  if (!currency || currency.rate === 0) return amount;
  return amount / currency.rate;
};

// Obter moeda baseada no idioma
export const getCurrencyByLanguage = (language: string): CurrencyInfo => {
  const currencyCode = LANGUAGE_TO_CURRENCY[language] || 'USD';
  return CURRENCIES[currencyCode] || CURRENCIES.USD;
};

// Formatar valor na moeda específica
export const formatCurrencyByCode = (amount: number, currencyCode: string): string => {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    return `$${amount.toFixed(2)}`;
  }

  // Formatação especial para moedas com muitos zeros
  if (currencyCode === 'VND' || currencyCode === 'IRR') {
    return `${currency.symbol} ${Math.round(amount).toLocaleString()}`;
  }

  // Formatação especial para PKR e RUB
  if (currencyCode === 'PKR' || currencyCode === 'RUB') {
    return `${currency.symbol} ${amount.toFixed(0)}`;
  }

  return `${currency.symbol} ${amount.toFixed(2)}`;
};

// Formatar valor convertido de BRL para a moeda do usuário
export const formatConvertedCurrency = (amountBRL: number, language: string): string => {
  const currency = getCurrencyByLanguage(language);
  const convertedAmount = convertFromBRL(amountBRL, currency.code);
  return formatCurrencyByCode(convertedAmount, currency.code);
};

// Hook helper para obter informações de moeda
export const useCurrencyInfo = (language: string) => {
  const currency = getCurrencyByLanguage(language);
  const isBrazilian = language === 'pt-BR';
  
  return {
    currency,
    isBrazilian,
    formatAmount: (amountBRL: number) => {
      if (isBrazilian) {
        return `R$ ${amountBRL.toFixed(2).replace('.', ',')}`;
      }
      return formatConvertedCurrency(amountBRL, language);
    },
    convertFromBRL: (amountBRL: number) => convertFromBRL(amountBRL, currency.code),
    convertToBRL: (amount: number) => convertToBRL(amount, currency.code)
  };
};

export default {
  CURRENCIES,
  LANGUAGE_TO_CURRENCY,
  fetchExchangeRates,
  convertFromBRL,
  convertToBRL,
  getCurrencyByLanguage,
  formatCurrencyByCode,
  formatConvertedCurrency,
  useCurrencyInfo
};
