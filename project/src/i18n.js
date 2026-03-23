import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import zhTranslation from './locales/zh/translation.json';
import hiTranslation from './locales/hi/translation.json';
import arTranslation from './locales/ar/translation.json';
import esTranslation from './locales/es/translation.json';
import bnTranslation from './locales/bn/translation.json';
import ptTranslation from './locales/pt/translation.json';
import ruTranslation from './locales/ru/translation.json';
import urTranslation from './locales/ur/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            fr: { translation: frTranslation },
            zh: { translation: zhTranslation },
            hi: { translation: hiTranslation },
            ar: { translation: arTranslation },
            es: { translation: esTranslation },
            bn: { translation: bnTranslation },
            pt: { translation: ptTranslation },
            ru: { translation: ruTranslation },
            ur: { translation: urTranslation }

        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr', 'zh', 'hi', 'ar', 'es', 'bn', 'pt', 'ru', 'ur'],
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng'
        },
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
