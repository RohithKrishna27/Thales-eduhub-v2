import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

// ─── helpers ────────────────────────────────────────────────────────────────
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ─── data ───────────────────────────────────────────────────────────────────
const FAILURES = [
  {
    id: 'ap',
    name: 'Autopilot servo runaway',
    short: 'A/P FAIL',
    desc: 'Autopilot commands uncommanded pitch/roll. Disengage immediately. Raw flying required. Expect high workload. Monitor standby instruments.',
    boost: 22,
    fmaState: ['fault', 'armed', 'armed', 'off'],
    ecam: [
      { msg: 'FCTL: A/P SERVO FAIL', type: 'fail' },
      { msg: 'ROLL CTRL: MANUAL', type: 'warn' },
      { msg: 'ENG ANTI-ICE: CHECK', type: 'warn' },
      { msg: 'FLT CTL: MAN REVERSION', type: 'caut' },
    ],
    cl: [
      'A/P DISCONNECT — CONFIRM',
      'FLIGHT DIR: CROSS-CHECK',
      'STANDBY HORIZON: VERIFY',
      'PITCH/BANK: SCAN',
      'AIRSPEED: CROSS-CHECK',
      'ILS COURSE: CONFIRM',
      'APPROACH: STABILISED?',
    ],
  },
  {
    id: 'pitot',
    name: 'Pitot / airdata icing',
    short: 'ADR FAIL',
    desc: 'Airdata Reference system degraded. IAS unreliable. Pitch+Power technique mandatory. Crosscheck alternate static. GPS ground speed reference.',
    boost: 18,
    fmaState: ['off', 'fault', 'armed', 'off'],
    ecam: [
      { msg: 'ADR 1+2: DISAGREE', type: 'fail' },
      { msg: 'IAS UNRELIABLE — USE PITCH/POWER', type: 'fail' },
      { msg: 'ALT: CROSS-CHECK STANDBY', type: 'warn' },
      { msg: 'ANTI-ICE: PITOT+STAT ON', type: 'caut' },
    ],
    cl: [
      'IAS UNRELIABLE: CONFIRM',
      'PITCH: 5° / N1: 85%',
      'ALT: STANDBY ONLY',
      'ANTI-ICE: ALL ON',
      'CROSS-FEED: CHECK',
      'ADR 3: SELECT',
      'GPS GND SPEED: USE',
    ],
  },
  {
    id: 'gps',
    name: 'GPS navigator loss',
    short: 'NAV FAIL',
    desc: 'GPS position lost. ILS/VOR raw data only. Revert to conventional navaids. Check inertial alignment. Extended nav error possible.',
    boost: 12,
    fmaState: ['active', 'off', 'fault', 'off'],
    ecam: [
      { msg: 'NAV: GPS PRIMARY LOST', type: 'fail' },
      { msg: 'FMGC: ENTERS DR MODE', type: 'warn' },
      { msg: 'IRS: CHECK ALIGNMENT', type: 'warn' },
      { msg: 'ILS: SELECT AND VERIFY', type: 'caut' },
    ],
    cl: [
      'GPS: CONFIRM FAIL',
      'NAV MODE: ILS/VOR',
      'IRS DRIFT: CHECK',
      'RTO MENU: DISABLE GPS',
      'ILS FREQ: VERIFY',
      'FAF: DISTANCE CHECK',
      'MISSED APCH: BRIEF',
    ],
  },
];

const PHASES = ['Cruise FL350', 'Final Approach', 'Short Final', 'Flare & Land'];
const FMA_MODES = [
  ['A/PROF', 'V/S', 'OPEN CLB', '---'],
  ['A/P OFF', 'HDG HOLD', 'LAND', '---'],
  ['N1 CLB', 'IDLE', 'FLARE', '---'],
  ['GPS', 'ILS', 'LOC', '---'],
];
const FMA_LABELS = ['PITCH', 'ROLL/YAW', 'THR', 'NAV'];

const GUIDANCE = [
  { n: '01', t: 'Aviate first', b: 'Maintain pitch, power, trim. Do not fixate on ECAM — fly the aircraft first.' },
  { n: '02', t: 'Cross-check instruments', b: 'Compare PFD vs standby horizon vs altimeter. Identify which source is faulty.' },
  { n: '03', t: 'Run non-normal checklist', b: 'Execute ECAM actions one at a time. Do not rush memory items.' },
  { n: '04', t: 'Stabilise the approach', b: 'Aim: correct speed, path, configuration by 1000ft AAL. Go-around if unstabilised.' },
];

