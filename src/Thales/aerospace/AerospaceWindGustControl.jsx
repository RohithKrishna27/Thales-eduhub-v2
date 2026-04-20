import { useState, useMemo, useEffect, useRef } from 'react';

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

const STEPS = [
  { id: 1, label: 'Spike gust above 50 kt', check: (g) => g >= 50 },
  { id: 2, label: 'Apply elevator +10° or more', check: (_, e) => e >= 10 },
  { id: 3, label: 'Coordinate aileron ±15° or more', check: (_, __, a) => Math.abs(a) >= 15 },
];

function getMetrics(g, e, a) {
  return {
    roll:  clamp(g * 0.45 - a * 0.90, -40, 40),
    pitch: clamp(-g * 0.25 + e * 0.85, -25, 25),
    yaw:   clamp(g * 0.15 - a * 0.20, -15, 15),
    alt:   clamp(g * 0.12 - e * 0.08 - Math.abs(a) * 0.02, 0, 25),
    warn:  g > 55 && Math.abs(a) < 15,
  };
}

function gustLabel(g) {
  if (g < 10) return 'CALM';
  if (g < 20) return 'LIGHT BREEZE';
  if (g < 35) return 'MODERATE CROSSWIND';
  if (g < 50) return 'STRONG CROSSWIND';
  if (g < 60) return 'SEVERE — NEAR AUTOPILOT LIMIT';
  return 'EXTREME — MANUAL OVERRIDE';
}

function barColor(pct) {
  if (pct < 50) return '#0056c7';
  if (pct < 75) return '#c07000';
  return '#c02020';
}

