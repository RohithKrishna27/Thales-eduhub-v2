// AerospaceWeightBalance.jsx — Thales Immersive Sim
// Requires: React, your ThalesMissionShell, LanguageContext

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import ThalesMissionShell from '../ThalesMissionShell';
import { clamp } from '../shared/clamp';

// ── Physical constants (EASA CS-23 twin-turboprop) ─────────────────────
const WING_AREA   = 17.1;    // m²
const MAC         = 2.34;    // mean aerodynamic chord, m
const RHO         = 1.225;   // ISA sea-level air density, kg/m³
const CL_MAX      = 1.72;    // max lift coefficient
const NEUTRAL_PT  = 53.0;    // neutral point, % MAC
const DATUM_ARM   = 2.35;    // datum to wing LE, m

// ── Core physics engine ────────────────────────────────────────────────
function computeMetrics(wt, cg) {
  const stallMs   = Math.sqrt((2 * wt * 9.81) / (RHO * WING_AREA * CL_MAX));
  const stall     = stallMs * 1.9438;                             // m/s → kt
  const pitchStab = clamp(100 - Math.abs(cg - 48) * 2.2 - (wt - 1800) / 400, 5, 100);
  const pitchDeg  = (cg - 50) * 1.2 + (wt - 2000) * 0.002;
  const wingLoad  = wt / WING_AREA;
  const ld        = clamp(14.8 - Math.abs(cg - NEUTRAL_PT) * 0.18 - (wt - 1800) / 2200, 6, 16.5);
  const moment    = wt * (cg / 100) * DATUM_ARM * MAC;
  return { stall, pitchStab, pitchDeg, wingLoad, ld, moment };
}

// ── ADI Canvas renderer ────────────────────────────────────────────────
function drawADI(canvas, pitchDeg) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2;
  const pitch = clamp(pitchDeg, -20, 20);
  const pitchPx = pitch * (H / 60);
  const R = Math.min(W, H) * 0.44;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Sky
  const skyGrad = ctx.createLinearGradient(0, cy - R, 0, cy + pitchPx);
  skyGrad.addColorStop(0, '#002850');
  skyGrad.addColorStop(1, '#003d75');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2 + pitchPx);

  // Earth
  const earthGrad = ctx.createLinearGradient(0, cy + pitchPx, 0, cy + R);
  earthGrad.addColorStop(0, '#3d1f00');
  earthGrad.addColorStop(1, '#5c2e00');
  ctx.fillStyle = earthGrad;
  ctx.fillRect(cx - R, cy + pitchPx, R * 2, R);

  // Horizon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + pitchPx);
  ctx.lineTo(cx + R, cy + pitchPx);
  ctx.stroke();

  // Pitch ladder
  ctx.font = '9px "Share Tech Mono", monospace';
  [-10, -5, 5, 10].forEach(deg => {
    const y = cy + pitchPx - deg * (H / 60);
    const len = deg % 10 === 0 ? 32 : 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - len, y); ctx.lineTo(cx + len, y);
    ctx.stroke();
    if (deg % 10 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(Math.abs(deg) + '°', cx + len + 10, y + 4);
    }
  });
  ctx.restore();

  // Instrument ring
  ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#00c8e6'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

  // Aircraft symbol
  ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 30, cy); ctx.lineTo(cx - 8, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 30, cy); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffcc00'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy - 12); ctx.stroke();
}

// ── Envelope Canvas renderer ───────────────────────────────────────────
const ENV_POLYGON = [[40,1600],[60,1600],[60,2800],[58,3200],[42,3200],[40,2800]];

