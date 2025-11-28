import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import viVN from './locales/vi-VN.json';
import arSA from './locales/ar-SA.json';
import ruRU from './locales/ru-RU.json';
import plPL from './locales/pl-PL.json';
import urPK from './locales/ur-PK.json';
import faIR from './locales/fa-IR.json';

export const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
  'vi-VN': { translation: viVN },
  'ar-SA': { translation: arSA },
  'ru-RU': { translation: ruRU },
  'pl-PL': { translation: plPL },
  'ur-PK': { translation: urPK },
  'fa-IR': { translation: faIR },
} as const;

export const supportedLanguages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', country: 'BR' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', country: 'US' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸', country: 'ES' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳', country: 'VN' },
  { code: 'ar-SA', name: 'العربية (السعودية)', flag: '🇸🇦', country: 'SA' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺', country: 'RU' },
  { code: 'pl-PL', name: 'Polski', flag: '🇵🇱', country: 'PL' },
  { code: 'ur-PK', name: 'اردو (پاکستان)', flag: '🇵🇰', country: 'PK' },
  { code: 'fa-IR', name: 'فارسی (ایران)', flag: '🇮🇷', country: 'IR' },
] as const;

// Só inicializa se ainda não foi inicializado
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en-US',
      debug: false, // Desabilitar debug para evitar logs excessivos
      
      interpolation: {
        escapeValue: false,
      },
      
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });
}

export default i18n;