/* ── PFD SVG ── */
function PFD({ gust, elevator, aileron, metrics }) {
  const pitchOffset = metrics.pitch * 1.7;
  const roll = metrics.roll;
  const simAlt = Math.round(35000 - metrics.alt * 3.4);
  const speed = Math.round(250 + gust * 0.8 - Math.abs(aileron) * 0.4);
  const gustX2 = 48 + (gust / 70) * 52;

  return (
    <svg viewBox="0 0 440 210" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8d4f0" />
          <stop offset="100%" stopColor="#dceeff" />
        </linearGradient>
        <linearGradient id="groundG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8d8a0" />
          <stop offset="100%" stopColor="#a0b870" />
        </linearGradient>
        <marker id="arrowW" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#d05000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <clipPath id="pfdClip"><rect x="0" y="0" width="440" height="210" /></clipPath>
      </defs>

      {/* Horizon */}
      <g clipPath="url(#pfdClip)">
        <g transform={`translate(220,105) rotate(${-roll}) translate(-220,-105) translate(0,${pitchOffset})`}>
          <rect x="-50" y="-50" width="540" height="260" fill="url(#skyG)" />
          <rect x="-50" y="105" width="540" height="210" fill="url(#groundG)" />
          <line x1="-50" y1="105" x2="490" y2="105" stroke="#8090a0" strokeWidth="1.5" />
          <g stroke="#607080" strokeWidth="0.8" opacity="0.6">
            <line x1="160" y1="68" x2="200" y2="68" />
            <line x1="240" y1="68" x2="280" y2="68" />
            <text fontFamily="monospace" fontSize="9" fill="#607080" x="155" y="71" textAnchor="end">+10°</text>
            <line x1="160" y1="142" x2="200" y2="142" />
            <line x1="240" y1="142" x2="280" y2="142" />
            <text fontFamily="monospace" fontSize="9" fill="#607080" x="155" y="145" textAnchor="end">-10°</text>
          </g>
        </g>
      </g>

      {/* Roll arc & ticks */}
      <path d="M168,48 A80,80 0 0,1 272,48" fill="none" stroke="#405070" strokeWidth="0.8" opacity="0.5" />
      <g stroke="#405070" strokeWidth="0.8" opacity="0.6">
        <line x1="220" y1="30" x2="220" y2="40" />
        <line x1="178" y1="40" x2="181" y2="48" />
        <line x1="262" y1="40" x2="259" y2="48" />
      </g>
      <polygon
        points="220,44 215,56 225,56"
        fill="#003c8f"
        opacity="0.85"
        transform={`rotate(${roll},220,44)`}
      />
      <text fontFamily="monospace" fontSize="10" fill="#003c8f" x="220" y="24" textAnchor="middle" fontWeight="600">
        ROLL {metrics.roll.toFixed(1)}°
      </text>

      {/* Fixed crosshair */}
      <line x1="185" y1="105" x2="205" y2="105" stroke="#003c8f" strokeWidth="1.5" />
      <line x1="235" y1="105" x2="255" y2="105" stroke="#003c8f" strokeWidth="1.5" />
      <circle cx="220" cy="105" r="3" fill="none" stroke="#003c8f" strokeWidth="1.5" />

      {/* Plane silhouette */}
      <g transform={`translate(220,105) rotate(${roll}) translate(-220,-105) translate(0,${-pitchOffset})`}>
        <ellipse cx="220" cy="105" rx="50" ry="7" fill="#003c8f" fillOpacity="0.15" stroke="#003c8f" strokeWidth="1" />
        <polygon points="220,105 102,113 110,120" fill="#003c8f" fillOpacity="0.2" stroke="#003c8f" strokeWidth="0.8" />
        <polygon points="220,105 338,113 330,120" fill="#003c8f" fillOpacity="0.2" stroke="#003c8f" strokeWidth="0.8" />
        <polygon points="168,105 154,85 177,105" fill="#003c8f" fillOpacity="0.15" stroke="#003c8f" strokeWidth="0.8" />
        <ellipse cx="272" cy="105" rx="6" ry="5" fill="#003c8f" fillOpacity="0.35" stroke="#003c8f" strokeWidth="0.8" />
      </g>

      {/* Yaw tape */}
      <rect x="148" y="190" width="144" height="17" rx="3" fill="rgba(240,246,255,.9)" stroke="#b0c8e0" strokeWidth="0.8" />
      <text fontFamily="monospace" fontSize="10" fill="#003c8f" x="220" y="203" textAnchor="middle" fontWeight="600">
        YAW {metrics.yaw.toFixed(1)}°
      </text>

      {/* Speed tape */}
      <rect x="2" y="78" width="42" height="54" rx="3" fill="rgba(240,246,255,.92)" stroke="#b0c8e0" strokeWidth="0.8" />
      <text fontFamily="monospace" fontSize="8" fill="#6a8aaa" x="23" y="90" textAnchor="middle">KT</text>
      <text fontFamily="monospace" fontSize="14" fontWeight="700" fill="#003c8f" x="23" y="112" textAnchor="middle">{speed}</text>
      <text fontFamily="monospace" fontSize="7" fill="#9ab8cc" x="23" y="124" textAnchor="middle">AIRSPD</text>

      {/* Alt tape */}
      <rect x="396" y="78" width="42" height="54" rx="3" fill="rgba(240,246,255,.92)" stroke="#b0c8e0" strokeWidth="0.8" />
      <text fontFamily="monospace" fontSize="8" fill="#6a8aaa" x="417" y="90" textAnchor="middle">FT</text>
      <text fontFamily="monospace" fontSize="11" fontWeight="700" fill="#c07000" x="417" y="112" textAnchor="middle">{simAlt}</text>
      <text fontFamily="monospace" fontSize="7" fill="#9ab8cc" x="417" y="124" textAnchor="middle">ALT</text>

      {/* Gust arrow */}
      {gust > 8 && (
        <g>
          <line x1="48" y1="105" x2={gustX2} y2="105" stroke="#d05000" strokeWidth="2" markerEnd="url(#arrowW)" />
          <text fontFamily="monospace" fontSize="9" fill="#d05000" x="48" y="99" fontWeight="600">{gust} kt</text>
        </g>
      )}

      {/* GPWS */}
      {metrics.warn && (
        <g>
          <rect x="170" y="80" width="100" height="50" rx="4" fill="rgba(255,220,220,.8)" stroke="#c02020" strokeWidth="1.5" />
          <text fontFamily="monospace" fontSize="11" fill="#c02020" x="220" y="110" textAnchor="middle" fontWeight="700">GPWS</text>
        </g>
      )}
    </svg>
  );
}