function pointInPolygon(cx, cy, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (((yi > cy) !== (yj > cy)) && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function drawEnvelope(canvas, wt, cg) {
  canvas.width  = canvas.parentElement?.clientWidth || 320;
  canvas.height = 165;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const mx = 44, my = 14, mxr = 14, myb = 28;
  const gW = W - mx - mxr, gH = H - my - myb;
  const cgMin = 36, cgMax = 64, wMin = 1400, wMax = 3400;

  const toX = c => mx + ((c - cgMin) / (cgMax - cgMin)) * gW;
  const toY = w => my + gH - ((w - wMin) / (wMax - wMin)) * gH;

  // Grid
  ctx.strokeStyle = 'rgba(30,58,95,0.6)'; ctx.lineWidth = 0.5;
  for (let gc = 38; gc <= 62; gc += 4) {
    ctx.beginPath(); ctx.moveTo(toX(gc), my); ctx.lineTo(toX(gc), my + gH); ctx.stroke();
  }
  for (let gw = 1600; gw <= 3200; gw += 400) {
    ctx.beginPath(); ctx.moveTo(mx, toY(gw)); ctx.lineTo(mx + gW, toY(gw)); ctx.stroke();
  }

  // Envelope fill
  ctx.beginPath();
  ENV_POLYGON.forEach(([ec, ew], i) =>
    i === 0 ? ctx.moveTo(toX(ec), toY(ew)) : ctx.lineTo(toX(ec), toY(ew))
  );
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,200,230,0.07)'; ctx.fill();
  ctx.strokeStyle = '#00c8e6'; ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 2]); ctx.stroke(); ctx.setLineDash([]);

  // Warning border
  ctx.strokeStyle = 'rgba(255,204,0,0.3)'; ctx.lineWidth = 0.75;
  ctx.setLineDash([2, 3]);
  ctx.strokeRect(toX(38), toY(3200), toX(62) - toX(38), toY(1600) - toY(3200));
  ctx.setLineDash([]);

  // Axes
  ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, my + gH); ctx.lineTo(mx + gW, my + gH); ctx.stroke();

  // Axis labels
  ctx.fillStyle = 'rgba(122,179,212,0.8)'; ctx.font = '9px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  [40, 44, 48, 52, 56, 60].forEach(gc => ctx.fillText(gc + '%', toX(gc), my + gH + 12));
  ctx.textAlign = 'right';
  [1600, 2000, 2400, 2800, 3200].forEach(gw => ctx.fillText(gw, mx - 3, toY(gw) + 3));

  // Current point glow + crosshairs
  const px = toX(cg), py = toY(wt);
  const inEnv = pointInPolygon(cg, wt, ENV_POLYGON);
  const ptColor = inEnv ? '#00ff88' : '#ff3333';

  ctx.strokeStyle = ptColor + '40'; ctx.lineWidth = 0.75;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(mx, py); ctx.lineTo(px, py);
  ctx.moveTo(px, my + gH); ctx.lineTo(px, py);
  ctx.stroke(); ctx.setLineDash([]);

  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = ptColor; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();

  // Envelope label
  ctx.fillStyle = 'rgba(0,200,230,0.4)'; ctx.font = '9px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENVELOPE', toX(50), toY(2200) + 4);
}

// ── Status helpers ─────────────────────────────────────────────────────
function getWeightStatus(wt) {
  if (wt > 3100) return { color: '#ff3333', label: 'WARNING' };
  if (wt > 2800) return { color: '#ffcc00', label: 'CAUTION' };
  return { color: '#00ff88', label: 'NORMAL' };
}
function getCGStatus(cg) {
  if (cg < 39 || cg > 61) return { color: '#ff3333', label: 'EXCEED' };
  if (cg < 42 || cg > 58) return { color: '#ffcc00', label: 'CAUTION' };
  return { color: '#00ff88', label: 'NORMAL' };
}
function getStabStatus(s) {
  if (s < 25) return { color: '#ff3333', label: 'UNSTABLE' };
  if (s < 50) return { color: '#ffcc00', label: 'REDUCED' };
  return { color: '#00ff88', label: 'STABLE' };
}

// ── Sub-components ─────────────────────────────────────────────────────
const PRESETS_WEIGHT = [
  { label: 'ZERO FUEL', val: 1800 },
  { label: 'MED FUEL',  val: 2200 },
  { label: 'FULL FUEL', val: 3000 },
  { label: 'MTOW',      val: 3200, warn: true },
];
const PRESETS_CG = [
  { label: 'FWD LOAD', val: 40 },
  { label: 'NOMINAL',  val: 50, ok: true },
  { label: 'AFT SHIFT', val: 58, warn: true },
];

function StatusRow({ color, msg, val }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0',
      borderBottom:'1px solid rgba(30,58,95,0.3)', fontSize:12, fontWeight:600, letterSpacing:'0.5px' }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:color,
        boxShadow:`0 0 6px ${color}`, flexShrink:0, transition:'all 0.3s' }} />
      <span style={{ flex:1, color:'#7ab3d4' }}>{msg}</span>
      <span style={{ fontFamily:'"Share Tech Mono", monospace', fontSize:12,
        color, minWidth:60, textAlign:'right', transition:'color 0.3s' }}>{val}</span>
    </div>
  );
}

