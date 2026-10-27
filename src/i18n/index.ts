import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';
import { AppLanguage } from './strings';

function detectDeviceLanguage(): AppLanguage {
  try {
    const code = Localization.getLocales()[0]?.languageCode || 'en';
    return code.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

void i18n.use(initReactI18next).init({
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  interpolation: { escapeValue: false },
});

export function syncI18nLanguage(language: AppLanguage): void {
  void i18n.changeLanguage(language);
}

export default i18n;