/* ── SLIDER ── */
function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = pct > 80 ? '#c02020' : pct > 55 ? '#c07000' : '#0056c7';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#4a6a8a', fontFamily: 'monospace', letterSpacing: '.5px' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#003c8f', fontFamily: 'monospace' }}>
          {value > 0 && min < 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', height: 5, borderRadius: 3, outline: 'none', border: 'none',
          background: `linear-gradient(90deg, ${color} ${pct}%, #d0e0f0 ${pct}%)`,
          cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: ${color}; border: 2px solid #fff; cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,86,199,.3);
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 9, color: '#9ab8cc', fontFamily: 'monospace' }}>
        <span>{min}{unit}</span>
        {min < 0 && <span>0</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function AerospaceWindGustControl() {
  const [gust, setGust] = useState(35);
  const [elevator, setElevator] = useState(0);
  const [aileron, setAileron] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const prevDone = useRef(false);

  const metrics = useMemo(() => getMetrics(gust, elevator, aileron), [gust, elevator, aileron]);

  const stepsDone = useMemo(() => [
    STEPS[0].check(gust),
    STEPS[1].check(gust, elevator),
    STEPS[2].check(gust, elevator, aileron),
  ], [gust, elevator, aileron]);

  const allDone = stepsDone.every(Boolean);

  useEffect(() => {
    if (allDone && !prevDone.current) {
      prevDone.current = true;
      setCompleted(true);
      setTimeout(() => setShowBanner(true), 200);
    }
  }, [allDone]);

  const rPct = Math.abs(metrics.roll) / 40 * 100;
  const pPct = Math.abs(metrics.pitch) / 25 * 100;
  const yPct = Math.abs(metrics.yaw) / 15 * 100;
  const aPct = metrics.alt / 25 * 100;

  const cardStyle = (pct) => ({
    background: pct > 75 ? '#fff0f0' : pct > 50 ? '#fff8ed' : '#f0f6ff',
    border: `1.5px solid ${pct > 75 ? '#e03030' : pct > 50 ? '#f0a030' : '#c8daf0'}`,
    borderRadius: 8, padding: '7px 8px', textAlign: 'center',
    transition: 'all .25s',
  });

  const metricColor = (pct) => pct > 75 ? '#c02020' : pct > 50 ? '#d06000' : '#0056c7';

  return (
    <div style={{ fontFamily: "'Rajdhani', sans-serif", background: '#f0f4f8', minHeight: '100vh', padding: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.55} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes popIn { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(120px) rotate(540deg); opacity: 0; }
        }
      `}</style>

      {/* ── SUCCESS BANNER ── */}
      {showBanner && (
        <div style={{
          position: 'relative', marginBottom: 16,
          background: 'linear-gradient(90deg,#003c8f,#0056c7)',
          borderRadius: 12, padding: '18px 24px',
          boxShadow: '0 6px 32px rgba(0,60,180,.22)',
          overflow: 'hidden',
          animation: 'slideDown .5s cubic-bezier(.22,.68,0,1.2)',
        }}>
          {/* Confetti dots */}
          {['#fff','#ffcc00','#00e5ff','#ff6b6b','#39ff85','#ffb3ff'].map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${10 + i * 15}%`, top: '-10px',
              width: 8, height: 8, borderRadius: i % 2 === 0 ? '50%' : 2,
              background: c, opacity: .85,
              animation: `confettiFall ${1.2 + i * 0.18}s ${i * 0.1}s ease-in forwards`,
            }} />
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            {/* Check circle */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              animation: 'popIn .5s .2s cubic-bezier(.22,.68,0,1.2) both',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M5 13L10.5 18.5L21 8" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ background: '#fff', color: '#003c8f', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: 1.5 }}>THALES</span>
                <span style={{ color: 'rgba(255,255,255,.7)', fontFamily: 'monospace', fontSize: 10 }}>FLIGHT DYNAMICS LAB</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: .3 }}>Lab Complete!</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontFamily: 'monospace', marginTop: 2 }}>
                All 3 objectives achieved — Wind Gust &amp; Control Surface Response certified
              </div>
            </div>

            {/* Mini achievements */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {[
                { icon: '🌬️', label: 'Max Gust', val: `${gust} kt` },
                { icon: '✅', label: 'Objectives', val: '3 / 3' },
              ].map((a, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,.15)', borderRadius: 8,
                  padding: '8px 12px', textAlign: 'center', minWidth: 72,
                }}>
                  <div style={{ fontSize: 18 }}>{a.icon}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.65)', fontFamily: 'monospace', marginTop: 2 }}>{a.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{a.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SIM CARD ── */}
      <div style={{ background: '#fff', border: '1.5px solid #d0dce8', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,60,120,.10)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(90deg,#003c8f,#0056c7)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#fff', color: '#003c8f', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 4, letterSpacing: 1.5 }}>THALES</span>
            <div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>Flight Dynamics Simulation Lab</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontFamily: 'monospace' }}>CROSSWIND GUST & CONTROL SURFACE RESPONSE // STUDENT EDITION</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: metrics.warn ? '#d02020' : gust > 30 ? '#c07000' : '#39ff85',
              boxShadow: `0 0 6px ${metrics.warn ? '#d02020' : gust > 30 ? '#c07000' : '#39ff85'}`,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,.75)' }}>
              {metrics.warn ? 'ALERT' : gust > 30 ? 'CAUTION' : 'SIM ACTIVE'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px' }}>

          {/* LEFT */}
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid #e0e8f0' }}>

            {/* Steps */}
            <SectionLabel>Mission Objectives</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: stepsDone[i] ? '#edfff5' : '#f4f8ff',
                  border: `1.5px solid ${stepsDone[i] ? '#40c070' : '#c8daf0'}`,
                  borderRadius: 7, padding: '8px 12px',
                  transition: 'all .3s',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: stepsDone[i] ? '#40c070' : '#e0eaf4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .3s',
                  }}>
                    {stepsDone[i]
                      ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6a8aaa', fontWeight: 700 }}>0{s.id}</span>
                    }
                  </div>
                  <span style={{ fontSize: 13, color: stepsDone[i] ? '#008040' : '#4a6a8a', fontWeight: stepsDone[i] ? 600 : 400 }}>{s.label}</span>
                  {stepsDone[i] && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#008040', fontFamily: 'monospace' }}>DONE</span>}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ background: '#eaf2ff', border: '1px solid #c0d8f0', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: '#6a8aaa', fontFamily: 'monospace', letterSpacing: .8 }}>MISSION PROGRESS</span>
                <span style={{ fontSize: 10, color: '#0056c7', fontFamily: 'monospace' }}>{stepsDone.filter(Boolean).length} / 3</span>
              </div>
              <div style={{ background: '#d0e4f4', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${stepsDone.filter(Boolean).length / 3 * 100}%`,
                  background: 'linear-gradient(90deg,#003c8f,#00aaff)',
                  transition: 'width .4s ease',
                }} />
              </div>
            </div>

            {/* PFD */}
            <SectionLabel>Primary Flight Display (PFD)</SectionLabel>
            <div style={{ background: 'linear-gradient(180deg,#e8f0f8,#dce8f4)', border: '1.5px solid #c0d4e8', borderRadius: 8, height: 210, overflow: 'hidden' }}>
              <PFD gust={gust} elevator={elevator} aileron={aileron} metrics={metrics} />
            </div>

            {/* HUD metrics */}
            <SectionLabel>Real-Time Metrics</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
              {[
                { label: 'ROLL', value: metrics.roll.toFixed(1), unit: 'DEG', pct: rPct },
                { label: 'PITCH', value: metrics.pitch.toFixed(1), unit: 'DEG', pct: pPct },
                { label: 'YAW', value: metrics.yaw.toFixed(1), unit: 'DEG', pct: yPct },
                { label: 'ALT LOSS', value: Math.round(metrics.alt), unit: 'SIM FT', pct: aPct, amber: true },
              ].map(({ label, value, unit, pct, amber }) => (
                <div key={label} style={cardStyle(pct)}>
                  <div style={{ fontSize: 9, color: '#7090b0', fontFamily: 'monospace', letterSpacing: .6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: amber ? (pct > 75 ? '#c02020' : pct > 50 ? '#d06000' : '#c07000') : metricColor(pct), lineHeight: 1.2 }}>{value}</div>
                  <div style={{ fontSize: 9, color: '#8ab0cc' }}>{unit}</div>
                </div>
              ))}
            </div>

            {/* Warning */}
            {metrics.warn && (
              <div style={{
                background: '#fff0f0', border: '1.5px solid #e03030', borderRadius: 7,
                padding: '7px 12px', fontFamily: 'monospace', fontSize: 10, color: '#c02020',
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'blink .9s ease-in-out infinite',
              }}>
                <span style={{ fontSize: 14 }}>⚠</span>
                <span>CROSSWIND EXCEEDS AUTOPILOT ENVELOPE — MANUAL OVERRIDE REQUIRED</span>
              </div>
            )}

            {/* Formulas */}
            <SectionLabel>Live Equations — Thales AVCS Control Law</SectionLabel>
            <div style={{ background: '#f4f8ff', border: '1.5px solid #d0e0f4', borderRadius: 7, padding: '9px 11px' }}>
              <div style={{ fontSize: 9, color: '#6a8aaa', fontFamily: 'monospace', letterSpacing: .7, marginBottom: 7 }}>ALL VALUES COMPUTE IN REAL TIME</div>
              {[
                { sym: 'φ (Roll)', expr: 'clamp( G×0.45 − δa×0.90, −40°, +40° )', val: `${metrics.roll.toFixed(1)}°` },
                { sym: 'θ (Pitch)', expr: 'clamp( −G×0.25 + δe×0.85, −25°, +25° )', val: `${metrics.pitch.toFixed(1)}°` },
                { sym: 'ψ (Yaw)', expr: 'clamp( G×0.15 − δa×0.20, −15°, +15° )', val: `${metrics.yaw.toFixed(1)}°` },
                { sym: 'ΔH (Loss)', expr: 'clamp( G×0.12 − δe×0.08 − |δa|×0.02, 0, 25 )', val: `${Math.round(metrics.alt)} ft` },
              ].map(({ sym, expr, val }) => (
                <div key={sym} style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', color: '#0056c7', fontWeight: 700, fontSize: 12, minWidth: 70 }}>{sym}</span>
                  <span style={{ color: '#9ab8cc', fontSize: 10 }}>=</span>
                  <span style={{ color: '#4a6a8a', fontSize: 10, fontFamily: 'monospace', flex: 1 }}>{expr}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#003c8f', minWidth: 52, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: 6, paddingTop: 5, borderTop: '1px solid #dce8f4', fontSize: 9, color: '#9ab8cc', fontFamily: 'monospace' }}>
                G=GUST(kt) · δa=AILERON(°) · δe=ELEVATOR(°) · φ=ROLL · θ=PITCH · ψ=YAW · ΔH=ALT LOSS(ft)
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: '#f7fafd' }}>

            <SectionLabel>Cockpit Controls</SectionLabel>
            <Slider label="CROSSWIND GUST" value={gust} min={0} max={70} onChange={setGust} unit=" kt" />
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: gust > 55 ? '#c02020' : gust > 35 ? '#c07000' : '#6a8aaa', marginTop: -8, marginBottom: 4 }}>
              {gustLabel(gust)}
            </div>
            <Slider label="ELEVATOR (PITCH UP +)" value={elevator} min={-30} max={30} onChange={setElevator} unit="°" />
            <Slider label="AILERON (R-WING DOWN +)" value={aileron} min={-30} max={30} onChange={setAileron} unit="°" />

            {/* Envelope bars */}
            <SectionLabel>Control Effectiveness (% of limit)</SectionLabel>
            {[
              { label: 'ROLL φ', pct: rPct },
              { label: 'PITCH θ', pct: pPct },
              { label: 'YAW ψ', pct: yPct },
              { label: 'ΔH loss', pct: aPct },
            ].map(({ label, pct }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#6a8aaa', fontFamily: 'monospace', minWidth: 50 }}>{label}</span>
                <div style={{ flex: 1, height: 7, background: '#e0eaf4', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(pct, 100)}%`, background: barColor(pct), transition: 'width .22s,background .22s' }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: barColor(pct), minWidth: 34, textAlign: 'right' }}>{Math.round(pct)}%</span>
              </div>
            ))}

            {/* Data table */}
            <SectionLabel>Flight Data Recorder</SectionLabel>
            <div style={{ background: '#f4f8ff', border: '1.5px solid #d0e0f4', borderRadius: 7, padding: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
                <thead>
                  <tr>
                    {['PARAMETER', 'SYM', 'VALUE', 'BAR'].map(h => (
                      <th key={h} style={{ color: '#6a8aaa', fontWeight: 400, textAlign: h === 'VALUE' ? 'right' : 'left', padding: '4px 5px', borderBottom: '1.5px solid #dce8f4', fontSize: 9, letterSpacing: .5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Gust', sym: 'G', val: `${gust} kt`, bar: gust / 70 * 100, color: barColor(gust / 70 * 100) },
                    { name: 'Elevator', sym: 'δe', val: `${elevator >= 0 ? '+' : ''}${elevator}°`, bar: 50 + (elevator / 30) * 50, color: '#0056c7' },
                    { name: 'Aileron', sym: 'δa', val: `${aileron >= 0 ? '+' : ''}${aileron}°`, bar: 50 + (aileron / 30) * 50, color: '#0056c7' },
                    { name: 'Roll', sym: 'φ', val: `${metrics.roll.toFixed(1)}°`, bar: 50 + (metrics.roll / 40) * 50, color: barColor(rPct) },
                    { name: 'Pitch', sym: 'θ', val: `${metrics.pitch.toFixed(1)}°`, bar: 50 + (metrics.pitch / 25) * 50, color: barColor(pPct) },
                    { name: 'Yaw', sym: 'ψ', val: `${metrics.yaw.toFixed(1)}°`, bar: 50 + (metrics.yaw / 15) * 50, color: barColor(yPct) },
                    { name: 'Alt Loss', sym: 'ΔH', val: `${Math.round(metrics.alt)} ft`, bar: aPct, color: barColor(aPct) },
                  ].map(row => (
                    <tr key={row.name}>
                      <td style={{ padding: '4px 5px', borderBottom: '1px solid #eaf0f8', color: '#4a6a8a' }}>{row.name}</td>
                      <td style={{ padding: '4px 5px', borderBottom: '1px solid #eaf0f8', color: '#0056c7', fontWeight: 700 }}>{row.sym}</td>
                      <td style={{ padding: '4px 5px', borderBottom: '1px solid #eaf0f8', color: '#1a2a3a', textAlign: 'right', fontWeight: 700 }}>{row.val}</td>
                      <td style={{ padding: '4px 5px', borderBottom: '1px solid #eaf0f8', width: 64 }}>
                        <div style={{ height: 5, borderRadius: 3, background: '#e0eaf4', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(Math.max(row.bar, 0), 100)}%`, background: row.color, transition: 'width .2s' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Insight */}
            <SectionLabel>Thales Insight</SectionLabel>
            <div style={{ background: '#f4f8ff', borderLeft: '3px solid #0056c7', padding: '7px 10px', borderRadius: '0 5px 5px 0', fontSize: 11, color: '#4a6a8a', lineHeight: 1.55 }}>
              Automation helps until the gust exceeds its certified envelope. At &gt;55 kt with no aileron correction, the Thales AVCS autopilot disengages — pilots must command surfaces faster than the aircraft drifts.
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #e0e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#9ab8cc' }}>THALES GROUP · AVIONICS & FLIGHT SYSTEMS</span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#b0c8e0' }}>EDU-SIM v4.2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 9, color: '#6a8aaa', fontFamily: 'monospace', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3, borderBottom: '1px solid #e8eef5', paddingBottom: 3 }}>
      {children}
    </div>
  );
}