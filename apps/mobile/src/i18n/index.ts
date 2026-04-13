import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import de from './de/common';
import en from './en/common';

const resources = {
  de: { translation: de },
  en: { translation: en },
};

// Detect system language, fallback to German
const systemLocale = Localization.getLocales()?.[0]?.languageCode || 'de';
const supportedLangs = ['de', 'en'];
const detectedLang = supportedLangs.includes(systemLocale) ? systemLocale : 'de';

i18n.use(initReactI18next).init({
  resources,
  lng: detectedLang,
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;