// ─── PFD canvas renderer ─────────────────────────────────────────────────────
function drawPFD(canvas, { pitch, roll, manual, failIdx, phase, thrust, wind }) {
  if (!canvas) return;
  const W = canvas.offsetWidth || 380;
  const H = 230;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  // Sky / Ground
  const pitchPx = pitch * 4;
  const gndY = cy + pitchPx;
  ctx.fillStyle = '#1E4A8A'; ctx.fillRect(0, 0, W, Math.max(0, gndY));
  ctx.fillStyle = '#5C3A1E'; ctx.fillRect(0, Math.max(0, gndY), W, H);

  // Horizon + pitch ladder
  ctx.save();
  ctx.translate(cx, cy + pitchPx);
  ctx.rotate((-roll * Math.PI) / 180);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-W, 0); ctx.lineTo(W, 0); ctx.stroke();
  ctx.lineWidth = 1;
  for (let p = -20; p <= 20; p += 5) {
    if (p === 0) continue;
    const y = -p * 4;
    const len = p % 10 === 0 ? 32 : 16;
    ctx.beginPath(); ctx.moveTo(-len, y); ctx.lineTo(len, y); ctx.stroke();
    if (p % 10 === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(p > 0 ? '+' + p : String(p), -len - 4, y + 4);
    }
  }
  ctx.restore();

  // Aircraft symbol
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy); ctx.lineTo(cx - 10, cy);
  ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 32, cy);
  ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 9);
  ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();

  // Roll arc
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 65, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  const ra = ((roll - 90) * Math.PI) / 180;
  const rx = cx + 65 * Math.cos(ra), ry = cy + 65 * Math.sin(ra);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 5, ry + 11); ctx.lineTo(rx - 5, ry + 11); ctx.closePath(); ctx.fill();

  // ILS needles (approach phases only)
  if (failIdx !== 2 && phase >= 1) {
    const gsErr = (pitch - -3) * 8;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(W - 22, cy - 55, 22, 110);
    ctx.fillStyle = '#00D46A'; ctx.fillRect(W - 16, cy - 30, 4, 60);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(W - 14, cy + clamp(gsErr, -28, 28), 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '8px monospace';
    ctx.textAlign = 'center'; ctx.fillText('G/S', W - 14, cy - 36);
    const locErr = roll * 3;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(cx - 55, H - 22, 110, 22);
    ctx.fillStyle = '#00D46A'; ctx.fillRect(cx - 30, H - 14, 60, 4);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(cx + clamp(locErr, -28, 28), H - 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'center';
    ctx.fillText('LOC', cx - 38, H - 8);
  }

  // IAS tape (left)
  const ias = Math.max(80, 140 - (failIdx === 1 ? 35 : 0) + thrust * 0.4 - wind * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, cy - 52, 46, 104);
  ctx.fillStyle = failIdx === 1 ? '#FF3B3B' : '#00C8FF';
  ctx.font = 'bold 14px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(failIdx === 1 ? '---' : ias.toFixed(0), 23, cy + 6);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '8px monospace';
  ctx.fillText('IAS', 23, cy - 38);

  // ALT tape (right edge)
  const alt = phase === 0 ? 35000 : phase === 1 ? 3000 : phase === 2 ? 800 : 200;
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(W - 46, cy - 52, 46, 104);
  ctx.fillStyle = '#00C8FF';
  ctx.font = 'bold 13px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(alt.toLocaleString(), W - 23, cy + 6);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '8px monospace';
  ctx.fillText('ALT', W - 23, cy - 38);

  // FMA top bar
  ctx.fillStyle = 'rgba(0,0,30,.85)'; ctx.fillRect(W / 2 - 70, 4, 140, 22);
  ctx.fillStyle = '#00E5FF'; ctx.font = '10px "Share Tech Mono", monospace';
  ctx.textAlign = 'center'; ctx.fillText(FAILURES[failIdx].short + '  ACTIVE', W / 2, 18);

  // High-workload flash overlay
  if (manual > 80) {
    ctx.fillStyle = 'rgba(200,16,46,.18)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#C8102E'; ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, W - 4, H - 4);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "Share Tech Mono", monospace';
    ctx.textAlign = 'center'; ctx.fillText('⚠  HIGH WORKLOAD', W / 2, 20);
  }

  ctx.textAlign = 'left';
}

