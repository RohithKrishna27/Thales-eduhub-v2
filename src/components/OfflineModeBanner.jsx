import React from 'react';
import { useLanguage } from '../LanguageContext';

const OfflineModeBanner = ({ isOnline }) => {
  const { t } = useLanguage();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center text-sm font-semibold px-3 py-2">
      {t(
        'Offline mode is active. Backend sync is temporarily disabled.',
        'ಆಫ್ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ಬ್ಯಾಕ್‌ಎಂಡ್ ಸಿಂಕ್ ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಷ್ಕ್ರಿಯಗೊಂಡಿದೆ.'
      )}
    </div>
  );
};

export default OfflineModeBanner;
