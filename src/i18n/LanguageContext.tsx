import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Language } from './translations';

const STORAGE_KEY = 'finance_dashboard_lang';
const DEFAULT_LANG: Language = 'en';
const SUPPORTED_LANGS: Language[] = ['en', 'id'];

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && SUPPORTED_LANGS.includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return DEFAULT_LANG;
  });

  const setLang = useCallback((nextLang: Language) => {
    if (!SUPPORTED_LANGS.includes(nextLang)) return;
    setLangState(nextLang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'id' : 'en');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const t = useCallback(
    (keyPath: string, params: Record<string, string | number> = {}): string => {
      const keys = keyPath.split('.');
      const resolve = (obj: any) =>
        keys.reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);

      let val = resolve(translations[lang]);

      if (val === undefined && lang !== DEFAULT_LANG) {
        val = resolve(translations[DEFAULT_LANG]);
      }

      if (val === undefined) {
        return keyPath;
      }

      if (typeof val === 'string' && Object.keys(params).length > 0) {
        return val.replace(/\{(\w+)\}/g, (_, m) =>
          params[m] !== undefined ? String(params[m]) : `{${m}}`
        );
      }

      return String(val);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
