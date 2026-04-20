import React from 'react';
import { useLanguage } from '../../LanguageContext';

const PlaneViz = ({ pitchDeg, rollDeg, yawDeg, warn }) => {
  const { t } = useLanguage();
  return (
    <div className="aspect-video rounded-xl border border-sky-500/25 bg-gradient-to-b from-sky-950/80 to-slate-950 relative overflow-hidden flex items-center justify-center perspective-1000">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent" />
      <div
        className="relative w-48 h-16 transition-transform duration-150"
        style={{
          transform: `rotateX(${pitchDeg * 0.6}deg) rotateZ(${rollDeg * 0.8}deg) rotateY(${yawDeg * 0.4}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400 shadow-xl border border-slate-600" />
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-20 h-4 bg-slate-500 rounded-l-full" />
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-20 h-4 bg-slate-500 rounded-r-full" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-1 h-8 bg-red-500/80 rounded" />
      </div>
      {warn && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/90 text-black text-xs font-bold animate-pulse">
          {t('STALL WARN', 'ಸ್ಟಾಲ್ ಎಚ್ಚರಿಕೆ')}
        </div>
      )}
    </div>
  );
};

export default PlaneViz;