function FormulaRow({ name, equation, result, level }) {
  const color = level === 'danger' ? '#ff3333' : level === 'warn' ? '#ffcc00' : '#00ff88';
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'5px 0', borderBottom:'1px solid rgba(30,58,95,0.4)',
      fontFamily:'"Share Tech Mono", monospace', fontSize:12 }}>
      <span style={{ color:'#7ab3d4', flex:1 }}>{name}</span>
      <span style={{ color:'#3a6080', flex:1.5, fontSize:11 }}>{equation}</span>
      <span style={{ color, minWidth:80, textAlign:'right', fontWeight:600,
        transition:'color 0.3s' }}>{result}</span>
    </div>
  );
}

function GaugeCard({ title, value, unit, pct, color }) {
  return (
    <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6,
      padding:10, textAlign:'center', borderTop:`2px solid ${color}` }}>
      <div style={{ fontSize:10, letterSpacing:1, textTransform:'uppercase',
        color:'#3a6080', marginBottom:4 }}>{title}</div>
      <div style={{ fontFamily:'"Share Tech Mono", monospace', fontSize:26,
        color, lineHeight:1, marginBottom:2, transition:'color 0.3s' }}>{value}</div>
      <div style={{ fontSize:11, color:'#3a6080', letterSpacing:1 }}>{unit}</div>
      <div style={{ width:'100%', height:4, background:'rgba(30,58,95,0.8)',
        borderRadius:2, marginTop:8, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${clamp(pct,2,100)}%`, background:color,
          borderRadius:2, transition:'width 0.3s, background 0.3s' }} />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
const AerospaceWeightBalance = () => {
  const { t } = useLanguage();
  const [weightKg, setWeightKg] = useState(2200);
  const [cg, setCg] = useState(52);

  const adiRef     = useRef(null);
  const envRef     = useRef(null);

  const m = useMemo(() => computeMetrics(weightKg, cg), [weightKg, cg]);

  // Redraw canvases whenever state changes
  useEffect(() => {
    if (adiRef.current) {
      const c = adiRef.current;
      c.width  = c.parentElement.clientWidth;
      c.height = c.parentElement.clientHeight;
      drawADI(c, m.pitchDeg);
    }
    if (envRef.current) drawEnvelope(envRef.current, weightKg, cg);
  }, [weightKg, cg, m.pitchDeg]);

  // Resize handling
  useEffect(() => {
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (adiRef.current) {
          const c = adiRef.current;
          c.width = c.parentElement.clientWidth;
          c.height = c.parentElement.clientHeight;
          drawADI(c, m.pitchDeg);
        }
        if (envRef.current) drawEnvelope(envRef.current, weightKg, cg);
      }, 80);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [weightKg, cg, m.pitchDeg]);

  const wStatus   = getWeightStatus(weightKg);
  const cgStatus  = getCGStatus(cg);
  const stbStatus = getStabStatus(m.pitchStab);

  const stallCol  = m.stall   > 60   ? '#ff3333' : m.stall > 52   ? '#ffcc00' : '#00c8e6';
  const stabCol   = m.pitchStab < 25 ? '#ff3333' : m.pitchStab<50 ? '#ffcc00' : '#00e676';
  const trimAbs   = Math.abs(m.pitchDeg);

  const cgSliderColor = cgStatus.label === 'EXCEED' ? 'danger' : cgStatus.label === 'CAUTION' ? 'warn' : '';
  const wtSliderColor = wStatus.label  === 'WARNING'? 'danger' : wStatus.label  === 'CAUTION' ? 'warn' : '';

  // Cockpit-themed viz panel
  const viz = (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* ADI */}
      <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6,
        height:160, position:'relative', overflow:'hidden' }}>
        <canvas ref={adiRef} style={{ width:'100%', height:'100%', display:'block' }} />
        <div style={{ position:'absolute', bottom:6, right:8, fontFamily:'"Share Tech Mono",monospace',
          fontSize:10, color:'#3a6080', letterSpacing:1 }}>ADI · ATTITUDE</div>
      </div>

      {/* Gauges 2×2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <GaugeCard title="Stall Speed"     value={m.stall.toFixed(1)}     unit="KIAS"
          pct={((m.stall - 35) / 40) * 100} color={stallCol} />
        <GaugeCard title="Stability Index" value={m.pitchStab.toFixed(0)} unit="% / 100"
          pct={m.pitchStab} color={stabCol} />
        <GaugeCard title="Pitch Trim"
          value={(m.pitchDeg >= 0 ? '+' : '') + m.pitchDeg.toFixed(1) + '°'} unit="DEGREES"
          pct={50 + m.pitchDeg * 4} color="#a78bfa" />
        <GaugeCard title="Wing Loading"   value={m.wingLoad.toFixed(1)}   unit="kg/m²"
          pct={(m.wingLoad / 220) * 100} color={m.wingLoad > 175 ? '#ffcc00' : '#ffab00'} />
      </div>

      {/* Envelope */}
      <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6, padding:10 }}>
        <div style={{ fontFamily:'"Orbitron",monospace', fontSize:9, letterSpacing:2,
          color:'#00c8e6', textTransform:'uppercase', borderBottom:'1px solid #1e3a5f',
          paddingBottom:5, marginBottom:8 }}>CG Envelope · Load Chart</div>
        <canvas ref={envRef} style={{ width:'100%', display:'block' }} />
      </div>
    </div>
  );

  return (
    <ThalesMissionShell
      backTo="/thales-labs/aerospace"
      backLabelEn="Aerospace missions"
      backLabelKn="ಏರೋಸ್ಪೇಸ್ ಮಿಷನ್‌ಗಳು"
      titleEn="Weight & Balance — Stability Simulation"
      titleKn="ತೂಕ ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್ ಸ್ಥಿರತೆ ಮೇಲೆ ಪರಿಣಾಮ"
      subtitleEn="TOPFLIGHT-WB · EASA CS-23 · Thales Avionics"
      subtitleKn="CG % MAC ಮತ್ತು ಒಟ್ಟು ತೂಕ"
      steps={[
        { en:'Load to MTOW — watch the stall speed rise and stability index fall.', kn:'MTOW ತುಂಬಿ — ಸ್ಟಾಲ್ ವೇಗ ಏರುತ್ತದೆ, ಸ್ಥಿರತೆ ಕುಸಿಯುತ್ತದೆ.' },
        { en:'Push CG forward past 42% — nose-heavy pitch attitude appears on the ADI.', kn:'CG 42% ಮುಂದಕ್ಕೆ ತಳ್ಳಿ — ADI ನಲ್ಲಿ ಮುಗ್ಗರಿಸುವ ಭಂಗಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ.' },
        { en:'Shift CG aft to 50% — watch the envelope dot go green and L/D recover.', kn:'CG 50%ಕ್ಕೆ ಹಿಂದಕ್ಕೆ ಸರಿಸಿ — ಎನ್ವಲಪ್ ಚಿಹ್ನೆ ಹಸಿರಾಗಿ L/D ಸ್ಥಿರಗೊಳ್ಳುತ್ತದೆ.' },
      ]}
      learningEn="Every kilogram and CG inch changes how the wing meets the air. Weight & balance is not paperwork — it is the physics of flight safety."
      learningKn="ಪ್ರತಿ ಕಿಲೋಗ್ರಾಂ ಮತ್ತು CG ಅಂತರ ವಿಮಾನದ ವಾಯುಗತಿಶಾಸ್ತ್ರವನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ."
      vizPanel={viz}
    >
      {/* Weight Control */}
      <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6, padding:'10px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:'#7ab3d4', letterSpacing:'0.5px', textTransform:'uppercase' }}>
            {t('Gross Weight', 'ಒಟ್ಟು ತೂಕ')}
          </span>
          <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:18, color:'#00c8e6' }}>
            {weightKg}<span style={{ fontSize:11, color:'#3a6080', marginLeft:3 }}>kg</span>
          </span>
        </div>
        <input type="range" min={1600} max={3200} step={20} value={weightKg}
          className={wtSliderColor}
          onChange={e => setWeightKg(parseInt(e.target.value))}
          style={{ width:'100%' }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
          fontFamily:'"Share Tech Mono",monospace', color:'#3a6080', marginTop:4 }}>
          <span>1600 kg (MIN)</span><span>3200 kg (MTOW)</span>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
          {PRESETS_WEIGHT.map(p => (
            <button key={p.label} onClick={() => setWeightKg(p.val)}
              style={{ background: p.warn ? 'rgba(255,51,51,0.1)' : 'rgba(0,200,230,0.08)',
                border: `1px solid ${p.warn ? 'rgba(255,51,51,0.3)' : '#1e3a5f'}`,
                borderRadius:4, padding:'3px 8px', fontSize:10,
                fontFamily:'"Share Tech Mono",monospace',
                color: p.warn ? '#ff3333' : '#7ab3d4', cursor:'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* CG Control */}
      <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6, padding:'10px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:'#7ab3d4', letterSpacing:'0.5px', textTransform:'uppercase' }}>
            {t('CG Position', 'CG ಸ್ಥಾನ')}
          </span>
          <span style={{ fontFamily:'"Share Tech Mono",monospace', fontSize:18, color:'#00c8e6' }}>
            {cg.toFixed(1)}<span style={{ fontSize:11, color:'#3a6080', marginLeft:3 }}>% MAC</span>
          </span>
        </div>
        <input type="range" min={38} max={62} step={0.5} value={cg}
          className={cgSliderColor}
          onChange={e => setCg(parseFloat(e.target.value))}
          style={{ width:'100%' }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
          fontFamily:'"Share Tech Mono",monospace', color:'#3a6080', marginTop:4 }}>
          <span>38% (FWD LIMIT)</span><span>62% (AFT LIMIT)</span>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
          {PRESETS_CG.map(p => (
            <button key={p.label} onClick={() => setCg(p.val)}
              style={{ background: p.ok ? 'rgba(0,230,118,0.08)' : p.warn ? 'rgba(255,204,0,0.08)' : 'rgba(0,200,230,0.08)',
                border: `1px solid ${p.ok ? 'rgba(0,230,118,0.2)' : p.warn ? 'rgba(255,204,0,0.2)' : '#1e3a5f'}`,
                borderRadius:4, padding:'3px 8px', fontSize:10,
                fontFamily:'"Share Tech Mono",monospace',
                color: p.ok ? '#00e676' : p.warn ? '#ffcc00' : '#7ab3d4', cursor:'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formula Table */}
      <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6, padding:'10px 12px' }}>
        <div style={{ fontFamily:'"Orbitron",monospace', fontSize:9, letterSpacing:2,
          color:'#00c8e6', textTransform:'uppercase', borderBottom:'1px solid #1e3a5f',
          paddingBottom:5, marginBottom:8 }}>Live Computational Results</div>
        <FormulaRow name="Stall VS"     equation="√(2W/ρSCLmax)"
          result={`${m.stall.toFixed(1)} kt`}
          level={m.stall > 60 ? 'danger' : m.stall > 52 ? 'warn' : ''} />
        <FormulaRow name="Pitch Stability" equation="f(CG, W, MAC)"
          result={m.pitchStab.toFixed(0)}
          level={m.pitchStab < 25 ? 'danger' : m.pitchStab < 50 ? 'warn' : ''} />
        <FormulaRow name="Pitch Trim"   equation="(CG−NP)/MAC×100"
          result={`${m.pitchDeg >= 0 ? '+' : ''}${m.pitchDeg.toFixed(2)}°`}
          level={trimAbs > 6 ? 'warn' : ''} />
        <FormulaRow name="Wing Loading" equation="W/S (S=17.1m²)"
          result={`${m.wingLoad.toFixed(1)} kg/m²`}
          level={m.wingLoad > 175 ? 'warn' : ''} />
        <FormulaRow name="L/D Ratio"    equation="f(α, CG offset)"
          result={m.ld.toFixed(1)}
          level={m.ld < 9 ? 'warn' : ''} />
        <FormulaRow name="Moment"       equation="W × CG-arm"
          result={`${Math.round(m.moment).toLocaleString()} kg·m`} level="" />
      </div>

      {/* Status Advisories */}
      <div style={{ background:'#ffffff', border:'1px solid #1e3a5f', borderRadius:6, padding:'10px 12px' }}>
        <div style={{ fontFamily:'"Orbitron",monospace', fontSize:9, letterSpacing:2,
          color:'#00c8e6', textTransform:'uppercase', borderBottom:'1px solid #1e3a5f',
          paddingBottom:5, marginBottom:8 }}>System Advisories</div>
        <StatusRow color={wStatus.color}  msg={t('Weight within limits','ತೂಕ ಮಿತಿಯೊಳಗಿದೆ')}   val={wStatus.label} />
        <StatusRow color={cgStatus.color} msg={t('CG within envelope','CG ಎನ್ವಲಪ್‌ನಲ್ಲಿದೆ')}   val={cgStatus.label} />
        <StatusRow color={stbStatus.color} msg={t('Pitch stability','ಪಿಚ್ ಸ್ಥಿರತೆ')}           val={stbStatus.label} />
      </div>
    </ThalesMissionShell>
  );
};

export default AerospaceWeightBalance;