import React from 'react';
import { useLanguage } from '../../LanguageContext';

const CyberLabeledSlider = ({ labelEn, labelKn, min, max, step, value, onChange, unit = '' }) => {
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{t(labelEn, labelKn)}</span>
        <span className="text-cyan-300">
          {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-500"
      />
    </div>
  );
};

export default CyberLabeledSlider;
