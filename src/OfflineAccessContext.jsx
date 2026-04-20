import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const OfflineAccessContext = createContext();
const OFFLINE_MODE_KEY = 'vpov-offline-student-mode';

export const OfflineAccessProvider = ({ children }) => {
  const [offlineStudentMode, setOfflineStudentMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(OFFLINE_MODE_KEY, String(offlineStudentMode));
  }, [offlineStudentMode]);

  const value = useMemo(
    () => ({
      offlineStudentMode,
      enableOfflineStudentMode: () => setOfflineStudentMode(true),
      disableOfflineStudentMode: () => setOfflineStudentMode(false),
      setOfflineStudentMode,
    }),
    [offlineStudentMode]
  );

  return <OfflineAccessContext.Provider value={value}>{children}</OfflineAccessContext.Provider>;
};

export const useOfflineAccess = () => {
  const context = useContext(OfflineAccessContext);
  if (!context) {
    throw new Error('useOfflineAccess must be used within an OfflineAccessProvider');
  }
  return context;
};
