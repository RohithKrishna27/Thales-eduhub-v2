import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

/**
 * Qwiklabs-style shell: guided steps, controls slot, metrics / “3D” slot, learning takeaway.
 */
const ThalesMissionShell = ({
  backTo,
  backLabelEn,
  backLabelKn,
  titleEn,
  titleKn,
  subtitleEn,
  subtitleKn,
  steps,
  learningEn,
  learningKn,
  children,
  vizPanel,
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={backTo}
              className="shrink-0 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              ← {t(backLabelEn, backLabelKn)}
            </Link>
            <div className="h-6 w-px bg-slate-600 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">{t(titleEn, titleKn)}</h1>
              {(subtitleEn || subtitleKn) && (
                <p className="text-xs sm:text-sm text-slate-400 truncate">{t(subtitleEn, subtitleKn)}</p>
              )}
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-3">
            {t('Mission steps', 'ಮಿಷನ್ ಹಂತಗಳು')}
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-200">
            {steps.map((step, i) => (
              <li key={i}>{t(step.en, step.kn)}</li>
            ))}
          </ol>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">
              {t('Controls', 'ನಿಯಂತ್ರಣಗಳು')}
            </h2>
            {children}
          </section>
          <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">
              {t('Live dashboard / view', 'ಲೈವ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ / ನೋಟ')}
            </h2>
            {vizPanel}
          </section>
        </div>

        <section className="rounded-2xl border border-violet-500/30 bg-violet-950/40 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wide mb-2">
            {t('Learning takeaway', 'ಕಲಿಕೆಯ ತೆಗೆದುಕೊಳ್ಳುವಿಕೆ')}
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed">{t(learningEn, learningKn)}</p>
        </section>
      </main>
    </div>
  );
};

export default ThalesMissionShell;
