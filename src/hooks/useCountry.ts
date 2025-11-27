import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n';

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  documentType: string;
  documentPlaceholder: string;
  phoneFormat: string;
  currency: string;
}

export const useCountry = () => {
  const { i18n, t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<string>('BR');

  // Detectar país baseado no idioma atual
  useEffect(() => {
    const currentLang = i18n.language;
    const langInfo = supportedLanguages.find(lang => lang.code === currentLang);
    if (langInfo) {
      setSelectedCountry(langInfo.country);
    }
  }, [i18n.language]);

  // Obter informações do país atual
  const getCountryInfo = (countryCode?: string): CountryInfo => {
    const country = countryCode || selectedCountry;
    return {
      code: country,
      name: t(`countries.${country}.name`),
      flag: supportedLanguages.find(lang => lang.country === country)?.flag || '🌍',
      documentType: t(`countries.${country}.documentType`),
      documentPlaceholder: t(`countries.${country}.documentPlaceholder`),
      phoneFormat: t(`countries.${country}.phoneFormat`),
      currency: t('common.currency'),
    };
  };

  // Alterar país e idioma
  const changeCountry = (countryCode: string) => {
    const langInfo = supportedLanguages.find(lang => lang.country === countryCode);
    if (langInfo) {
      setSelectedCountry(countryCode);
      i18n.changeLanguage(langInfo.code);
    }
  };

  // Validar documento baseado no país
  const validateDocument = (document: string, countryCode?: string): boolean => {
    const country = countryCode || selectedCountry;
    
    // Remove espaços e caracteres especiais
    const cleanDoc = document.replace(/[^0-9A-Za-z]/g, '');
    
    switch (country) {
      case 'BR': // CPF
        return cleanDoc.length === 11 && /^\d+$/.test(cleanDoc);
      case 'US': // SSN
        return cleanDoc.length === 9 && /^\d+$/.test(cleanDoc);
      case 'ES': // DNI
        return cleanDoc.length === 9 && /^\d{8}[A-Za-z]$/.test(cleanDoc);
      case 'VN': // CCCD
        return cleanDoc.length === 12 && /^\d+$/.test(cleanDoc);
      case 'SA': // National ID
        return cleanDoc.length === 10 && /^\d+$/.test(cleanDoc);
      case 'RU': // Passport
        return cleanDoc.length === 10 && /^\d+$/.test(cleanDoc);
      case 'PL': // PESEL
        return cleanDoc.length === 11 && /^\d+$/.test(cleanDoc);
      case 'PK': // CNIC
        return cleanDoc.length === 13 && /^\d+$/.test(cleanDoc);
      case 'IR': // National Code
        return cleanDoc.length === 10 && /^\d+$/.test(cleanDoc);
      default:
        return cleanDoc.length >= 8;
    }
  };

  // Formatar documento baseado no país
  const formatDocument = (document: string, countryCode?: string): string => {
    const country = countryCode || selectedCountry;
    const cleanDoc = document.replace(/[^0-9A-Za-z]/g, '');
    
    switch (country) {
      case 'BR': // CPF: 000.000.000-00
        return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      case 'US': // SSN: 000-00-0000
        return cleanDoc.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
      case 'ES': // DNI: 00000000A
        return cleanDoc.toUpperCase();
      case 'VN': // CCCD: 000000000000
        return cleanDoc;
      case 'SA': // National ID: 0000000000
        return cleanDoc;
      case 'RU': // Passport: 0000 000000
        return cleanDoc.replace(/(\d{4})(\d{6})/, '$1 $2');
      case 'PL': // PESEL: 00000000000
        return cleanDoc;
      case 'PK': // CNIC: 00000-0000000-0
        return cleanDoc.replace(/(\d{5})(\d{7})(\d{1})/, '$1-$2-$3');
      case 'IR': // National Code: 0000000000
        return cleanDoc;
      default:
        return cleanDoc;
    }
  };

  // Formatar telefone baseado no país
  const formatPhone = (phone: string, countryCode?: string): string => {
    const country = countryCode || selectedCountry;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    switch (country) {
      case 'BR': // +55 (00) 00000-0000
        return cleanPhone.replace(/(\+55)?(\d{2})(\d{5})(\d{4})/, '+55 ($2) $3-$4');
      case 'US': // (000) 000-0000
        return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      case 'ES': // +34 000 000 000
        return cleanPhone.replace(/(\+34)?(\d{3})(\d{3})(\d{3})/, '+34 $2 $3 $4');
      case 'VN': // +84 00 0000 0000
        return cleanPhone.replace(/(\+84)?(\d{2})(\d{4})(\d{4})/, '+84 $2 $3 $4');
      case 'SA': // +966 00 000 0000
        return cleanPhone.replace(/(\+966)?(\d{2})(\d{3})(\d{4})/, '+966 $2 $3 $4');
      case 'RU': // +7 000 000 00 00
        return cleanPhone.replace(/(\+7)?(\d{3})(\d{3})(\d{2})(\d{2})/, '+7 $2 $3 $4 $5');
      case 'PL': // +48 000 000 000
        return cleanPhone.replace(/(\+48)?(\d{3})(\d{3})(\d{3})/, '+48 $2 $3 $4');
      case 'PK': // +92 000 0000000
        return cleanPhone.replace(/(\+92)?(\d{3})(\d{7})/, '+92 $2 $3');
      case 'IR': // +98 00 0000 0000
        return cleanPhone.replace(/(\+98)?(\d{2})(\d{4})(\d{4})/, '+98 $2 $3 $4');
      default:
        return cleanPhone;
    }
  };

  return {
    selectedCountry,
    countryInfo: getCountryInfo(),
    supportedCountries: supportedLanguages.map(lang => ({
      code: lang.country,
      name: lang.name,
      flag: lang.flag,
      langCode: lang.code,
    })),
    changeCountry,
    getCountryInfo,
    validateDocument,
    formatDocument,
    formatPhone,
  };
};
