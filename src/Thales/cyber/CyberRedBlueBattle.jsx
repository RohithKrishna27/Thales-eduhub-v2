import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import useTTS from '../../hooks/useTTS';
import TTSButton from '../../components/TTSButton';

// ─── helpers ─────────────────────────────────────────────────────────────────
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

const ATTACKS = [
  { id: "scan",    label: "Credential Scanning",   icon: "🔍", desc: "Automated brute-force against login endpoints",         weight: 0.9,  color: "#7C3AED" },
  { id: "ddos",    label: "Volumetric DDoS",        icon: "⚡", desc: "Layer 3/4 flood overwhelming network bandwidth",        weight: 1.15, color: "#DC2626" },
  { id: "exploit", label: "Zero-Day Exploit",       icon: "💀", desc: "Unknown CVE targeting unpatched application server",    weight: 1.35, color: "#B91C1C" },
  { id: "insider", label: "Insider Abuse",          icon: "🕵", desc: "Privileged user exfiltrating sensitive data",           weight: 0.75, color: "#D97706" },
  { id: "supply",  label: "Supply-Chain Poison",    icon: "☠", desc: "Compromised vendor library injecting malicious code",   weight: 1.2,  color: "#9333EA" },
];

const STEPS = [
  { id: 0, label: "Select an attack type",             detail: "Choose one of the five Red Team attack patterns",         check: (s) => s.attackIdx !== null },
  { id: 1, label: "Observe the breach score",          detail: "Note the initial breach score with default defences",     check: (s, m) => m.breachHistory.length >= 5 },
  { id: 2, label: "Raise Firewall posture above 65",   detail: "Tune the firewall to block volumetric and scan attacks",  check: (s) => s.fw >= 65 },
  { id: 3, label: "Raise IDS/IPS sensitivity above 60",detail: "Enable deep packet inspection for exploit detection",     check: (s) => s.ids >= 60 },
  { id: 4, label: "Maximise SOC + IR readiness",       detail: "Both SOC coverage and IR readiness above 65",            check: (s) => s.soc >= 65 && s.ir >= 65 },
  { id: 5, label: "Achieve breach score below 25",     detail: "Blue team wins — breach score < 25 and cost minimised",  check: (s, m) => m.breach < 25 },
];

const LOG_POOL = [
  ["Red team initiated credential stuffing — 4,200 attempts/min", "err"],
  ["Firewall rule FW-442 blocking SYN flood on port 443", "ok"],
  ["IDS alert: anomalous outbound DNS query volume detected", "warn"],
  ["SOC analyst escalated ticket T-8821 to Tier 2", "info"],
  ["IR playbook 'P-BREACH-03' activated by on-call team", "info"],
  ["Zero-day PoC detected — CVE-2024-XXXX pattern match", "err"],
  ["Thales ThreatRadar: 14 new IOCs pushed to blocklist", "ok"],
  ["Lateral movement attempt blocked by microsegmentation", "ok"],
  ["Insider activity: bulk download flagged by DLP engine", "warn"],
  ["Supply-chain library hash mismatch — build halted", "err"],
  ["SIEM correlation rule triggered: brute-force pattern", "warn"],
  ["Blue team applied emergency patch — reboot in 2 min", "info"],
  ["Red team pivot: switching to supply-chain vector", "err"],
  ["SOC coverage gap identified — shift handover in progress", "warn"],
  ["Thales CyberGuard: threat intelligence feed updated", "ok"],
];

