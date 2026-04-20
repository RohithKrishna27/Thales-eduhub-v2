import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import ThalesMissionShell from '../ThalesMissionShell';
import { clamp } from '../shared/clamp';
import AerospaceLabeledSlider from './AerospaceLabeledSlider';

const AerospaceThrustAltitude = () => {
  const { t } = useLanguage();
  const [thrust, setThrust] = useState(55);
  const [altitudeFt, setAltitudeFt] = useState(5000);
  const [weightKg, setWeightKg] = useState(2100);

  const metrics = useMemo(() => {
    const density = 1 - altitudeFt / 45000;
    const climb = clamp((thrust * 1.4 - weightKg / 55) * density, -800, 2500);
    const fuel = clamp(420 + thrust * 2.2 + altitudeFt / 400 + weightKg / 80, 200, 900);
    const temp = clamp(72 + thrust * 0.35 + altitudeFt / 900 - density * 15, 60, 120);
    return { climb, fuel, temp };
  }, [thrust, altitudeFt, weightKg]);

  const viz = (
    <div className="space-y-4">
      <div className="h-40 rounded-xl border border-slate-700 bg-slate-950 flex flex-col justify-end p-3">
        <div className="text-xs text-slate-500 mb-1">{t('Climb rate (sim fpm)', 'ಏರುವ ದರ (ಸಿಮ್ fpm)')}</div>
        <div
          className={`rounded-lg transition-all ${metrics.climb >= 0 ? 'bg-emerald-600/70' : 'bg-rose-600/70'}`}
          style={{ height: `${clamp(Math.abs(metrics.climb) / 25, 8, 100)}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-800/80 p-2">
          <div className="text-slate-500">{t('Climb fpm', 'ಏರು fpm')}</div>
          <div className="font-mono text-emerald-300">{metrics.climb.toFixed(0)}</div>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-2">
          <div className="text-slate-500">{t('Fuel flow', 'ಇಂಧನ ಹರಿವು')}</div>
          <div className="font-mono text-amber-300">{metrics.fuel.toFixed(0)}</div>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-2">
          <div className="text-slate-500">{t('EGT index', 'EGT ಸೂಚ್ಯಂಕ')}</div>
          <div className="font-mono text-rose-300">{metrics.temp.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );

  return (
    <ThalesMissionShell
      backTo="/thales-labs/aerospace"
      backLabelEn="Aerospace missions"
      backLabelKn="ಏರೋಸ್ಪೇಸ್ ಮಿಷನ್‌ಗಳು"
      titleEn="Thrust vs altitude trade-off"
      titleKn="ಥ್ರಸ್ಟ್ ವರ್ಸಸ್ ಎತ್ತರ ವ್ಯಾಪಾರ"
      subtitleEn="Density altitude eats performance"
      subtitleKn="ಸಾಂದ್ರತೆ ಎತ್ತರ ಕಾರ್ಯಕ್ಷಮತೆ ತಿನ್ನುತ್ತದೆ"
      steps={[
        { en: 'Take off with moderate thrust at low altitude — note climb margin.', kn: 'ಕಡಿಮೆ ಎತ್ತರದಲ್ಲಿ ಮಧ್ಯಮ ಥ್ರಸ್ಟ್ — ಏರುವ ಮಾರ್ಜಿನ್ ಗಮನಿಸಿ.' },
        { en: 'Climb toward 30,000 ft — thrust lever unchanged, climb decays.', kn: '೩೦೦೦೦ ಅಡಿ ಕಡೆಗೆ ಏರು — ಥ್ರಸ್ಟ್ ಅದೇ, ಏರುವಿಕೆ ಕುಸಿಯುತ್ತದೆ.' },
        { en: 'Add thrust or shed weight to hold climb in thin air.', kn: 'ಪಾತಳ ವಾಯುವಲ್ಲಿ ಏರಿಕೆ ಹಿಡಿದಿಡಲು ಥ್ರಸ್ಟ್ ಅಥವಾ ತೂಕ ಕಡಿಮೆ.' },
      ]}
      learningEn="Jet and propeller thrust feel different with altitude — flight management systems exist because human intuition alone drifts at cruise levels."
      learningKn="ಎತ್ತರದೊಂದಿಗೆ ಥ್ರಸ್ಟ್ ಬದಲಾಗುತ್ತದೆ — ಕ್ರೂಜ್ ಮಟ್ಟದಲ್ಲಿ ಮ್ಯಾನುವಲ್ ಅರ್ಥ ಮಾತ್ರ ಸಾಕಾಗದು."
      vizPanel={viz}
    >
      <AerospaceLabeledSlider labelEn="Thrust lever %" labelKn="ಥ್ರಸ್ಟ್ ಲಿವರ್ %" min={35} max={100} step={1} value={thrust} onChange={setThrust} />
      <AerospaceLabeledSlider labelEn="Pressure altitude (ft)" labelKn="ಒತ್ತಡ ಎತ್ತರ (ft)" min={0} max={36000} step={500} value={altitudeFt} onChange={setAltitudeFt} />
      <AerospaceLabeledSlider labelEn="Weight (kg)" labelKn="ತೂಕ (kg)" min={1700} max={3000} step={20} value={weightKg} onChange={setWeightKg} />
    </ThalesMissionShell>
  );
};

export default AerospaceThrustAltitude;
