import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const STORAGE_KEY = 'vpov-thales-mode';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const ThalesModeContext = createContext({
  thalesMode: false,
  setThalesMode: () => {},
});

export const ThalesModeProvider = ({ children }) => {
  const [thalesMode, setThalesModeState] = useState(readStored);

  const setThalesMode = useCallback((value) => {
    const next = Boolean(value);
    setThalesModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ thalesMode, setThalesMode }), [thalesMode, setThalesMode]);

  return <ThalesModeContext.Provider value={value}>{children}</ThalesModeContext.Provider>;
};

export const useThalesMode = () => {
  const ctx = useContext(ThalesModeContext);
  if (!ctx) {
    throw new Error('useThalesMode must be used within ThalesModeProvider');
  }
  return ctx;
};
