import React from 'react';
import { useLanguage } from '../LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-600">{t('Language', 'ಭಾಷೆ')}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="text-sm px-2 py-1 rounded-md border border-gray-300 bg-white"
      >
        <option value="en">English</option>
        <option value="kn">ಕನ್ನಡ</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
