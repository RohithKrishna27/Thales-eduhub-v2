import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Award, Globe, Layers, BookOpen, Clock, Activity } from 'lucide-react';
import CourseCertificateModal from './shared/CourseCertificateModal';

const MISSIONS = [
  {
    id: 'avionics-failure',
    titleEn: 'Full Avionics Failure Scenario',
    titleKn: 'ಸಂಪೂರ್ಣ ಏವಿಯಾನಿಕ್ಸ್ ವಿಫಲತೆ ದೃಶ್ಯ',
    blurbEn: 'Critical system failure management and manual landing margins.',
    blurbKn: 'ವಿಫಲ ವ್ಯವಸ್ಥೆ, ಮ್ಯಾನುವಲ್ ಭಾರ, ಲ್ಯಾಂಡಿಂಗ್ ಮಾರ್ಜಿನ್.',
    category: 'SAFETY',
    duration: '15 min'
  },
  {
    id: 'weight-balance',
    titleEn: 'Weight & Balance Effects',
    titleKn: 'ತೂಕ ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್ ಸ್ಥಿರತೆ',
    blurbEn: 'Studying Center of Gravity (CG) and its impact on pitch stability.',
    blurbKn: 'CG, ತೂಕ, ಸ್ಟಾಲ್ ವೇಗ, ಪಿಚ್ ಸ್ಥಿರತೆ.',
    category: 'PHYSICS',
    duration: '10 min'
  },
  {
    id: 'wind-gust-control',
    titleEn: 'Wind Gust & Control Surfaces',
    titleKn: 'ಗಾಳಿ ಗಸ್ಟ್ ಮತ್ತು ನಿಯಂತ್ರಣ ಮೇಲ್ಮೈಗಳು',
    blurbEn: 'Crosswind dynamics, elevator response, and attitude control.',
    blurbKn: 'ಕ್ರಾಸ್‌ವಿಂಡ್, ಎಲಿವೇಟರ್, ಐಲರಾನ್.',
    category: 'FLIGHT',
    duration: '12 min'
  },
  {
    id: 'thrust-altitude',
    titleEn: 'Thrust vs Altitude Trade-off',
    titleKn: 'ಥ್ರಸ್ಟ್ ವರ್ಸಸ್ ಎತ್ತರ ವ್ಯಾಪಾರ',
    blurbEn: 'Analyzing climb rates, fuel efficiency, and engine performance.',
    blurbKn: 'ಏರುವ ದರ, ಇಂಧನ, ಎಂಜಿನ್ ತಾಪಮಾನ.',
    category: 'ENGINE',
    duration: '08 min',
    comingSoon: true
  },
  {
    id: 'stall-recovery',
    titleEn: 'Stall & Recovery Training',
    titleKn: 'ಸ್ಟಾಲ್ ಮತ್ತು ಚೇತರಿಕೆ ತರಬೇತಿ',
    blurbEn: 'Understanding Angle of Attack (AoA) and airspeed recovery.',
    blurbKn: 'AoA, ವಾಯುವೇಗ, ಫ್ಲ್ಯಾಪ್‌ಗಳು, ಎಚ್ಚರಿಕೆಗಳು.',
    category: 'SAFETY',
    duration: '20 min',
    comingSoon: true
  },
];