function calcMetrics(s, breachHistory) {
  const w = ATTACKS[s.attackIdx].weight;
  const defence = (s.fw + s.ids * 1.1 + s.soc * 1.05 + s.ir * 0.95) / 4;
  const breach = clamp(100 - defence / w + s.attackIdx * 3, 0, 100);
  const cost = breach * 500 + (100 - s.ir) * 40;
  const detectionRate = clamp((s.ids * 0.45 + s.soc * 0.35 + s.fw * 0.2) / 100 * 100, 0, 100);
  const containmentTime = clamp(120 - s.ir * 0.8 - s.soc * 0.4, 5, 120);
  const riskScore = clamp(breach * 0.6 + (100 - detectionRate) * 0.4, 0, 100);
  return { breach, cost, detectionRate, containmentTime, riskScore, breachHistory };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TopBar({ metrics, state }) {
  const atk = ATTACKS[state.attackIdx];
  const winning = metrics.breach < 25;
  const losing = metrics.breach > 70;
  return (
    <div style={{ background: "#F8F9FB", borderBottom: "1.5px solid #E2E8F0", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "#C8102E", color: "#fff", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, padding: "5px 12px", letterSpacing: 2, borderRadius: 3 }}>THALES</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: "#1E40AF", letterSpacing: 1, fontWeight: 600 }}>CYBERRANGE · RED vs BLUE TEAM BATTLE</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: `1px solid ${atk.color}`, color: atk.color, background: atk.color + "14" }}>
          {atk.icon} RED: {atk.label.toUpperCase()}
        </span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: `1px solid ${winning ? "#16A34A" : losing ? "#DC2626" : "#3B82F6"}`, color: winning ? "#16A34A" : losing ? "#DC2626" : "#3B82F6", background: (winning ? "#16A34A" : losing ? "#DC2626" : "#3B82F6") + "14" }}>
          ● BLUE: {winning ? "DEFENDING ✓" : losing ? "BREACHED ✗" : "IN PROGRESS"}
        </span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: "1px solid #1D4ED8", color: "#1D4ED8", background: "#EFF6FF" }}>● SYSTEM ONLINE</span>
      </div>
    </div>
  );
}

function SectionLabel({ children, color = "#94A3B8" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 2, color: "#94A3B8", textTransform: "uppercase" }}>{children}</span>
    </div>
  );
}

