import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useThalesMode } from './ThalesModeContext';

const ThalesTopBar = () => {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { thalesMode, setThalesMode } = useThalesMode();

  const onThalesPath = location.pathname.startsWith('/thales-labs');
  const switchOn = thalesMode || onThalesPath;

  const dashboardPath = userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';

  const handleToggle = (next) => {
    if (next) {
      setThalesMode(true);
      navigate('/thales-labs');
    } else {
      setThalesMode(false);
      navigate(dashboardPath);
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-lg shadow-cyan-900/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-11 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-400/90 shrink-0">
            Thales
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-xs sm:text-sm text-slate-200 truncate">
            {t('Lab mission mode', 'ಲ್ಯಾಬ್ ಮಿಷನ್ ಮೋಡ್')}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <span className="text-xs text-slate-400 hidden xs:inline sm:inline">
            {t('Cyber & Aerospace sims', 'ಸೈಬರ್ ಮತ್ತು ಏರೋಸ್ಪೇಸ್ ಸಿಮ್')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={switchOn}
            onClick={() => handleToggle(!switchOn)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              switchOn ? 'bg-cyan-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                switchOn ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
};

export default ThalesTopBar;
