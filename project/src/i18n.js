import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'zh', 'hi', 'ar', 'es', 'bn', 'pt', 'ru', 'ur'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;