const ThalesAerospaceHub = () => {
  const { t } = useLanguage();
  const [certModal, setCertModal] = useState(null);

  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 font-sans border-4 sm:border-[12px] border-slate-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Top Branding Section */}
      <header className="border-b-4 border-slate-900">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 flex flex-col md:flex-row justify-between items-stretch md:items-end gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 tracking-tighter uppercase">
                Edutech
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                {t('Mention by Thales', 'ಥೇಲ್ಸ್ ಪ್ರಸ್ತುತಪಡಿಸಿದ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-[1.05] break-words">
              THALES EDUTECH <span className="text-blue-600">AEROSPACE</span>
            </h1>
            <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
              {t('Advanced Flight Training & Simulation Environment', 'ಸುಧಾರಿತ ವಿಮಾನ ತರಬೇತಿ ಮತ್ತು ಸಿಮ್ಯುಲೇಶನ್ ಪರಿಸರ')}
            </p>
          </div>
          <div className="flex items-center gap-4 pb-1 md:self-end shrink-0">
            <LanguageSwitcher className="w-full md:w-auto justify-end md:justify-start" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen size={18} className="text-blue-600" />
          <h2 className="font-bold text-lg uppercase tracking-wider">{t('Mission Board', 'ಮಿಷನ್ ಬೋರ್ಡ್')}</h2>
          <div className="h-[1px] flex-grow bg-slate-200" />
        </div>

        {/* Board Layout */}
        <div className="border-x-2 border-t-2 border-slate-900">
          <div className="hidden md:flex flex-row bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <div className="w-32 shrink-0 p-3 text-center border-r-2 border-slate-900 flex items-center justify-center">
              {t('Slot', 'ಸ್ಲಾಟ್')}
            </div>
            <div className="flex-grow min-w-0 p-3 border-r-2 border-slate-900 flex items-center">
              {t('Mission', 'ಮಿಷನ್')}
            </div>
            <div className="w-48 shrink-0 p-3 text-center border-r-2 border-slate-900 flex items-center justify-center">
              {t('Lab', 'ಲ್ಯಾಬ್')}
            </div>
            <div className="w-44 shrink-0 p-3 text-center flex items-center justify-center">
              {t('Certificate', 'ಪ್ರಮಾಣಪತ್ರ')}
            </div>
          </div>
          {MISSIONS.map((m, index) => (
            <div 
              key={m.id} 
              className="group flex flex-col md:flex-row border-b-2 border-slate-900 hover:bg-slate-50 transition-all"
            >
              {/* ID & Category */}
              <div className="md:w-32 p-3 sm:p-4 flex flex-row md:flex-col justify-between md:justify-center items-center gap-2 md:gap-0 border-b md:border-b-0 md:border-r-2 border-slate-900 bg-slate-50 group-hover:bg-blue-50 transition-colors">
                <span className="text-xs font-black text-slate-400 group-hover:text-blue-600">0{index + 1}</span>
                <span className="text-[10px] font-bold tracking-widest text-slate-900 mt-1">{m.category}</span>
              </div>

              {/* Main Content */}
              <div className="flex-grow p-4 sm:p-6 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                   <Clock size={14} className="text-slate-400 shrink-0" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase">{m.duration} {t('Duration', 'ಅವಧಿ')}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                  {t(m.titleEn, m.titleKn)}
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {t(m.blurbEn, m.blurbKn)}
                </p>
              </div>

              <div className="grid grid-cols-2 border-t-2 border-slate-900 md:contents">
                {/* Action Button */}
                <div className="md:w-48 p-3 sm:p-6 flex items-stretch justify-center border-r-2 border-slate-900 md:border-r-0 md:border-t-0 md:border-l-2 border-slate-900 touch-manipulation">
                  {m.comingSoon ? (
                    <button type="button" className="w-full min-h-12 py-3 sm:py-4 bg-slate-300 text-slate-600 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-60 flex items-center justify-center">
                      {t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')}
                    </button>
                  ) : (
                    <Link 
                      to={`/thales-labs/aerospace/${m.id}`}
                      className="w-full min-h-12 py-3 sm:py-4 flex items-center justify-center bg-slate-900 text-white text-center text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-[3px_3px_0px_0px_rgba(37,99,235,1)] sm:shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] md:hover:shadow-none md:hover:translate-x-0.5 md:hover:translate-y-0.5"
                    >
                      {t('Launch Lab', 'ಲ್ಯಾಬ್ ಪ್ರಾರಂಭಿಸಿ')}
                    </Link>
                  )}
                </div>

                {/* Certificate — opens completion modal (demo: Rahul O P) */}
                <div className="md:w-44 p-3 sm:p-6 flex items-stretch justify-center md:border-t-0 md:border-l-2 border-slate-900 bg-slate-50/80 group-hover:bg-blue-50/50 touch-manipulation">
                  <button
                    type="button"
                    onClick={() =>
                      setCertModal({
                        title: t(m.titleEn, m.titleKn),
                      })
                    }
                    className="w-full min-h-12 py-3 px-1 sm:px-2 flex flex-col items-center justify-center gap-1 border-2 border-slate-900 bg-white text-slate-900 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 active:opacity-95 transition-colors shadow-[2px_2px_0_0_rgba(37,99,235,0.35)] sm:shadow-[3px_3px_0_0_rgba(37,99,235,0.35)]"
                  >
                    <Award size={18} className="shrink-0" strokeWidth={2} />
                    <span className="text-center leading-tight">{t('View certificate', 'ಪ್ರಮಾಣಪತ್ರ ವೀಕ್ಷಿಸಿ')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <CourseCertificateModal
        isOpen={!!certModal}
        onClose={() => setCertModal(null)}
        missionTitle={certModal?.title ?? ''}
        trackLabel={t('Thales Edutech Aerospace', 'ಥೇಲ್ಸ್ ಎಡುಟೆಕ್ ಏರೋಸ್ಪೇಸ್')}
        accent="blue"
      />

      <footer className="max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-12 flex flex-col md:flex-row justify-between items-center md:items-end text-center md:text-left border-t border-slate-100 gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1"><Globe size={12}/> THALES GLOBAL</div>
          <div className="flex items-center gap-1"><Layers size={12}/> AEROSPACE DIVISION</div>
          <div className="flex items-center gap-1"><Activity size={12}/> SYSTEM V4.0</div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          © 2026 Thales Group Edutech Initiative
        </p>
      </footer>
    </div>
  );
};

export default ThalesAerospaceHub;