// ─── sub-components ──────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10, letterSpacing: 2, color: '#003087', fontWeight: 700,
    marginBottom: 8, textTransform: 'uppercase',
    borderBottom: '1px solid #dde3f0', paddingBottom: 4,
  }}>
    {children}
  </div>
);

function LabeledSlider({ label, sublabel, min, max, step, value, onChange, leftTick, midTick, rightTick }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c3e6b' }}>
          {label} {sublabel && <span style={{ fontSize: 10, color: '#888', letterSpacing: '.5px' }}>{sublabel}</span>}
        </span>
        <span style={{
          fontFamily: '"Share Tech Mono", monospace', fontSize: 14, color: '#003087',
          fontWeight: 600, background: '#e8edf8', padding: '2px 8px', borderRadius: 4, minWidth: 52, textAlign: 'center',
        }}>
          {sublabel?.includes('kt') ? `${value} kt` : sublabel?.includes('%') ? `${value}%` : `${value >= 0 ? '+' : ''}${value}°`}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: '#003087', height: 4, cursor: 'pointer', margin: '2px 0' }}
      />
      {(leftTick || midTick || rightTick) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aab', marginTop: 2 }}>
          <span>{leftTick}</span><span>{midTick}</span><span>{rightTick}</span>
        </div>
      )}
    </div>
  );
}

function InstrumentBox({ label, value, unit, warn, fail }) {
  const color = fail ? '#FF3B3B' : warn ? '#F5A623' : '#00C8FF';
  return (
    <div style={{
      background: '#12172B', borderRadius: 6, border: '1px solid #2A3560',
      padding: '8px 6px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#8892B0', fontFamily: '"Share Tech Mono", monospace', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: '"Share Tech Mono", monospace', color }}>{value}</div>
      <div style={{ fontSize: 9, color: '#8892B0', marginTop: 1 }}>{unit}</div>
    </div>
  );
}

function ECAMPanel({ failure }) {
  const colors = { fail: { bg: '#3D0000', color: '#FF3B3B', border: '#FF3B3B' }, warn: { bg: '#3D3000', color: '#FFD700', border: '#FFD700' }, caut: { bg: '#3D1500', color: '#FF8C00', border: '#FF8C00' } };
  return (
    <div style={{ background: '#0A0E1A', borderRadius: 8, border: '1px solid #2A3560', padding: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#00C8FF', fontFamily: '"Share Tech Mono", monospace', marginBottom: 6 }}>ECAM — E/WD MESSAGES</div>
      {failure.ecam.map((e, i) => {
        const c = colors[e.type];
        return (
          <div key={i} style={{
            fontFamily: '"Share Tech Mono", monospace', fontSize: 11,
            padding: '3px 6px', borderRadius: 3, marginBottom: 3,
            background: c.bg, color: c.color, borderLeft: `3px solid ${c.border}`,
            animation: e.type === 'fail' ? 'tobie-blink .8s step-start infinite' : 'none',
          }}>{e.msg}</div>
        );
      })}
    </div>
  );
}

function FMARow({ failure, phase }) {
  const stateColors = { active: { bg: '#002080', color: '#00E5FF' }, armed: { bg: '#222', color: '#00E57F' }, fault: { bg: '#400', color: '#FF5555' }, off: { bg: '#111', color: '#555' } };
  return (
    <div style={{ background: '#000', borderRadius: 4, display: 'flex', overflow: 'hidden', marginBottom: 8, fontFamily: '"Share Tech Mono", monospace', fontSize: 11 }}>
      {FMA_LABELS.map((lbl, i) => {
        const s = failure.fmaState[i];
        const c = stateColors[s];
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '4px 2px', borderRight: i < 3 ? '1px solid #333' : 'none', background: c.bg, color: c.color }}>
            <div style={{ fontSize: 8, opacity: .7, letterSpacing: 1 }}>{lbl}</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{FMA_MODES[i][phase]}</div>
          </div>
        );
      })}
    </div>
  );
}

