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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 min-h-12 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 basis-[min(100%,12rem)]">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-400/90 shrink-0">
            Thales
          </span>
          <span className="text-slate-500 hidden sm:inline shrink-0">|</span>
          <span className="text-xs sm:text-sm text-slate-200 truncate min-w-0">
            {t('Lab mission mode', 'ಲ್ಯಾಬ್ ಮಿಷನ್ ಮೋಡ್')}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0 touch-manipulation py-1 -my-1">
          <span className="text-[11px] sm:text-xs text-slate-400 max-w-[10rem] sm:max-w-none leading-tight hidden sm:inline">
            {t('Cyber & Aerospace sims', 'ಸೈಬರ್ ಮತ್ತು ಏರೋಸ್ಪೇಸ್ ಸಿಮ್')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={switchOn}
            onClick={() => handleToggle(!switchOn)}
            className={`relative w-12 h-7 min-w-[3rem] min-h-[1.75rem] rounded-full transition-colors touch-manipulation active:opacity-90 ${
              switchOn ? 'bg-cyan-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
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
