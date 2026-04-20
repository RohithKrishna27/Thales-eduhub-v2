import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import ThalesMissionShell from '../ThalesMissionShell';
import { clamp } from '../shared/clamp';
import CyberLabeledSlider from './CyberLabeledSlider';

const CyberFirewallTuning = () => {
  const { t } = useLanguage();
  const [strictness, setStrictness] = useState(35);
  const [openPorts, setOpenPorts] = useState(6);
  const [trafficLoad, setTrafficLoad] = useState(50);
  const [synFlood, setSynFlood] = useState(true);

  const metrics = useMemo(() => {
    const base = (openPorts * 12) / Math.max(strictness, 8);
    const loadFactor = 1 + trafficLoad / 120;
    const breach = synFlood ? clamp(base * loadFactor, 0, 100) : clamp(openPorts * 3 - strictness * 0.4, 0, 45);
    const blocked = clamp(100 - breach * 0.85 + strictness * 0.15, 5, 99);
    const downtime = clamp(breach * 0.35 + (synFlood ? trafficLoad * 0.08 : 0), 0, 100);
    return { breach, blocked, downtime };
  }, [strictness, openPorts, trafficLoad, synFlood]);

  const viz = (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl bg-slate-950 border border-slate-700 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 grid grid-cols-6 gap-1 p-3 opacity-40">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="rounded bg-cyan-900/40 h-full min-h-[8px]" />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <p className="text-xs text-slate-500 uppercase">{t('Network pulse', 'ನೆಟ್‌ವರ್ಕ್ ಪಲ್ಸ್')}</p>
          <p className="text-4xl font-mono text-cyan-300">{metrics.breach.toFixed(0)}%</p>
          <p className="text-sm text-slate-400">{t('Breach success (sim)', 'ಉಲ್ಲಂಘನೆ ಯಶಸ್ಸು (ಸಿಮ್)')}</p>
        </div>
        {synFlood && <div className="absolute bottom-2 left-2 right-2 h-2 bg-red-500/30 rounded animate-pulse" />}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-800/80 p-3">
          <div className="text-slate-500 text-xs">{t('Packets blocked', 'ನಿರ್ಬಂಧಿತ ಪ್ಯಾಕೆಟ್‌ಗಳು')}</div>
          <div className="text-xl font-mono text-emerald-300">{metrics.blocked.toFixed(0)}%</div>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-3">
          <div className="text-slate-500 text-xs">{t('System downtime', 'ವ್ಯವಸ್ಥೆ ವಿರಾಮ')}</div>
          <div className="text-xl font-mono text-amber-300">{metrics.downtime.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );

  return (
    <ThalesMissionShell
      backTo="/thales-labs/cyber"
      backLabelEn="Cyber missions"
      backLabelKn="ಸೈಬರ್ ಮಿಷನ್‌ಗಳು"
      titleEn="Basic firewall rule tuning"
      titleKn="ಮೂಲ ಫೈರ್‌ವಾಲ್ ನಿಯಮ ಸರಿಪಡಿಸುವಿಕೆ"
      subtitleEn="SYN flood vs tightened rules"
      subtitleKn="SYN ಫ್ಲಡ್ ಮತ್ತು ಕಠಿಣ ನಿಯಮಗಳು"
      steps={[
        {
          en: 'Start with default rules and note the baseline breach rate.',
          kn: 'ಡೀಫಾಲ್ಟ್ ನಿಯಮಗಳೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಮೂಲ ಉಲ್ಲಂಘನೆ ದರವನ್ನು ಗಮನಿಸಿ.',
        },
        {
          en: 'Launch a SYN-flood style DDoS (toggle on) and watch packets overwhelm weak rules.',
          kn: 'SYN ಫ್ಲಡ್ ಶೈಲಿಯ DDoS ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ದುರ್ಬಲ ನಿಯಮಗಳ ಮೇಲೆ ಪ್ಯಾಕೆಟ್‌ಗಳನ್ನು ನೋಡಿ.',
        },
        {
          en: 'Tighten strictness and reduce open ports until the attack fails.',
          kn: 'ಕಠಿಣತೆ ಹೆಚ್ಚಿಸಿ ಮತ್ತು ತೆರೆದ ಪೋರ್ಟ್‌ಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ ದಾಳಿ ವಿಫಲವಾಗುವವರೆಗೆ.',
        },
      ]}
      learningEn="One permissive rule or extra open port can erase the benefit of every other control — defence is only as strong as the weakest path."
      learningKn="ಒಂದು ಅನುಮತಿಸುವ ನಿಯಮ ಅಥವಾ ಹೆಚ್ಚುವರಿ ತೆರೆದ ಪೋರ್ಟ್ ಇತರ ಎಲ್ಲಾ ನಿಯಂತ್ರಣಗಳ ಲಾಭವನ್ನು ಅಳಿಸಬಹುದು — ರಕ್ಷಣೆ ದುರ್ಬಲವಾದ ಮಾರ್ಗದಷ್ಟೇ ಬಲವಾಗಿರುತ್ತದೆ."
      vizPanel={viz}
    >
      <CyberLabeledSlider
        labelEn="Rule strictness"
        labelKn="ನಿಯಮದ ಕಠಿಣತೆ"
        min={10}
        max={100}
        step={1}
        value={strictness}
        onChange={setStrictness}
      />
      <CyberLabeledSlider
        labelEn="Open inbound ports"
        labelKn="ತೆರೆದ ಇನ್‌ಬೌಂಡ್ ಪೋರ್ಟ್‌ಗಳು"
        min={1}
        max={12}
        step={1}
        value={openPorts}
        onChange={setOpenPorts}
      />
      <CyberLabeledSlider labelEn="Traffic load" labelKn="ಟ್ರಾಫಿಕ್ ಭಾರ" min={0} max={100} step={1} value={trafficLoad} onChange={setTrafficLoad} />
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input type="checkbox" checked={synFlood} onChange={(e) => setSynFlood(e.target.checked)} className="accent-cyan-500" />
        {t('SYN-flood attack active', 'SYN ಫ್ಲಡ್ ದಾಳಿ ಸಕ್ರಿಯ')}
      </label>
    </ThalesMissionShell>
  );
};

export default CyberFirewallTuning;
