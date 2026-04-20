import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import ThalesMissionShell from '../ThalesMissionShell';
import { clamp } from '../shared/clamp';
import CyberLabeledSlider from './CyberLabeledSlider';

const CyberPhishingRansomware = () => {
  const { t } = useLanguage();
  const [patchLevel, setPatchLevel] = useState(45);
  const [training, setTraining] = useState(40);
  const [filterStrict, setFilterStrict] = useState(50);
  const [backup, setBackup] = useState('partial');

  const metrics = useMemo(() => {
    const exposure = ((100 - patchLevel) / 100) * ((100 - training) / 100) * ((100 - filterStrict) / 100);
    const spread = clamp(exposure * 100, 0, 100);
    const filesEnc = spread * 1.8;
    const ransom = spread * 12000;
    const recovery =
      backup === 'good' ? 2 + spread * 0.04 : backup === 'partial' ? 12 + spread * 0.15 : 48 + spread * 0.35;
    return { spread, filesEnc, ransom, recovery };
  }, [patchLevel, training, filterStrict, backup]);

  const viz = (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl border border-rose-500/30 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/40 to-transparent transition-all" style={{ opacity: metrics.spread / 100 }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs uppercase text-slate-500">{t('Infection spread', 'ಸೋಂಕು ಹರಡುವಿಕೆ')}</p>
          <p className="text-4xl font-mono text-rose-300">{metrics.spread.toFixed(0)}%</p>
          <p className="text-sm text-slate-300 mt-2">
            {t('Files encrypted (index)', 'ಗೂಢಲಿಪೀಕೃತ ಫೈಲ್‌ಗಳು')}
            : {metrics.filesEnc.toFixed(0)}
          </p>
          <p className="text-amber-300 text-sm mt-1">
            {t('Ransom demand (sim $)', 'ರansom ಬೇಡಿಕೆ (ಸಿಮ್ $)')}: ${metrics.ransom.toFixed(0)}
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-slate-800/80 p-3 text-sm">
        <span className="text-slate-500">{t('Recovery time (sim hours)', 'ಚೇತರಿಕೆ ಸಮಯ (ಸಿಮ್ ಗಂಟೆ)')}: </span>
        <span className="font-mono text-emerald-300">{metrics.recovery.toFixed(1)} h</span>
      </div>
    </div>
  );

  return (
    <ThalesMissionShell
      backTo="/thales-labs/cyber"
      backLabelEn="Cyber missions"
      backLabelKn="ಸೈಬರ್ ಮಿಷನ್‌ಗಳು"
      titleEn="Phishing + ransomware combo"
      titleKn="ಫಿಶಿಂಗ್ + ರansomವೇರ್ ಕಾಂಬೋ"
      subtitleEn="Human + technical controls together"
      subtitleKn="ಮಾನವ + ತಾಂತ್ರಿಕ ನಿಯಂತ್ರಣ ಒಟ್ಟಿಗೆ"
      steps={[
        { en: 'Deliver a phishing lure — low training raises click risk.', kn: 'ಫಿಶಿಂಗ್ ಲ್ಯೂರ್ — ಕಡಿಮೆ ತರಬೇತಿ ಕ್ಲಿಕ್ ಅಪಾಯವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.' },
        { en: 'Let ransomware spread across unpatched endpoints.', kn: 'ಪ್ಯಾಚ್ ಮಾಡದ ಎಂಡ್‌ಪಾಯಿಂಟ್‌ಗಳಲ್ಲಿ ರansomವೇರ್ ಹರಡಲಿ.' },
        { en: 'Raise training, filters, patches, and test restores from backups.', kn: 'ತರಬೇತಿ, ಫಿಲ್ಟರ್, ಪ್ಯಾಚ್ ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಬ್ಯಾಕಪ್‌ನಿಂದ ಮರುಸ್ಥಾಪನೆ ಪರೀಕ್ಷಿಸಿ.' },
      ]}
      learningEn="Technology alone rarely stops determined humans — patching plus awareness plus backups beats any single silver bullet."
      learningKn="ತಂತ್ರಜ್ಞಾನ ಮಾತ್ರ ಸಾಕಾಗುವುದಿಲ್ಲ — ಪ್ಯಾಚಿಂಗ್, ಜಾಗೃತಿ ಮತ್ತು ಬ್ಯಾಕಪ್‌ಗಳು ಒಟ್ಟಿಗೆ ಉತ್ತಮ."
      vizPanel={viz}
    >
      <CyberLabeledSlider labelEn="Endpoint patch level" labelKn="ಎಂಡ್‌ಪಾಯಿಂಟ್ ಪ್ಯಾಚ್ ಮಟ್ಟ" min={0} max={100} step={1} value={patchLevel} onChange={setPatchLevel} />
      <CyberLabeledSlider labelEn="User training level" labelKn="ಬಳಕೆದಾರ ತರಬೇತಿ ಮಟ್ಟ" min={0} max={100} step={1} value={training} onChange={setTraining} />
      <CyberLabeledSlider labelEn="Email filter strictness" labelKn="ಇಮೇಲ್ ಫಿಲ್ಟರ್ ಕಠಿಣತೆ" min={0} max={100} step={1} value={filterStrict} onChange={setFilterStrict} />
      <div>
        <div className="text-xs text-slate-400 mb-2">{t('Backup readiness', 'ಬ್ಯಾಕಪ್ ಸಿದ್ಧತೆ')}</div>
        <select
          value={backup}
          onChange={(e) => setBackup(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="good">{t('Hot backups tested', 'ಹಾಟ್ ಬ್ಯಾಕಪ್ ಪರೀಕ್ಷಿತ')}</option>
          <option value="partial">{t('Partial / stale', 'ಭಾಗಶಃ / ಹಳೆಯ')}</option>
          <option value="none">{t('No reliable backup', 'ನಂಬಲರ್ಹ ಬ್ಯಾಕಪ್ ಇಲ್ಲ')}</option>
        </select>
      </div>
    </ThalesMissionShell>
  );
};

export default CyberPhishingRansomware;
