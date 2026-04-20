import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext();
const STORAGE_KEY = 'vpov-language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'kn' || stored === 'en') return stored;
    return navigator.language?.toLowerCase().startsWith('kn') ? 'kn' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'kn' ? 'kn' : 'en';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (englishText, kannadaText) => (language === 'kn' ? kannadaText : englishText),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
