import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en';
import sw from '../translations/sw';

const LanguageContext = createContext();

const translations = { en, sw };

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('skyc_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('skyc_lang', lang);
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
