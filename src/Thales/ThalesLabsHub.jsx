import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ThalesLabsHub = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="border-b border-cyan-500/25 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">Thales</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-tight">
              {t('Mission lab hub', 'ಮಿಷನ್ ಲ್ಯಾಬ್ ಹಬ್')}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              {t(
                'Pick a track. Each mission uses sliders and instant feedback like a hands-on lab.',
                'ಟ್ರ್ಯಾಕ್ ಆಯ್ಕೆಮಾಡಿ. ಪ್ರತಿ ಮಿಷನ್‌ನಲ್ಲಿ ಸ್ಲೈಡರ್‌ಗಳು ಮತ್ತು ತಕ್ಷಣದ ಪ್ರತಿಕ್ರಿಯೆ ಇರುತ್ತದೆ.'
              )}
            </p>
          </div>
          <LanguageSwitcher className="self-start sm:self-center" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Link
          to="/thales-labs/cyber"
          className="group rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/60 to-slate-900/80 p-5 sm:p-6 min-h-[11rem] active:scale-[0.99] transition-all hover:border-red-400/60 md:hover:shadow-lg md:hover:shadow-red-900/20 touch-manipulation"
        >
          <div className="text-3xl mb-3">🛡️</div>
          <h2 className="text-xl font-bold text-white group-hover:text-red-200">
            {t('Cyber attack & defence', 'ಸೈಬರ್ ದಾಳಿ ಮತ್ತು ರಕ್ಷಣೆ')}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {t('Network dashboard missions (red / blue style).', 'ನೆಟ್‌ವರ್ಕ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮಿಷನ್‌ಗಳು.')}
          </p>
          <p className="text-cyan-400 text-sm font-medium mt-4">{t('5 missions →', '೫ ಮಿಷನ್‌ಗಳು →')}</p>
        </Link>

        <Link
          to="/thales-labs/aerospace"
          className="group rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/60 to-slate-900/80 p-5 sm:p-6 min-h-[11rem] active:scale-[0.99] transition-all hover:border-sky-400/60 md:hover:shadow-lg md:hover:shadow-sky-900/20 touch-manipulation"
        >
          <div className="text-3xl mb-3">✈️</div>
          <h2 className="text-xl font-bold text-white group-hover:text-sky-200">
            {t('Flight dynamics & avionics', 'ಫ್ಲೈಟ್ ಡೈನಾಮಿಕ್ಸ್ ಮತ್ತು ಏವಿಯಾನಿಕ್ಸ್')}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {t('3D-style aircraft view with live graphs.', 'ಲೈವ್ ಗ್ರಾಫ್‌ಗಳೊಂದಿಗೆ ವಿಮಾನ ನೋಟ.')}
          </p>
          <p className="text-cyan-400 text-sm font-medium mt-4">{t('5 missions →', '೫ ಮಿಷನ್‌ಗಳು →')}</p>
        </Link>
      </main>
    </div>
  );
};

export default ThalesLabsHub;
