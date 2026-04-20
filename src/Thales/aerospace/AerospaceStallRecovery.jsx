import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import ThalesMissionShell from '../ThalesMissionShell';
import AerospaceLabeledSlider from './AerospaceLabeledSlider';
import PlaneViz from './PlaneViz';

const AerospaceStallRecovery = () => {
  const { t } = useLanguage();
  const [aoa, setAoa] = useState(8);
  const [airspeed, setAirspeed] = useState(140);
  const [flaps, setFlaps] = useState(10);
  const [altitudeFt, setAltitudeFt] = useState(4500);

  const metrics = useMemo(() => {
    const stallWarn = aoa > 14 && airspeed < 125;
    const inStall = aoa > 17 && airspeed < 105;
    const recoveryLoss = inStall ? 180 + (aoa - 17) * 40 - flaps * 1.5 : stallWarn ? 40 : 0;
    const pitchDrop = inStall ? -18 - (aoa - 17) * 2 : stallWarn ? -8 : 2;
    return { stallWarn: stallWarn || inStall, inStall, recoveryLoss, pitchDrop };
  }, [aoa, airspeed, flaps, altitudeFt]);

  const viz = (
    <div className="space-y-4">
      <PlaneViz pitchDeg={metrics.pitchDrop} rollDeg={0} yawDeg={0} warn={metrics.stallWarn} />
      <div className="rounded-lg bg-slate-800/80 p-3 text-sm space-y-1">
        <div>
          <span className="text-slate-500">{t('Recovery altitude lost (sim ft)', 'ಚೇತರಿಕೆ ಎತ್ತರ ನಷ್ಟ (ಸಿಮ್ ft)')}: </span>
          <span className="font-mono text-amber-300">{metrics.recoveryLoss.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-slate-500">{t('Pressure altitude (ft)', 'ಒತ್ತಡ ಎತ್ತರ (ft)')}: </span>
          <span className="font-mono text-sky-300">{altitudeFt}</span>
        </div>
      </div>
    </div>
  );

  return (
    <ThalesMissionShell
      backTo="/thales-labs/aerospace"
      backLabelEn="Aerospace missions"
      backLabelKn="ಏರೋಸ್ಪೇಸ್ ಮಿಷನ್‌ಗಳು"
      titleEn="Stall & recovery training"
      titleKn="ಸ್ಟಾಲ್ ಮತ್ತು ಚೇತರಿಕೆ ತರಬೇತಿ"
      subtitleEn="AoA, energy, and flap effect"
      subtitleKn="AoA, ಶಕ್ತಿ, ಫ್ಲ್ಯಾಪ್ ಪರಿಣಾಮ"
      steps={[
        { en: 'Slow below cruise while gently increasing angle of attack.', kn: 'ಕ್ರೂಜ್ ಕೆಳಗೆ ನಿಧಾನಗೊಳಿಸಿ AoA ಹೆಚ್ಚಿಸಿ.' },
        { en: 'Listen for the synthetic stall warning — nose slices toward the horizon.', kn: 'ಸ್ಟಾಲ್ ಎಚ್ಚರಿಕೆ — ಮೂಕ್ ಕ್ಷಿತಿಜಕ್ಕೆ.' },
        { en: 'Recover: relax back-pressure, add coordinated power, level wings.', kn: 'ಚೇತರಿಕೆ: ಒತ್ತಡ ಕಡಿಮೆ, ಶಕ್ತಿ, ರೆಕ್ಕೆಗಳು ಸಮತಲ.' },
      ]}
      learningEn="Stalls are about exceeding the wing’s critical AoA, not a magic airspeed number — configuration and weight shift that number every flight."
      learningKn="ಸ್ಟಾಲ್‌ಗಳು ನಿರ್ದಿಷ್ಟ ವಾಯುವೇಗದ ಬಗ್ಗೆ ಅಲ್ಲ, ನಿರ್ಣಾಯಕ AoA ಮೀರಿದಾಗ — ಕಾನ್ಫಿಗರೇಶನ್ ಪ್ರತಿ ಫ್ಲೈಟ್‌ನಲ್ಲಿ ಸಂಖ್ಯೆಯನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ."
      vizPanel={viz}
    >
      <AerospaceLabeledSlider labelEn="Angle of attack °" labelKn="ಹಂತದ ಆಕ್ರಮಣ ಕೋನ °" min={4} max={22} step={1} value={aoa} onChange={setAoa} />
      <AerospaceLabeledSlider labelEn="Indicated airspeed (kt)" labelKn="ಸೂಚಿತ ವಾಯುವೇಗ (kt)" min={60} max={180} step={1} value={airspeed} onChange={setAirspeed} />
      <AerospaceLabeledSlider labelEn="Flap setting °" labelKn="ಫ್ಲ್ಯಾಪ್ ಸೆಟ್ಟಿಂಗ್ °" min={0} max={35} step={1} value={flaps} onChange={setFlaps} />
      <AerospaceLabeledSlider labelEn="Altitude (ft)" labelKn="ಎತ್ತರ (ft)" min={2000} max={12000} step={100} value={altitudeFt} onChange={setAltitudeFt} />
    </ThalesMissionShell>
  );
};

export default AerospaceStallRecovery;
