import React from 'react';
import { useLanguage } from '../LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-600 shrink-0">{t('Language', 'ಭಾಷೆ')}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="min-h-11 min-w-[8.5rem] text-base sm:text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white touch-manipulation"
      >
        <option value="en">English</option>
        <option value="kn">ಕನ್ನಡ</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
