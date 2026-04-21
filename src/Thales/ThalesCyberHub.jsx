import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Award, ShieldAlert, Lock, Zap, Skull, Sword, Terminal } from 'lucide-react';
import CourseCertificateModal from './shared/CourseCertificateModal';

const MISSIONS = [
  {
    id: 'firewall-tuning',
    icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
    titleEn: 'Basic Firewall Rule Tuning',
    titleKn: 'ಮೂಲ ಫೈರ್‌ವಾಲ್ ನಿಯಮ ಸರಿಪಡಿಸುವಿಕೆ',
    blurbEn: 'Managing SYN flood attacks vs rule sets to minimize breach rates.',
    blurbKn: 'SYN ಫ್ಲಡ್ ಮತ್ತು ನಿಯಮಗಳು — ಉಲ್ಲಂಘನೆ ದರ ಮತ್ತು ನಿರ್ಬಂಧಿತ ಪ್ಯಾಕೆಟ್‌ಗಳು.',
    category: 'NETWORK',
    status: 'Ready'
  },
  {
    id: 'encryption-performance',
    icon: <Lock className="w-5 h-5 text-red-600" />,
    titleEn: 'Encryption vs Performance',
    titleKn: 'ಗೂಢಲಿಪೀಕರಣ ಬಲ ಮತ್ತು ಕಾರ್ಯಕ್ಷಮತೆ',
    blurbEn: 'Balancing key length and CPU latency against brute-force horizons.',
    blurbKn: 'ಕೀ ಉದ್ದ, CPU, ವಿಳಂಬ, ಬ್ರೂಟ್ ಫೋರ್ಸ್ ಕಾಲ.',
    category: 'CRYPTOGRAPHY',
    status: 'Ready'
  },
  {
    id: 'ddos-mitigation',
    icon: <Zap className="w-5 h-5 text-red-600" />,
    titleEn: 'DDoS Mitigation Challenge',
    titleKn: 'DDoS ನಿವಾರಣೆ ಸವಾಲು',
    blurbEn: 'Analyzing traffic spikes, rate limits, and downtime mitigation costs.',
    blurbKn: 'ಟ್ರಾಫಿಕ್, ದರ ಮಿತಿ, ಪ್ಯಾಚ್‌ಗಳು, ವಿರಾಮ ವೆಚ್ಚ.',
    category: 'INFRA',
    status: 'Active'
  },
  {
    id: 'phishing-ransomware',
    icon: <Skull className="w-5 h-5 text-red-600" />,
    titleEn: 'Phishing + Ransomware Combo',
    titleKn: 'ಫಿಶಿಂಗ್ + ರansomವೇರ್ ಕಾಂಬೋ',
    blurbEn: 'Studying infection vectors, encryption spreads, and recovery times.',
    blurbKn: 'ಹರಡುವಿಕೆ, ಗೂಢಲಿಪೀಕರಣ, ಬ್ಯಾಕಪ್, ಚೇತರಿಕೆ ಸಮಯ.',
    category: 'THREATS',
    status: 'Ready'
  },
  {
    id: 'red-blue-battle',
    icon: <Sword className="w-5 h-5 text-red-600" />,
    titleEn: 'Full Red vs Blue Battle',
    titleKn: 'ಸಂಪೂರ್ಣ ರೆಡ್ ವರ್ಸಸ್ ಬ್ಲೂ ಯುದ್ಧ',
    blurbEn: 'Advanced simulation combining attack pickers and complex defenses.',
    blurbKn: 'ದಾಳಿ ಆಯ್ಕೆ, ಸಂಯುಕ್ತ ರಕ್ಷಣೆ, ಉಲ್ಲಂಘನೆ ಅಂಕ.',
    category: 'WARGAMING',
    status: 'Expert'
  },
];