function DataTable({ metrics, failIdx, phase, thrust, wind }) {
  const ias = Math.max(80, 140 - (failIdx === 1 ? 35 : 0) + thrust * 0.4 - wind * 0.5);
  const alt = phase === 0 ? 35000 : phase === 1 ? 3000 : phase === 2 ? 800 : 200;
  const vs = phase === 0 ? 0 : phase === 1 ? -800 : phase === 2 ? -600 : -200;

  const rows = [
    { p: 'IAS (kt)', v: failIdx === 1 ? 'UNRELIABLE' : ias.toFixed(0), lim: 'Vref+5 = 145', s: failIdx === 1 ? 'fail' : (ias < 120 || ias > 160) ? 'warn' : 'ok' },
    { p: 'Altitude (ft)', v: alt.toLocaleString(), lim: 'Min safe: varies', s: 'ok' },
    { p: 'V/S (ft/min)', v: vs, lim: 'Max: −1000', s: Math.abs(vs) > 900 ? 'warn' : 'ok' },
    { p: 'Wind (kt)', v: wind, lim: 'Xwind max: 38 kt', s: wind > 38 ? 'fail' : wind > 30 ? 'warn' : 'ok' },
    { p: 'N1 (%)', v: thrust, lim: 'Red line: 97%', s: thrust > 97 ? 'fail' : thrust > 90 ? 'warn' : 'ok' },
    { p: 'Manual Load (%)', v: metrics.manual.toFixed(0), lim: 'Normal: < 50%', s: metrics.manual > 80 ? 'fail' : metrics.manual > 60 ? 'warn' : 'ok' },
    { p: 'Landing Margin', v: metrics.margin.toFixed(0), lim: 'Safe: > 50', s: metrics.margin < 30 ? 'fail' : metrics.margin < 50 ? 'warn' : 'ok' },
    { p: 'Pitch (°)', v: metrics.pitch.toFixed(1), lim: '±15°', s: Math.abs(metrics.pitch) > 15 ? 'fail' : Math.abs(metrics.pitch) > 10 ? 'warn' : 'ok' },
    { p: 'Roll (°)', v: metrics.roll.toFixed(1), lim: '±30°', s: Math.abs(metrics.roll) > 30 ? 'fail' : Math.abs(metrics.roll) > 20 ? 'warn' : 'ok' },
  ];

  const statusStyle = (s) => ({
    fail: { color: '#dc2626', fontWeight: 700 },
    warn: { color: '#d97706', fontWeight: 700 },
    ok:   { color: '#16a34a', fontWeight: 700 },
  }[s]);

  const statusLabel = (s) => ({ fail: '✖ EXCEED', warn: '⚠ CAUTION', ok: '✔ NORMAL' }[s]);

  return (
    <div style={{ overflowX: 'auto', marginBottom: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: '"Share Tech Mono", monospace' }}>
        <thead>
          <tr>
            {['Parameter', 'Value', 'Limit', 'Status'].map(h => (
              <th key={h} style={{ background: '#003087', color: '#fff', padding: '5px 8px', textAlign: 'left', fontSize: 10, letterSpacing: '.5px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f8fd' }}>
              <td style={{ padding: '4px 8px', color: '#334', borderBottom: '1px solid #eef0f8' }}>{r.p}</td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #eef0f8', ...statusStyle(r.s) }}>{r.v}</td>
              <td style={{ padding: '4px 8px', color: '#888', borderBottom: '1px solid #eef0f8' }}>{r.lim}</td>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #eef0f8', ...statusStyle(r.s) }}>{statusLabel(r.s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Checklist({ failure, checks, onToggle }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ background: '#003087', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
        {failure.name.toUpperCase()} — NON-NORMAL CHECKLIST
      </div>
      {failure.cl.map((item, i) => {
        const key = `${failure.id}_${i}`;
        const done = !!checks[key];
        return (
          <div
            key={key}
            onClick={() => onToggle(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              borderBottom: i < failure.cl.length - 1 ? '1px solid #f0f2f8' : 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: done ? '#f8fff8' : '#fff',
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%', border: `2px solid ${done ? '#28a745' : '#ccd'}`,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, background: done ? '#28a745' : 'transparent', color: '#fff', transition: 'all .2s',
            }}>{done ? '✔' : ''}</div>
            <span style={{ color: done ? '#888' : '#333', textDecoration: done ? 'line-through' : 'none' }}>
              {i + 1}. {item}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FormulaBox({ metrics }) {
  return (
    <div style={{ background: '#f8faff', border: '1px solid #c8d4f0', borderRadius: 8, padding: 10, marginBottom: 12, fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: '#2c3e6b' }}>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: '#888', letterSpacing: 1.5, marginBottom: 6, fontWeight: 700 }}>
        WORKLOAD COMPUTATION — ATA 22/34
      </div>
      {[
        ['Base = 30 + wind×0.45 + (100−N1)×0.25', metrics.base.toFixed(1)],
        ['Fail boost (AP 22 / Pitot 18 / GPS 12)', `+${metrics.boost}`],
        ['Control relief: −|elev|×0.4 − |ail|×0.35', `−${metrics.corr.toFixed(1)}`],
        ['Manual Load  (clamped 10–100)', `${metrics.manual.toFixed(0)}%`],
        ['Margin = 72 − load + N1×0.15 − wind×0.2', metrics.margin.toFixed(0)],
        ['Pitch (°)', metrics.pitch.toFixed(1) + '°'],
        ['Roll  (°)', metrics.roll.toFixed(1) + '°'],
      ].map(([key, val], i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '2px 0', borderBottom: i < 6 ? '1px dashed #e0e8ff' : 'none',
          fontWeight: i === 4 ? 700 : 400,
        }}>
          <span style={{ color: '#6070a0' }}>{key}</span>
          <span style={{ color: '#003087', fontWeight: 600 }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
const AerospaceAvionicsFailure = () => {
  const [failureIdx, setFailureIdx] = useState(0);
  const [wind,     setWind]     = useState(25);
  const [thrust,   setThrust]   = useState(60);
  const [elevator, setElevator] = useState(5);
  const [aileron,  setAileron]  = useState(0);
  const [phase,    setPhase]    = useState(0);
  const [checks,   setChecks]   = useState({});
  const [clock,    setClock]    = useState('00:00:00Z');
  const pfdRef = useRef(null);

  const metrics = useMemo(() => {
    const base  = 30 + wind * 0.45 + (100 - thrust) * 0.25;
    const boost = FAILURES[failureIdx].boost;
    const corr  = Math.abs(elevator) * 0.4 + Math.abs(aileron) * 0.35;
    const manual = clamp(base + boost - corr, 10, 100);
    const margin = clamp(72 - manual + thrust * 0.15 - wind * 0.2, 5, 95);
    const pitch  = failureIdx === 1 ? 8 + wind * 0.08 : failureIdx === 0 ? -6 + elevator * 0.2 : elevator * 0.15;
    const roll   = failureIdx === 0 ? 12 + aileron * 0.1 : wind * 0.12 - aileron * 0.5;
    return { manual, margin, pitch, roll, base, boost, corr };
  }, [failureIdx, wind, thrust, elevator, aileron]);

  const failure = FAILURES[failureIdx];

  // Clock
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setClock(d.toISOString().slice(11, 19) + 'Z');
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // PFD render
  const paintPFD = useCallback(() => {
    drawPFD(pfdRef.current, { pitch: metrics.pitch, roll: metrics.roll, manual: metrics.manual, failIdx: failureIdx, phase, thrust, wind });
  }, [metrics, failureIdx, phase, thrust, wind]);

  useEffect(() => { paintPFD(); }, [paintPFD]);
  useEffect(() => {
    const ro = new ResizeObserver(paintPFD);
    if (pfdRef.current) ro.observe(pfdRef.current);
    return () => ro.disconnect();
  }, [paintPFD]);

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  // Status pill
  const pillInfo = metrics.margin < 30
    ? { label: '✖ CRITICAL MARGIN', bg: '#F8D7DA', color: '#721c24', border: '#dc3545' }
    : metrics.margin < 50
    ? { label: '⚠ DEGRADED MODE',   bg: '#FFF3CD', color: '#856404', border: '#FFCF40' }
    : { label: '✔ UNDER CONTROL',   bg: '#D4EDDA', color: '#155724', border: '#28a745' };

  const ias = Math.max(80, 140 - (failureIdx === 1 ? 35 : 0) + thrust * 0.4 - wind * 0.5);
  const alt = phase === 0 ? 35000 : phase === 1 ? 3000 : phase === 2 ? 800 : 200;
  const vs  = phase === 0 ? 0 : phase === 1 ? -800 : phase === 2 ? -600 : -200;

  // ── styles ──────────────────────────────────────────────────────────────────
  const s = {
    wrap:       { fontFamily: "'Rajdhani', sans-serif", background: '#fff', color: '#1a1a2e', minHeight: 600 },
    header:     { background: '#003087', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #C8102E' },
    logoMark:   { width: 36, height: 36, background: '#C8102E', clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    logoInner:  { width: 18, height: 18, background: '#fff', clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' },
    statusBar:  { background: '#f0f2f5', borderBottom: '1px solid #dde3f0', padding: '6px 20px', display: 'flex', gap: 20, alignItems: 'center', fontSize: 12, color: '#555', fontFamily: '"Share Tech Mono", monospace', flexWrap: 'wrap' },
    mainGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 },
    leftPanel:  { background: '#f8faff', borderRight: '2px solid #dde3f0', padding: 16 },
    rightPanel: { background: '#fff', padding: 16 },
    footer:     { background: '#003087', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.5px', borderTop: '2px solid #C8102E' },
    phaseBtn:   (active) => ({ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '.5px', border: `1.5px solid ${active ? '#003087' : '#ccd'}`, color: active ? '#fff' : '#888', cursor: 'pointer', background: active ? '#003087' : '#f8f8f8', transition: 'all .2s', marginBottom: 4 }),
    select:     { width: '100%', padding: '7px 10px', border: '2px solid #dde3f0', borderRadius: 6, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a2e', background: '#f8faff', cursor: 'pointer', outline: 'none', marginBottom: 4 },
    failDesc:   { fontSize: 11, color: '#d97706', padding: '6px 8px', background: '#fffbf0', borderLeft: '3px solid #f5a623', borderRadius: '0 4px 4px 0', lineHeight: 1.5, marginBottom: 10 },
    pill:       { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: '.5px', background: pillInfo.bg, color: pillInfo.color, border: `1px solid ${pillInfo.border}` },
    metricCard: (warn, danger, val) => ({ background: '#f0f4ff', border: `1px solid ${val > danger ? '#fca5a5' : val > warn ? '#fde68a' : '#c8d4f0'}`, borderRadius: 8, padding: 10, textAlign: 'center' }),
    stepRow:    { display: 'flex', gap: 8, marginBottom: 12 },
    stepNum:    { width: 22, height: 22, background: '#C8102E', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 },
  };

  return (
    <>
      {/* Inject Google Font + keyframe */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes tobie-blink { 50% { opacity: .35; } }
      `}</style>

      <div style={s.wrap}>
        {/* ── Header ── */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.logoMark}><div style={s.logoInner} /></div>
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>THALES AVIONICS</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, letterSpacing: 1 }}>TOBIE — TRAINING &amp; OPERATIONS BRIEFING INTERFACE</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: 12, fontFamily: '"Share Tech Mono", monospace' }}>{clock}</div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, marginTop: 2 }}>SIM MODE ACTIVE</div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div style={s.statusBar}>
          <span>SIM ID: THL-AV-0042</span>
          <span style={s.pill}>{pillInfo.label}</span>
          <span style={{ fontWeight: 700, color: '#856404' }}>FAILURE: {failure.name.toUpperCase()}</span>
          <span style={{ marginLeft: 'auto' }}>LANDING MARGIN: <b>{metrics.margin.toFixed(0)}</b></span>
        </div>

        {/* ── Main two-column grid ── */}
        <div style={s.mainGrid}>

          {/* ════ LEFT PANEL ════ */}
          <div style={s.leftPanel}>

            {/* Phase */}
            <SectionLabel>Flight phase</SectionLabel>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {PHASES.map((p, i) => (
                <button key={i} style={s.phaseBtn(phase === i)} onClick={() => setPhase(i)}>{p}</button>
              ))}
            </div>

            {/* Failure select */}
            <SectionLabel>Failure injection</SectionLabel>
            <select style={s.select} value={failureIdx} onChange={e => setFailureIdx(+e.target.value)}>
              {FAILURES.map((f, i) => <option key={f.id} value={i}>✦ {f.name}</option>)}
            </select>
            <div style={s.failDesc}>{failure.desc}</div>

            {/* Controls */}
            <SectionLabel>Raw flying controls</SectionLabel>
            <LabeledSlider label="Wind Component" sublabel="kt" min={0} max={45} step={1} value={wind} onChange={setWind} leftTick="0 kt" midTick="Xwind limit: 38 kt" rightTick="45 kt" />
            <LabeledSlider label="Thrust / N1" sublabel="%" min={40} max={100} step={1} value={thrust} onChange={setThrust} leftTick="IDLE" midTick="MCT" rightTick="TOGA" />
            <LabeledSlider label="Elevator" sublabel="NOSE UP/DOWN °" min={-25} max={25} step={1} value={elevator} onChange={setElevator} leftTick="↓ −25°" midTick="Trim" rightTick="+25° ↑" />
            <LabeledSlider label="Aileron" sublabel="BANK LEFT/RIGHT °" min={-25} max={25} step={1} value={aileron} onChange={setAileron} leftTick="L −25°" midTick="Level" rightTick="+25° R" />

            {/* Formula */}
            <SectionLabel>Live physics formulas</SectionLabel>
            <FormulaBox metrics={metrics} />

            {/* ECAM */}
            <SectionLabel>ECAM messages</SectionLabel>
            <ECAMPanel failure={failure} />

            {/* Guidance */}
            <SectionLabel>Thales TOBIE guidance</SectionLabel>
            {GUIDANCE.map(g => (
              <div key={g.n} style={s.stepRow}>
                <div style={s.stepNum}>{g.n}</div>
                <div style={{ fontSize: 12, color: '#3a4060', lineHeight: 1.5, paddingTop: 2 }}>
                  <b>{g.t}:</b> {g.b}
                </div>
              </div>
            ))}
          </div>

          {/* ════ RIGHT PANEL ════ */}
          <div style={s.rightPanel}>

            {/* PFD */}
            <SectionLabel>Primary flight display (PFD)</SectionLabel>
            <div style={{ background: '#0A0E1A', borderRadius: 8, overflow: 'hidden', border: '2px solid #2A3560', marginBottom: 10 }}>
              <canvas ref={pfdRef} style={{ width: '100%', height: 230, display: 'block' }} />
            </div>

            {/* Standby instruments */}
            <SectionLabel>Standby instruments</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              <InstrumentBox label="IAS" value={failureIdx === 1 ? '----' : ias.toFixed(0)} unit="kt" warn={failureIdx === 1} fail={false} />
              <InstrumentBox label="ALT" value={alt.toLocaleString()} unit="ft" warn={false} fail={false} />
              <InstrumentBox label="V/S" value={(vs >= 0 ? '+' : '') + vs} unit="ft/m" warn={Math.abs(vs) > 900} fail={false} />
              <InstrumentBox label="HDG" value={failureIdx === 2 ? '---' : '278'} unit="°" warn={failureIdx === 2} fail={false} />
              <InstrumentBox label="N1" value={thrust} unit="%" warn={thrust > 95} fail={thrust > 97} />
              <InstrumentBox label="LOAD" value={metrics.manual.toFixed(0)} unit="%" warn={metrics.manual > 70} fail={metrics.manual > 85} />
            </div>

            {/* FMA */}
            <SectionLabel>FMA — flight mode annunciator</SectionLabel>
            <FMARow failure={failure} phase={phase} />

            {/* Data table */}
            <SectionLabel>Real-time data table</SectionLabel>
            <DataTable metrics={metrics} failIdx={failureIdx} phase={phase} thrust={thrust} wind={wind} />

            {/* Checklist */}
            <SectionLabel>Crew checklist (ATA 22/31/34)</SectionLabel>
            <Checklist failure={failure} checks={checks} onToggle={toggleCheck} />

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={s.footer}>
          <span>© 2025 Thales Group — TOBIE Simulation Platform v4.2.1</span>
          <span>SIM — NOT FOR REAL OPERATIONS — TRAINING USE ONLY</span>
        </div>
      </div>
    </>
  );
};

export default AerospaceAvionicsFailure;