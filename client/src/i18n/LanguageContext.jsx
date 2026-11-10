import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from './translations/en';
import hi from './translations/hi';
import mr from './translations/mr';

const translations = { en, hi, mr };

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('khetisetu_lang');
      if (saved && ['en', 'hi', 'mr'].includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore localStorage access failures
    }
    return 'en';
  });

  const setLanguage = useCallback((langCode) => {
    if (['en', 'hi', 'mr'].includes(langCode)) {
      setLanguageState(langCode);
      try {
        localStorage.setItem('khetisetu_lang', langCode);
      } catch {
        // Ignore localStorage access failures
      }
      document.documentElement.lang = langCode;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Safe nested key lookup helper with parameter interpolation
   * e.g. t('nav.marketplace') or t('home.hero.welcome', { name: 'Ramesh' })
   */
  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath || typeof keyPath !== 'string') return '';

      const keys = keyPath.split('.');
      
      // 1. Try currently selected language
      let value = translations[language];
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = null;
          break;
        }
      }

      // 2. Fall back to English dictionary if not found in target language
      if (value === null || value === undefined) {
        value = translations.en;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            value = null;
            break;
          }
        }
      }

      // 3. Fall back to raw key if missing completely
      if (value === null || value === undefined) {
        return keyPath;
      }

      // If value is a string and params provided, interpolate: {param} or {{param}}
      if (typeof value === 'string' && params && typeof params === 'object') {
        return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
          return str
            .replace(new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g'), String(paramVal))
            .replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        }, value);
      }

      return value;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      t,
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