function StepTrack({ state, metrics }) {
  const stepsDone = useMemo(() => {
    const done = new Set();
    STEPS.forEach((st, i) => { if (st.check(state, metrics)) done.add(i); });
    return done;
  }, [state, metrics]);

  let currentActive = -1;
  for (let i = 0; i < STEPS.length; i++) {
    if (!stepsDone.has(i)) { currentActive = i; break; }
  }
  const progress = (stepsDone.size / STEPS.length) * 100;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
        <SectionLabel color="#3B82F6">mission objectives</SectionLabel>
        <TTSButton
          text="Deploy firewall rules above 70 confidence. Raise intrusion detection sensitivity above 60. Maximize security operations center coverage above 65. Achieve breach score below 25."
          speak={speak}
          stopSpeech={stopSpeech}
          pauseSpeech={pauseSpeech}
          resumeSpeech={resumeSpeech}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          buttonSize="sm"
        />
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#3B82F6" }}>{stepsDone.size}/{STEPS.length}</span>
      </div>
      <div style={{ height: 4, background: "#E2E8F0", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#16A34A" : "#3B82F6", borderRadius: 2, transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {STEPS.map((st, i) => {
          const done = stepsDone.has(i);
          const active = !done && i === currentActive;
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 6, border: `1px solid ${done ? "#BBF7D0" : active ? "#BFDBFE" : "#E2E8F0"}`, background: done ? "#F0FDF4" : active ? "#EFF6FF" : "#FAFAFA", transition: "all .3s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',sans-serif", fontSize: 8, fontWeight: 700, flexShrink: 0, border: `1.5px solid ${done ? "#16A34A" : active ? "#3B82F6" : "#CBD5E1"}`, color: done ? "#fff" : active ? "#3B82F6" : "#94A3B8", background: done ? "#16A34A" : "transparent" }}>
                {done ? "✓" : i + 1}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: done ? "#15803D" : active ? "#1D4ED8" : "#64748B" }}>{st.label}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{st.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttackSelector({ attackIdx, onChange }) {
  return (
    <div>
      <SectionLabel color="#DC2626">red team — attack vector</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ATTACKS.map((a, i) => (
          <button key={a.id} onClick={() => onChange(i)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${attackIdx === i ? a.color : "#E2E8F0"}`, background: attackIdx === i ? a.color + "0D" : "#FAFAFA", cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
            <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>{a.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: attackIdx === i ? a.color : "#374151" }}>{a.label}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, lineHeight: 1.3 }}>{a.desc}</div>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0, fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: a.color }}>×{a.weight}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BlueSliders({ state, onChange }) {
  const sliders = [
    { key: "fw",  label: "Firewall Posture",      color: "#3B82F6", sub: "Blocks network-level threats" },
    { key: "ids", label: "IDS / IPS Sensitivity", color: "#8B5CF6", sub: "Detects exploit patterns" },
    { key: "soc", label: "SOC Coverage",           color: "#059669", sub: "24/7 analyst monitoring" },
    { key: "ir",  label: "IR Readiness",           color: "#D97706", sub: "Incident response speed" },
  ];
  return (
    <div>
      <SectionLabel color="#3B82F6">blue team — defence controls</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sliders.map((sl) => (
          <div key={sl.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{sl.label}</span>
                <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 6 }}>{sl.sub}</span>
              </div>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: sl.color, fontWeight: 700 }}>{state[sl.key]}</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={state[sl.key]} onChange={(e) => onChange(sl.key, parseInt(e.target.value))} style={{ width: "100%", accentColor: sl.color, cursor: "pointer" }} />
            <div style={{ height: 3, background: "#E2E8F0", borderRadius: 2, marginTop: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${state[sl.key]}%`, background: sl.color, borderRadius: 2, transition: "width .1s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaEngine({ metrics, state }) {
  const atk = ATTACKS[state.attackIdx];
  const rows = [
    { k: `Attack weight (${atk.label})`, v: `×${atk.weight}`, color: atk.color },
    { k: "Defence avg = (FW + IDS×1.1 + SOC×1.05 + IR×0.95) / 4", v: ((state.fw + state.ids * 1.1 + state.soc * 1.05 + state.ir * 0.95) / 4).toFixed(1), color: "#3B82F6" },
    { k: "Breach = 100 − defence/weight + idx×3", v: metrics.breach.toFixed(1), color: metrics.breach > 60 ? "#DC2626" : metrics.breach > 30 ? "#D97706" : "#16A34A" },
    { k: "Incident cost (sim $)", v: `$${metrics.cost.toFixed(0)}`, color: "#7C3AED" },
    { k: "Detection rate", v: `${metrics.detectionRate.toFixed(1)}%`, color: metrics.detectionRate > 70 ? "#16A34A" : "#D97706" },
    { k: "Containment time (min)", v: `${metrics.containmentTime.toFixed(0)} min`, color: metrics.containmentTime < 30 ? "#16A34A" : metrics.containmentTime < 70 ? "#D97706" : "#DC2626" },
    { k: "Overall risk score", v: `${metrics.riskScore.toFixed(0)}/100`, color: metrics.riskScore > 60 ? "#DC2626" : metrics.riskScore > 35 ? "#D97706" : "#16A34A" },
  ];
  return (
    <div>
      <SectionLabel color="#F59E0B">realtime formula engine</SectionLabel>
      <div style={{ border: "1px solid #E2E8F0", borderRadius: 6, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", background: i % 2 === 0 ? "#FAFAFA" : "#fff", borderBottom: i < rows.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <span style={{ fontSize: 9, color: "#64748B", fontFamily: "'Share Tech Mono',monospace", flex: 1 }}>{r.k}</span>
            <span style={{ fontSize: 11, fontFamily: "'Share Tech Mono',monospace", fontWeight: 700, color: r.color, flexShrink: 0, marginLeft: 8 }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsGrid({ metrics }) {
  const cards = [
    { label: "BREACH SCORE", val: metrics.breach.toFixed(0), sub: metrics.breach > 60 ? "CRITICAL" : metrics.breach > 30 ? "ELEVATED" : "CONTAINED", color: metrics.breach > 60 ? "#DC2626" : metrics.breach > 30 ? "#D97706" : "#16A34A", bg: metrics.breach > 60 ? "#FEF2F2" : metrics.breach > 30 ? "#FFFBEB" : "#F0FDF4" },
    { label: "INCIDENT COST (SIM)", val: `$${metrics.cost.toFixed(0)}`, sub: "Per breach estimate", color: "#7C3AED", bg: "#F5F3FF" },
    { label: "DETECTION RATE", val: `${metrics.detectionRate.toFixed(0)}%`, sub: metrics.detectionRate > 70 ? "EXCELLENT" : metrics.detectionRate > 40 ? "ADEQUATE" : "BLIND SPOTS", color: metrics.detectionRate > 70 ? "#16A34A" : metrics.detectionRate > 40 ? "#D97706" : "#DC2626", bg: metrics.detectionRate > 70 ? "#F0FDF4" : metrics.detectionRate > 40 ? "#FFFBEB" : "#FEF2F2" },
    { label: "CONTAINMENT TIME", val: `${metrics.containmentTime.toFixed(0)} min`, sub: metrics.containmentTime < 30 ? "RAPID RESPONSE" : metrics.containmentTime < 70 ? "MODERATE" : "SLOW — RISK HIGH", color: metrics.containmentTime < 30 ? "#16A34A" : metrics.containmentTime < 70 ? "#D97706" : "#DC2626", bg: metrics.containmentTime < 30 ? "#F0FDF4" : metrics.containmentTime < 70 ? "#FFFBEB" : "#FEF2F2" },
    { label: "RISK SCORE", val: `${metrics.riskScore.toFixed(0)}/100`, sub: metrics.riskScore > 60 ? "SEVERE" : metrics.riskScore > 35 ? "MODERATE" : "LOW RISK", color: metrics.riskScore > 60 ? "#DC2626" : metrics.riskScore > 35 ? "#D97706" : "#16A34A", bg: metrics.riskScore > 60 ? "#FEF2F2" : metrics.riskScore > 35 ? "#FFFBEB" : "#F0FDF4" },
    { label: "DEFENCE COVERAGE", val: `${((metrics.detectionRate + (100 - metrics.breach)) / 2).toFixed(0)}%`, sub: metrics.breach < 25 ? "BLUE TEAM WINS" : "BATTLE ONGOING", color: metrics.breach < 25 ? "#16A34A" : "#3B82F6", bg: metrics.breach < 25 ? "#F0FDF4" : "#EFF6FF" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.color}22`, borderLeft: `3px solid ${c.color}`, borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: c.color }}>{c.val}</div>
          <div style={{ fontSize: 9, color: c.color + "AA", marginTop: 2, fontWeight: 600 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function BattleMap({ metrics, state, tick }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, W, H);

    const nodes = [
      { x: 30,  y: H/2, label: "RED\nTEAM",  color: ATTACKS[state.attackIdx].color, r: 14 },
      { x: 110, y: H/2 - 28, label: "FW",    color: state.fw > 65 ? "#16A34A" : "#D97706", r: 10 },
      { x: 110, y: H/2 + 28, label: "IDS",   color: state.ids > 60 ? "#16A34A" : "#D97706", r: 10 },
      { x: 190, y: H/2 - 20, label: "SOC",   color: state.soc > 65 ? "#16A34A" : "#D97706", r: 10 },
      { x: 190, y: H/2 + 20, label: "IR",    color: state.ir > 65 ? "#16A34A" : "#D97706", r: 10 },
      { x: 270, y: H/2, label: "BLUE\nTEAM", color: metrics.breach < 25 ? "#16A34A" : metrics.breach > 70 ? "#DC2626" : "#3B82F6", r: 14 },
    ];

    const edges = [[0,1],[0,2],[1,3],[2,3],[1,4],[2,4],[3,5],[4,5]];
    edges.forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // animated attack packet
    if (metrics.breach > 10) {
      const progress = (Date.now() / 600 + tick * 0.01) % 1;
      const x = nodes[0].x + (nodes[5].x - nodes[0].x) * progress;
      const wobble = Math.sin(progress * Math.PI * 3) * 12;
      ctx.beginPath(); ctx.arc(x, H / 2 + wobble, 4, 0, Math.PI * 2);
      ctx.fillStyle = metrics.breach > 50 ? "#DC2626" : "#D97706"; ctx.fill();
    }

    nodes.forEach((n) => {
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color + "22"; ctx.fill();
      ctx.strokeStyle = n.color; ctx.lineWidth = 2; ctx.stroke();
      const lines = n.label.split("\n");
      ctx.fillStyle = n.color;
      ctx.font = `bold 7px 'Share Tech Mono'`;
      ctx.textAlign = "center";
      lines.forEach((ln, li) => ctx.fillText(ln, n.x, n.y + n.r + 11 + li * 9));
    });
  });

  return (
    <div>
      <SectionLabel color="#DC2626">live battle map</SectionLabel>
      <canvas ref={canvasRef} width={310} height={130} style={{ border: "1px solid #E2E8F0", borderRadius: 6, display: "block", width: "100%", background: "#F8FAFC" }} />
    </div>
  );
}

function BreachChart({ history }) {
  const max = 100;
  return (
    <div>
      <SectionLabel color="#3B82F6">breach score timeline</SectionLabel>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 8px 4px", position: "relative" }}>
        <div style={{ position: "absolute", top: 4, right: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#94A3B8" }}>BREACH %</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
          {history.map((v, i) => {
            const h = clamp((v / max) * 100, 2, 100);
            const color = v > 60 ? "#DC2626" : v > 30 ? "#D97706" : "#16A34A";
            return <div key={i} style={{ flex: 1, borderRadius: "2px 2px 0 0", height: `${h}%`, background: color, opacity: 0.4 + i / 40, transition: "height .15s" }} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, fontSize: 9, color: "#94A3B8", fontFamily: "'Share Tech Mono',monospace" }}>
          <span>T-20s</span><span>T-10s</span><span>NOW</span>
        </div>
      </div>
    </div>
  );
}

function AttackProfileTable({ state, metrics }) {
  const rows = ATTACKS.map((a, i) => {
    const s = { ...state, attackIdx: i };
    const m = calcMetrics(s, []);
    return { ...a, breach: m.breach, cost: m.cost, det: m.detectionRate, current: i === state.attackIdx };
  });

  return (
    <div>
      <SectionLabel color="#F59E0B">attack profile comparison</SectionLabel>
      <div style={{ border: "1px solid #E2E8F0", borderRadius: 6, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["ATTACK TYPE", "WEIGHT", "BREACH %", "COST (SIM$)", "DETECTION", "STATUS"].map((h) => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 1, color: "#94A3B8", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const bColor = r.breach > 60 ? "#DC2626" : r.breach > 30 ? "#D97706" : "#16A34A";
              return (
                <tr key={i} style={{ background: r.current ? r.color + "0A" : i % 2 === 0 ? "#fff" : "#FAFAFA", borderLeft: r.current ? `3px solid ${r.color}` : "3px solid transparent" }}>
                  <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.color, fontWeight: r.current ? 700 : 400 }}>{r.icon} {r.label}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.color }}>×{r.weight}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: bColor, fontWeight: 700 }}>{r.breach.toFixed(0)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10 }}>${r.cost.toFixed(0)}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.det > 60 ? "#16A34A" : "#D97706" }}>{r.det.toFixed(0)}%</td>
                  <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.current ? r.color : "#94A3B8", fontWeight: r.current ? 700 : 400 }}>{r.current ? "▶ ACTIVE" : "STANDBY"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBreakdown({ metrics }) {
  const scores = [
    { label: "Firewall block rate", val: clamp(metrics.detectionRate * 0.35, 0, 100), color: "#3B82F6" },
    { label: "IDS/IPS accuracy",    val: clamp(metrics.detectionRate * 0.45, 0, 100), color: "#8B5CF6" },
    { label: "SOC responsiveness",  val: clamp(100 - metrics.containmentTime, 0, 100), color: "#059669" },
    { label: "IR effectiveness",    val: clamp(100 - metrics.breach, 0, 100),          color: "#D97706" },
  ];
  return (
    <div>
      <SectionLabel color="#16A34A">defence score breakdown</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
        {scores.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ fontSize: 9, color: "#64748B", width: 110, flexShrink: 0, fontFamily: "'Share Tech Mono',monospace" }}>{s.label}</span>
            <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.val.toFixed(0)}%`, background: s.color, borderRadius: 3, transition: "width .4s" }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", color: s.color, width: 28, textAlign: "right" }}>{s.val.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocLog({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  const colorMap = { err: "#DC2626", warn: "#D97706", ok: "#16A34A", info: "#3B82F6" };
  return (
    <div>
      <SectionLabel color="#94A3B8">soc event log</SectionLabel>
      <div ref={ref} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: 8, height: 100, overflowY: "auto", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, lineHeight: 1.7 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <span style={{ color: "#94A3B8" }}>[{l.ts}]</span>{" "}
            <span style={{ color: colorMap[l.type] }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessModal({ metrics, state, onRestart }) {
  const atk = ATTACKS[state.attackIdx];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "2px solid #16A34A", borderRadius: 12, padding: "36px 40px", maxWidth: 520, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.1)" }}>
        <div style={{ display: "inline-block", border: "1px solid #D97706", borderRadius: 4, padding: "4px 14px", marginBottom: 16 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 2, color: "#D97706" }}>THALES CYBERRANGE · MISSION COMPLETE</span>
        </div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: "#15803D", marginBottom: 8 }}>BLUE TEAM WINS</div>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>
          You successfully defended against <strong style={{ color: atk.color }}>{atk.icon} {atk.label}</strong> by correctly sequencing your firewall, IDS, SOC, and incident response playbooks.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Breach Score", val: `${metrics.breach.toFixed(0)}`, note: "Contained" },
            { label: "Detection Rate", val: `${metrics.detectionRate.toFixed(0)}%`, note: "Achieved" },
            { label: "Containment", val: `${metrics.containmentTime.toFixed(0)} min`, note: "Response time" },
            { label: "Incident Cost", val: `$${metrics.cost.toFixed(0)}`, note: "Minimised" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: "#15803D", fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#86EFAC" }}>{s.note}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'Share Tech Mono',monospace", marginBottom: 18 }}>
          Key insight: no single slider wins every attack profile.<br />Defenders must sequence decisions under pressure.
        </p>
        <button onClick={onRestart} style={{ background: "transparent", border: "1.5px solid #3B82F6", color: "#3B82F6", fontFamily: "'Orbitron',sans-serif", fontSize: 11, padding: "10px 28px", cursor: "pointer", letterSpacing: 1, borderRadius: 4 }}>
          ↺ RESTART MISSION
        </button>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function ThalesRedBlueBattle() {
  const { speak, stopSpeech, pauseSpeech, resumeSpeech, isSpeaking, isPaused } = useTTS();
  const [state, setState] = useState({ attackIdx: 0, fw: 45, ids: 40, soc: 50, ir: 35 });
  const [breachHistory, setBreachHistory] = useState(() => Array(20).fill(55));
  const [logs, setLogs] = useState([
    { ts: "00:00:00", msg: "Thales CyberRange Red vs Blue scenario loaded", type: "ok" },
    { ts: "00:00:01", msg: "Red team standing by — select attack vector", type: "warn" },
    { ts: "00:00:02", msg: "Blue team defences initialised at baseline", type: "info" },
  ]);
  const [logIdx, setLogIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [completedOnce, setCompletedOnce] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const metrics = useMemo(() => calcMetrics(state, breachHistory), [state, breachHistory]);

  const stepsDone = useMemo(() => {
    const done = new Set();
    STEPS.forEach((st, i) => { if (st.check(state, { ...metrics, breachHistory })) done.add(i); });
    return done;
  }, [state, metrics, breachHistory]);

  useEffect(() => {
    if (stepsDone.size === STEPS.length && !completedOnce) {
      setCompletedOnce(true);
      setTimeout(() => setShowSuccess(true), 600);
    }
  }, [stepsDone, completedOnce]);

  useEffect(() => {
    let raf;
    let lastTick = 0, lastLog = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (t - lastTick > 160) {
        lastTick = t;
        const m = calcMetrics(stateRef.current, []);
        setBreachHistory((prev) => [...prev.slice(1), clamp(m.breach + (Math.random() - 0.5) * 3, 0, 100)]);
        setTick((n) => n + 1);
      }
      if (t - lastLog > 3200) {
        lastLog = t;
        const now = new Date();
        const ts = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
        setLogIdx((i) => {
          const [msg, type] = LOG_POOL[i % LOG_POOL.length];
          setLogs((prev) => [...prev.slice(-49), { ts, msg, type }]);
          return i + 1;
        });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleChange = useCallback((key, val) => {
    setState((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleRestart = () => {
    setState({ attackIdx: 0, fw: 45, ids: 40, soc: 50, ir: 35 });
    setBreachHistory(Array(20).fill(55));
    setCompletedOnce(false);
    setShowSuccess(false);
    setLogs([{ ts: "00:00:00", msg: "Mission reset. New scenario loaded.", type: "info" }]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; font-family: 'Rajdhani', sans-serif; }
        input[type=range] { cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
      `}</style>

      <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Rajdhani',sans-serif" }}>
        <TopBar metrics={metrics} state={state} />

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "calc(100vh - 48px)" }}>
          {/* LEFT PANEL */}
          <div style={{ borderRight: "1.5px solid #E2E8F0", background: "#FAFBFC", padding: 16, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
            <StepTrack state={state} metrics={{ ...metrics, breachHistory }} />
            <AttackSelector attackIdx={state.attackIdx} onChange={(i) => handleChange("attackIdx", i)} />
            <BlueSliders state={state} onChange={handleChange} />
            <FormulaEngine metrics={metrics} state={state} />
            <SocLog logs={logs} />
          </div>

          {/* RIGHT PANEL */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
            <MetricsGrid metrics={metrics} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <BattleMap metrics={metrics} state={state} tick={tick} />
              <BreachChart history={breachHistory} />
            </div>
            <AttackProfileTable state={state} metrics={metrics} />
            <ScoreBreakdown metrics={metrics} />
          </div>
        </div>

        {showSuccess && <SuccessModal metrics={metrics} state={state} onRestart={handleRestart} />}
      </div>
    </>
  );
}
