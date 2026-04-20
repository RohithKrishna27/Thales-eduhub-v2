import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, Beaker, Gem, Microscope, Leaf, BarChart3, 
  Magnet, Activity, LogOut, Wifi, ChevronRight, Languages 
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useOfflineAccess } from '../OfflineAccessContext';

const OfflineStudentHome = () => {
  // Assuming 'language' is the current code ('en' or 'kn') 
  // and 'setLanguage' is the function to change it
  const { t, language, setLanguage } = useLanguage();
  const { disableOfflineStudentMode } = useOfflineAccess();

  const offlineExperiments = [
    { id: 'ohms', title: "Ohm's Law", knTitle: "ಓಮ್ನ ನಿಯಮ", route: '/ohms-law-experiment', icon: <Zap className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600' },
    { id: 'titration', title: 'Acid-Base Titration', knTitle: "ಆಮ್ಲ-ಪ್ರತ್ಯಾಮ್ಲ ಶೀರ್ಷಿಕೆ", route: '/acid-base-titration-experiment', icon: <Beaker className="w-5 h-5" />, color: 'bg-rose-100 text-rose-600' },
    { id: 'crystal', title: 'Crystallization', knTitle: "ಸ್ಪಟಿಕೀಕರಣ", route: '/crystallization-process', icon: <Gem className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
    { id: 'micro', title: 'Microscopy', knTitle: "ಸೂಕ್ಷ್ಮದರ್ಶಕ ತಂತ್ರಗಳು", route: '/microscopy-techniques', icon: <Microscope className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'photo', title: 'Photosynthesis', knTitle: "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ", route: '/photosynthesis-experiment', icon: <Leaf className="w-5 h-5" />, color: 'bg-green-100 text-green-600' },
    { id: 'stats', title: 'Data Analysis', knTitle: "ದತ್ತಾಂಶ ವಿಶ್ಲೇಷಣೆ", route: '/statistics-data-analysis', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600' },
    { id: 'hysteresis', title: 'Magnetic Hysteresis', knTitle: "ಕಾಂತೀಯ ಹಿಸ್ಟರೆಸಿಸ್", route: '/magnetic-hysteresis-experiment', icon: <Magnet className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
    { id: 'clip', title: 'Clipping & Clamping', knTitle: "ಕ್ಲಿಪಿಂಗ್ ಮತ್ತು ಕ್ಲ್ಯಾಂಪಿಂಗ್", route: '/clipping-clamping-experiment', icon: <Activity className="w-5 h-5" />, color: 'bg-cyan-100 text-cyan-600' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 sm:p-8 font-sans">
      <div className="mx-auto max-w-4xl">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'kn' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>

          <button
            onClick={disableOfflineStudentMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors text-sm font-bold"
          >
            <Wifi className="w-4 h-4" />
            {t('Go Online', 'ಆನ್‌ಲೈನ್‌ಗೆ')}
          </button>
        </div>

        {/* Hero Section */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
              {t('Offline Mode Enabled', 'ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ')}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-3">
            {t('Student Dashboard', 'ವಿದ್ಯಾರ್ಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg">
            {t(
              'Select an experiment to begin practicing. No internet required.',
              'ಅಭ್ಯಾಸ ಮಾಡಲು ಒಂದು ಪ್ರಯೋಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯವಿಲ್ಲ.'
            )}
          </p>
        </header>

        {/* Experiment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offlineExperiments.map((exp) => (
            <Link
              key={exp.id}
              to={exp.route}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
            >
              <div className={`p-3.5 rounded-xl transition-transform group-hover:rotate-6 ${exp.color}`}>
                {exp.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                  {language === 'kn' ? exp.knTitle : exp.title}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 inline-block">
                  {t('Simulation', 'ಸಿಮ್ಯುಲೇಶನ್')}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Thales Hub Mode Section */}
        <section className="mt-16 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
            <h2 className="text-3xl font-black text-slate-900">{t('Thales Professional Hub', 'ಥೇಲ್ಸ್ ವೃತ್ತಿಪರ ಹಬ್')}</h2>
            <div className="flex-grow h-[1px] bg-slate-200"></div>
          </div>
          <p className="text-slate-600 mb-6 max-w-3xl font-semibold">
            {t('Advanced aerospace and cybersecurity training modules. Interactive simulations optimized for offline practice.', 'ಉನ್ನತ ವೈಮಾನಿಕ ಮತ್ತು ಸೈಬರ್ ತರಬೇತಿ ಮಾಡ್ಯೂಲ್‌ಗಳು. ಆಫ್‌ಲೈನ್ ಅಭ್ಯಾಸಕ್ಕೆ ಉತ್ತಮ.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Aerospace Hub Card */}
            <Link
              to="/thales-labs/aerospace"
              className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-300 hover:border-blue-600 hover:shadow-2xl transition-all"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">✈️</div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">{t('Aerospace Hub', 'ಏರೋಸ್ಪೇಸ್ ಹಬ್')}</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('Thales Aerospace Division', 'ಥೇಲ್ಸ್ ಏರೋಸ್ಪೇಸ್ ವಿಭಾಗ')}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-blue-600 group-hover:translate-x-2 transition-transform" />
              </div>
              <p className="text-sm text-slate-600 mb-6">
                {t('Flight dynamics, weight & balance, avionics failure scenarios, stall recovery, and engine performance analysis.', 'ವಿಮಾನ ಗತಿವಿಜ್ಞಾನ, ತೂಕ ಸ್ಥಿರತೆ, ಏವಿಯಾನಿಕ್ಸ್ ವಿಫಲತೆ, ಮತ್ತು ಇಂಜಿನ್ ಕಾರ್ಯಕ್ಷಮತೆ.')}
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">{t('5 Simulations', '5 ಸಿಮ್ಯುಲೇಶನ್‌ಗಳು')}</span>
                <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">{t('Available Now', 'ಈಗ ಲಭ್ಯ')}</span>
              </div>
            </Link>

            {/* Cybersecurity Hub Card */}
            <Link
              to="/thales-labs/cyber"
              className="group p-8 rounded-2xl bg-gradient-to-br from-red-50 to-slate-50 border-2 border-red-300 hover:border-red-600 hover:shadow-2xl transition-all"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">{t('Cybersecurity Hub', 'ಸೈಬರ್ ಸುರಕ್ಷತೆ ಹಬ್')}</h3>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{t('Thales Cyber Defense', 'ಥೇಲ್ಸ್ ಸೈಬರ್ ರಕ್ಷ್ಯ')}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-red-600 group-hover:translate-x-2 transition-transform" />
              </div>
              <p className="text-sm text-slate-600 mb-6">
                {t('Network defense, encryption strategies, DDoS mitigation, phishing detection, and advanced threat analysis.', 'ನೆಟ್‌ವರ್ಕ್ ರಕ್ಷ್ಯ, ಗೂಢಲಿಪೀಕರಣ, DDoS ನಿವಾರಣೆ, ಫಿಶಿಂಗ್ ಪತ್ತೆ, ಮತ್ತು ವಿಶ್ಲೇಷಣೆ.')}
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">{t('5 Simulations', '5 ಸಿಮ್ಯುಲೇಶನ್‌ಗಳು')}</span>
                <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">{t('Available Now', 'ಈಗ ಲಭ್ಯ')}</span>
              </div>
            </Link>
          </div>

          {/* Upcoming Modules in Offline Mode */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-l-4 border-blue-600 p-6 rounded-lg mb-8">
            <h4 className="text-lg font-black text-slate-900 mb-4">{t('Coming Soon in Offline Mode', 'ಆಫ್‌ಲೈನ್ ಮೋಡ್‌ನಲ್ಲಿ ಶೀಘ್ರದಲ್ಲೇ')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-1">Thrust vs Altitude Trade-off</p>
                <p className="text-xs text-slate-500">Analyzing climb rates, fuel efficiency, and engine performance.</p>
                <span className="inline-block mt-3 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded">{t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-1">Stall & Recovery Training</p>
                <p className="text-xs text-slate-500">Understanding Angle of Attack (AoA) and airspeed recovery.</p>
                <span className="inline-block mt-3 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded">{t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-1">Basic Firewall Rule Tuning</p>
                <p className="text-xs text-slate-500">Managing SYN flood attacks vs rule sets to minimize breach rates.</p>
                <span className="inline-block mt-3 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded">{t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-1">Phishing + Ransomware Combo</p>
                <p className="text-xs text-slate-500">Studying infection vectors, encryption spreads, and recovery times.</p>
                <span className="inline-block mt-3 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded">{t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs font-medium text-slate-500">
            © 2026 Virtual Labs • {t('Optimized for Mobile', 'ಮೊಬೈಲ್ ಆಪ್ಟಿಮೈಸ್ಡ್')}
          </p>
          <Link
            to="/login"
            className="flex items-center gap-2 text-slate-600 hover:text-rose-600 transition-colors font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            {t('Back to Login', 'ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ')}
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default OfflineStudentHome;