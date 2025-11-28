import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CurrencyInfo,
  fetchExchangeRates,
  convertFromBRL,
  convertToBRL,
  getCurrencyByLanguage,
  formatCurrencyByCode
} from '../services/currency.service';

export interface UseCurrencyReturn {
  currency: CurrencyInfo;
  isBrazilian: boolean;
  isLoading: boolean;
  formatAmount: (amountBRL: number) => string;
  formatAmountWithBoth: (amountBRL: number) => string;
  convertFromBRL: (amountBRL: number) => number;
  convertToBRL: (amount: number) => number;
  refreshRates: () => Promise<void>;
}

export const useCurrency = (): UseCurrencyReturn => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  const language = i18n.language || 'pt-BR';
  const isBrazilian = language === 'pt-BR';
  const currency = getCurrencyByLanguage(language);

  // Carregar taxas de câmbio ao montar
  useEffect(() => {
    const loadRates = async () => {
      if (!ratesLoaded && !isBrazilian) {
        setIsLoading(true);
        try {
          await fetchExchangeRates();
          setRatesLoaded(true);
        } catch (error) {
          console.error('Erro ao carregar taxas:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadRates();
  }, [isBrazilian, ratesLoaded]);

  const refreshRates = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchExchangeRates();
      setRatesLoaded(true);
    } catch (error) {
      console.error('Erro ao atualizar taxas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Formatar valor na moeda do usuário
  const formatAmount = useCallback((amountBRL: number): string => {
    if (isBrazilian) {
      return `R$ ${amountBRL.toFixed(2).replace('.', ',')}`;
    }
    const convertedAmount = convertFromBRL(amountBRL, currency.code);
    return formatCurrencyByCode(convertedAmount, currency.code);
  }, [isBrazilian, currency.code]);

  // Formatar valor mostrando ambas as moedas (para não-brasileiros)
  const formatAmountWithBoth = useCallback((amountBRL: number): string => {
    if (isBrazilian) {
      return `R$ ${amountBRL.toFixed(2).replace('.', ',')}`;
    }
    const convertedAmount = convertFromBRL(amountBRL, currency.code);
    const formattedLocal = formatCurrencyByCode(convertedAmount, currency.code);
    const formattedBRL = `R$ ${amountBRL.toFixed(2).replace('.', ',')}`;
    return `${formattedLocal} (${formattedBRL})`;
  }, [isBrazilian, currency.code]);

  // Converter de BRL para moeda local
  const convertFromBRLLocal = useCallback((amountBRL: number): number => {
    return convertFromBRL(amountBRL, currency.code);
  }, [currency.code]);

  // Converter de moeda local para BRL
  const convertToBRLLocal = useCallback((amount: number): number => {
    return convertToBRL(amount, currency.code);
  }, [currency.code]);

  return {
    currency,
    isBrazilian,
    isLoading,
    formatAmount,
    formatAmountWithBoth,
    convertFromBRL: convertFromBRLLocal,
    convertToBRL: convertToBRLLocal,
    refreshRates
  };
};

export default useCurrency;