const ThalesCyberHub = () => {
  const { t } = useLanguage();
  const [certModal, setCertModal] = useState(null);

  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 font-sans border-4 sm:border-[12px] border-slate-50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Top Branding Section */}
      <header className="border-b-4 border-slate-900">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 flex flex-col md:flex-row justify-between items-stretch md:items-end gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 tracking-tighter uppercase">
                Edutech
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                {t('Mention by Thales', 'ಥೇಲ್ಸ್ ಪ್ರಸ್ತುತಪಡಿಸಿದ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-[1.05] break-words">
              THALES EDUTECH <span className="text-red-600">CYBERSECURITY</span>
            </h1>
            <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
              {t('Defense Training & Threat Intelligence Environment', 'ರಕ್ಷಣಾ ತರಬೇತಿ ಮತ್ತು ಬೆದರಿಕೆ ಗುಪ್ತಚರ ಪರಿಸರ')}
            </p>
          </div>
          <div className="flex items-center gap-4 pb-1 md:self-end shrink-0">
            <LanguageSwitcher className="w-full md:w-auto justify-end md:justify-start" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="flex items-center gap-2 mb-8">
          <Terminal size={18} className="text-red-600" />
          <h2 className="font-bold text-lg uppercase tracking-wider">{t('Mission Board', 'ಮಿಷನ್ ಬೋರ್ಡ್')}</h2>
          <div className="h-[1px] flex-grow bg-slate-200" />
        </div>

        {/* Board Layout */}
        <div className="border-x-2 border-t-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
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
              <div className="md:w-32 p-3 sm:p-4 flex flex-row md:flex-col justify-between md:justify-center items-center gap-2 md:gap-0 border-b md:border-b-0 md:border-r-2 border-slate-900 bg-slate-50 group-hover:bg-red-50 transition-colors">
                <span className="text-xs font-black text-slate-400 group-hover:text-red-600">0{index + 1}</span>
                <span className="text-[9px] font-black tracking-widest text-slate-900 md:mt-1 uppercase text-center">{m.category}</span>
              </div>

              {/* Main Content */}
              <div className="flex-grow p-4 sm:p-6 min-w-0">
                <div className="flex items-center gap-3 mb-2 min-w-0">
                   <span className="shrink-0">{m.icon}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{m.status}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-red-700 leading-tight">
                  {t(m.titleEn, m.titleKn)}
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {t(m.blurbEn, m.blurbKn)}
                </p>
              </div>

              <div className="grid grid-cols-2 border-t-2 border-slate-900 md:contents">
                <div className="md:w-48 p-3 sm:p-6 flex items-stretch justify-center border-r-2 border-slate-900 md:border-r-0 md:border-t-0 md:border-l-2 border-slate-900 touch-manipulation">
                  {m.comingSoon ? (
                    <button type="button" className="w-full min-h-12 py-3 sm:py-4 bg-slate-300 text-slate-600 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-60 flex items-center justify-center">
                      {t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')}
                    </button>
                  ) : (
                    <Link 
                      to={`/thales-labs/cyber/${m.id}`}
                      className="w-full min-h-12 py-3 sm:py-4 flex items-center justify-center bg-slate-900 text-white text-center text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-red-600 active:bg-red-700 transition-colors shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] sm:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] md:hover:shadow-none md:hover:translate-x-0.5 md:hover:translate-y-0.5"
                    >
                      {t('Initialize Lab', 'ಲ್ಯಾಬ್ ಪ್ರಾರಂಭಿಸಿ')}
                    </Link>
                  )}
                </div>

                <div className="md:w-44 p-3 sm:p-6 flex items-stretch justify-center md:border-t-0 md:border-l-2 border-slate-900 bg-slate-50/80 group-hover:bg-red-50/50 touch-manipulation">
                  <button
                    type="button"
                    onClick={() =>
                      setCertModal({
                        title: t(m.titleEn, m.titleKn),
                      })
                    }
                    className="w-full min-h-12 py-3 px-1 sm:px-2 flex flex-col items-center justify-center gap-1 border-2 border-slate-900 bg-white text-slate-900 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 active:opacity-95 transition-colors shadow-[2px_2px_0_0_rgba(220,38,38,0.35)] sm:shadow-[3px_3px_0_0_rgba(220,38,38,0.35)]"
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
        trackLabel={t('Thales Edutech Cybersecurity', 'ಥೇಲ್ಸ್ ಎಡುಟೆಕ್ ಸೈಬರ್ ಸುರಕ್ಷತೆ')}
        accent="red"
      />

      <footer className="max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-slate-100">
        <div className="flex flex-col items-center text-center md:items-stretch md:text-left md:flex-row justify-between gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-md">
            Thales Cyber Defense Academy // Secure Internal Node
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] shrink-0">
            © 2026 Thales Group Edutech Initiative
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ThalesCyberHub;