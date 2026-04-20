import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

const STEPS = [
  { id: 0, label: "Simulate high legitimate traffic", detail: "Set Legit Traffic slider above 70", check: (s) => s.legitTraffic >= 70 },
  { id: 1, label: "Trigger a major DDoS attack", detail: "Set Attack Volume above 65", check: (s) => s.attackVolume >= 65 },
  { id: 2, label: "Observe critical bandwidth breach", detail: "Watch bandwidth index exceed 100", check: (s, m) => m.bw >= 100 },
  { id: 3, label: "Apply aggressive rate limiting", detail: "Set Rate-Limit Strictness above 60", check: (s) => s.rateLimit >= 60 },
  { id: 4, label: "Harden system with patching", detail: "Set Patch / Hardening Level above 65", check: (s) => s.patchLevel >= 65 },
  { id: 5, label: "Achieve safe operations", detail: "Bandwidth < 80 AND legit users dropped < 15%", check: (s, m) => m.bw < 80 && m.legitDropped < 15 },
];

const LOG_POOL = [
  ["SYN flood detected from 103.42.91.x — rate: CRITICAL", "err"],
  ["Scrubbing 42,000 malformed packets/sec via Thales Scrubbing Centre", "warn"],
  ["Rate limiter rule applied — threshold 1500 req/s", "info"],
  ["BGP blackhole route advertised for attack /24 prefix", "info"],
  ["Geo-block rule active: suspect IP ranges filtered", "ok"],
  ["UDP amplification factor: 28x — DNS reflection attack", "err"],
  ["Layer 7 DPI inspection enabled on upstream proxy", "ok"],
  ["CDN edge node absorbing spike — 98 Gbps mitigated", "warn"],
  ["CAPTCHA challenge deployed to 1,200 sessions", "info"],
  ["TCP SYN cookie defence activated on all listeners", "ok"],
  ["ICMP rate-limit enforced per Thales CyberGuard RFC-3", "info"],
  ["Anomaly score 94/100 — auto-mitigation rule triggered", "warn"],
  ["Thales ThreatRadar: botnet C2 IPs added to blocklist", "ok"],
  ["Packet inspection: volumetric Layer 3 flood confirmed", "err"],
];

function calcMetrics(s) {
  const mitigation = (s.rateLimit / 100) * 0.55 + (s.patchLevel / 100) * 0.35;
  const rawLoad = s.legitTraffic + s.attackVolume * (1 - mitigation);
  const bw = clamp(rawLoad, 0, 130);
  const downtimeCost = bw * 120 + s.attackVolume * 85;
  const legitDropped = clamp(s.attackVolume * (1 - s.rateLimit / 100) * 0.35 - s.patchLevel * 0.08, 0, 80);
  const mitigationEff = clamp(mitigation * 100, 0, 100);
  const threatLevel = clamp((s.attackVolume * 0.6 + bw * 0.3 - s.rateLimit * 0.2 - s.patchLevel * 0.2) / 100 * 100, 0, 100);
  const defScore = clamp(100 - threatLevel * 0.5 - legitDropped * 0.3, 0, 100);
  return { bw, downtimeCost, legitDropped, mitigationEff, threatLevel, defScore };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TopBar({ metrics, state }) {
  const atkSevere = state.attackVolume > 60;
  const atkActive = state.attackVolume > 20;
  const defStrong = metrics.mitigationEff > 70;
  const defPartial = metrics.mitigationEff > 40;
  return (
    <div style={{ background: "#F8F9FB", borderBottom: "1.5px solid #E2E8F0", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "#C8102E", color: "#fff", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, padding: "5px 12px", letterSpacing: 2, borderRadius: 3 }}>THALES</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: "#1E40AF", letterSpacing: 1, fontWeight: 600 }}>CYBERRANGE · DDoS MITIGATION LAB</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill color={atkSevere ? "#DC2626" : atkActive ? "#D97706" : "#16A34A"} label={atkSevere ? "● SEVERE ATTACK" : atkActive ? "● ATTACK ACTIVE" : "● THREAT LOW"} />
        <Pill color={defStrong ? "#16A34A" : defPartial ? "#D97706" : "#DC2626"} label={defStrong ? "● MITIGATION STRONG" : defPartial ? "● MITIGATION PARTIAL" : "● MITIGATION WEAK"} />
        <Pill color="#1D4ED8" label="● SYSTEM ONLINE" />
      </div>
    </div>
  );
}

function Pill({ color, label }) {
  return (
    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: `1px solid ${color}`, color, background: color + "14" }}>{label}</span>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <SectionLabel color="#3B82F6">mission objectives</SectionLabel>
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
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 6,
              border: `1px solid ${done ? "#BBF7D0" : active ? "#BFDBFE" : "#E2E8F0"}`,
              background: done ? "#F0FDF4" : active ? "#EFF6FF" : "#FAFAFA",
              transition: "all .3s"
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Orbitron',sans-serif", fontSize: 8, fontWeight: 700, flexShrink: 0,
                border: `1.5px solid ${done ? "#16A34A" : active ? "#3B82F6" : "#CBD5E1"}`,
                color: done ? "#fff" : active ? "#3B82F6" : "#94A3B8",
                background: done ? "#16A34A" : "transparent"
              }}>{done ? "✓" : i + 1}</div>
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

function SliderGroup({ state, onChange }) {
  const sliders = [
    { key: "legitTraffic", label: "Legitimate Traffic", color: "#3B82F6", icon: "↑", min: 10, max: 100 },
    { key: "attackVolume", label: "Attack Volume (DDoS)", color: "#DC2626", icon: "⚡", min: 0, max: 100 },
    { key: "patchLevel", label: "Patch / Hardening Level", color: "#16A34A", icon: "🛡", min: 0, max: 100 },
    { key: "rateLimit", label: "Rate-Limit Strictness", color: "#059669", icon: "⊙", min: 0, max: 100 },
  ];

  return (
    <div>
      <SectionLabel color="#8B5CF6">network controls</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sliders.map((sl) => (
          <div key={sl.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{sl.label}</span>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: sl.color, fontWeight: 700 }}>{state[sl.key]}</span>
            </div>
            <input
              type="range" min={sl.min} max={sl.max} step={1} value={state[sl.key]}
              onChange={(e) => onChange(sl.key, parseInt(e.target.value))}
              style={{ width: "100%", accentColor: sl.color, height: 4, cursor: "pointer" }}
            />
            <div style={{ height: 4, background: "#E2E8F0", borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${state[sl.key]}%`, background: sl.color, borderRadius: 2, transition: "width .1s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaEngine({ metrics, state }) {
  const rows = [
    { k: "Mitigation = (RL×0.55) + (PL×0.35)", v: `${metrics.mitigationEff.toFixed(1)}%`, color: metrics.mitigationEff > 60 ? "#16A34A" : "#D97706" },
    { k: "Raw load = LT + AV×(1 − mit)", v: (state.legitTraffic + state.attackVolume * (1 - metrics.mitigationEff / 100)).toFixed(1), color: "#1D4ED8" },
    { k: "Bandwidth index", v: metrics.bw.toFixed(0), color: metrics.bw > 100 ? "#DC2626" : metrics.bw > 80 ? "#D97706" : "#16A34A" },
    { k: "Downtime cost (sim $)", v: `$${metrics.downtimeCost.toFixed(0)}`, color: "#7C3AED" },
    { k: "Legit users dropped", v: `${metrics.legitDropped.toFixed(1)}%`, color: metrics.legitDropped > 20 ? "#DC2626" : metrics.legitDropped > 10 ? "#D97706" : "#16A34A" },
    { k: "Threat level", v: `${metrics.threatLevel.toFixed(0)}%`, color: metrics.threatLevel > 70 ? "#DC2626" : metrics.threatLevel > 40 ? "#D97706" : "#16A34A" },
    { k: "Defense score", v: `${metrics.defScore.toFixed(0)}/100`, color: metrics.defScore > 75 ? "#16A34A" : metrics.defScore > 50 ? "#3B82F6" : "#DC2626" },
  ];
  return (
    <div>
      <SectionLabel color="#F59E0B">realtime formula engine</SectionLabel>
      <div style={{ border: "1px solid #E2E8F0", borderRadius: 6, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: i % 2 === 0 ? "#FAFAFA" : "#fff", borderBottom: i < rows.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <span style={{ fontSize: 10, color: "#64748B", fontFamily: "'Share Tech Mono',monospace" }}>{r.k}</span>
            <span style={{ fontSize: 11, fontFamily: "'Share Tech Mono',monospace", fontWeight: 700, color: r.color }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsGrid({ metrics }) {
  const cards = [
    { label: "BANDWIDTH INDEX", val: metrics.bw.toFixed(0), sub: metrics.bw > 100 ? "CRITICAL OVERLOAD" : metrics.bw > 80 ? "HIGH LOAD" : "NOMINAL", color: metrics.bw > 100 ? "#DC2626" : metrics.bw > 80 ? "#D97706" : "#3B82F6", bg: metrics.bw > 100 ? "#FEF2F2" : metrics.bw > 80 ? "#FFFBEB" : "#EFF6FF" },
    { label: "DOWNTIME COST (SIM $)", val: `$${metrics.downtimeCost.toFixed(0)}`, sub: "Per incident estimate", color: "#7C3AED", bg: "#F5F3FF" },
    { label: "LEGIT USERS DROPPED", val: `${metrics.legitDropped.toFixed(1)}%`, sub: metrics.legitDropped > 20 ? "UNACCEPTABLE" : metrics.legitDropped > 10 ? "TOLERABLE" : "ACCEPTABLE", color: metrics.legitDropped > 20 ? "#DC2626" : metrics.legitDropped > 10 ? "#D97706" : "#16A34A", bg: metrics.legitDropped > 20 ? "#FEF2F2" : metrics.legitDropped > 10 ? "#FFFBEB" : "#F0FDF4" },
    { label: "MITIGATION EFF.", val: `${metrics.mitigationEff.toFixed(0)}%`, sub: "Rate limit + Patch", color: "#16A34A", bg: "#F0FDF4" },
    { label: "THREAT LEVEL", val: `${metrics.threatLevel.toFixed(0)}%`, sub: metrics.threatLevel > 70 ? "SEVERE" : metrics.threatLevel > 40 ? "ELEVATED" : "CONTAINED", color: metrics.threatLevel > 70 ? "#DC2626" : metrics.threatLevel > 40 ? "#D97706" : "#16A34A", bg: metrics.threatLevel > 70 ? "#FEF2F2" : metrics.threatLevel > 40 ? "#FFFBEB" : "#F0FDF4" },
    { label: "DEFENSE SCORE", val: `${metrics.defScore.toFixed(0)}/100`, sub: metrics.defScore > 75 ? "EXCELLENT" : metrics.defScore > 50 ? "ADEQUATE" : "FAILING", color: metrics.defScore > 75 ? "#16A34A" : metrics.defScore > 50 ? "#3B82F6" : "#DC2626", bg: metrics.defScore > 75 ? "#F0FDF4" : metrics.defScore > 50 ? "#EFF6FF" : "#FEF2F2" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
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

function BandwidthChart({ bwHistory }) {
  const max = Math.max(...bwHistory, 10);
  return (
    <div>
      <SectionLabel color="#3B82F6">bandwidth timeline</SectionLabel>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 8px 4px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 4, right: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#94A3B8" }}>BW INDEX</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
          {bwHistory.map((v, i) => {
            const h = clamp((v / max) * 100, 4, 100);
            const color = v > 100 ? "#DC2626" : v > 80 ? "#D97706" : "#3B82F6";
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

function TopoCanvas({ metrics, state }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 280, 120);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, 280, 120);

    const nodes = {
      inet: { x: 24, y: 60, label: "INTERNET", color: state.attackVolume > 50 ? "#DC2626" : "#94A3B8" },
      scrubber: { x: 90, y: 28, label: "SCRUBBER", color: metrics.mitigationEff > 50 ? "#16A34A" : "#D97706" },
      rateLimit: { x: 90, y: 92, label: "RATE LIM", color: state.rateLimit > 50 ? "#16A34A" : "#D97706" },
      fw: { x: 180, y: 60, label: "FIREWALL", color: state.patchLevel > 50 ? "#16A34A" : "#D97706" },
      server: { x: 252, y: 60, label: "SERVER", color: metrics.bw < 80 ? "#16A34A" : metrics.bw < 100 ? "#D97706" : "#DC2626" },
    };

    const edges = [["inet", "scrubber"], ["inet", "rateLimit"], ["scrubber", "fw"], ["rateLimit", "fw"], ["fw", "server"]];
    edges.forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.strokeStyle = "#CBD5E1"; ctx.lineWidth = 1.5; ctx.stroke();
    });

    if (state.attackVolume > 20) {
      const progress = (Date.now() / 500) % 1;
      const a = nodes.inet, b = nodes.scrubber;
      ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#DC2626"; ctx.fill();
    }

    Object.values(nodes).forEach((n) => {
      ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = n.color + "22"; ctx.fill();
      ctx.strokeStyle = n.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = n.color; ctx.font = "bold 7px 'Share Tech Mono'"; ctx.textAlign = "center";
      ctx.fillText(n.label, n.x, n.y + 22);
    });
  });

  return (
    <div>
      <SectionLabel color="#DC2626">network topology</SectionLabel>
      <canvas ref={canvasRef} width={280} height={120} style={{ border: "1px solid #E2E8F0", borderRadius: 6, display: "block", width: "100%", background: "#F8FAFC" }} />
    </div>
  );
}

function TrafficTable({ state, metrics, tick }) {
  const rows = useMemo(() => {
    const base = Date.now();
    return [
      { ip: `103.42.91.${Math.floor(base / 3000) % 254}`, type: "BOTNET", rps: Math.floor(state.attackVolume * 24 + 30), bw: (state.attackVolume * 0.8 + 5).toFixed(1) + " Mbps", status: "BLOCKED", risk: clamp(state.attackVolume + 12, 0, 99) },
      { ip: `185.220.101.${Math.floor(base / 4000) % 254}`, type: "TOR EXIT", rps: Math.floor(state.attackVolume * 18 + 20), bw: (state.attackVolume * 0.5 + 8).toFixed(1) + " Mbps", status: state.rateLimit > 60 ? "BLOCKED" : "PASSING", risk: clamp(state.attackVolume - 10, 0, 99) },
      { ip: `198.51.100.${Math.floor(base / 5000) % 100}`, type: "LEGIT USER", rps: Math.floor(state.legitTraffic * 2 + 5), bw: (state.legitTraffic * 0.2 + 2).toFixed(1) + " Mbps", status: "ALLOWED", risk: 8 },
      { ip: `203.0.113.${Math.floor(base / 6000) % 254}`, type: "LEGIT USER", rps: Math.floor(state.legitTraffic * 1.5 + 3), bw: (state.legitTraffic * 0.15 + 1).toFixed(1) + " Mbps", status: metrics.legitDropped > 20 ? "DROPPED" : "ALLOWED", risk: 5 },
      { ip: `91.108.${Math.floor(base / 7000) % 254}.1`, type: "UDP AMPLIFY", rps: Math.floor(state.attackVolume * 30 + 60), bw: (state.attackVolume * 1.2 + 15).toFixed(1) + " Mbps", status: state.rateLimit > 40 ? "MITIGATED" : "PASSING", risk: clamp(state.attackVolume + 20, 0, 99) },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, state, metrics]);

  const statusColor = (s) => s === "ALLOWED" ? "#16A34A" : s === "BLOCKED" || s === "MITIGATED" ? "#DC2626" : "#D97706";
  const riskColor = (r) => r > 70 ? "#DC2626" : r > 40 ? "#D97706" : "#16A34A";
  const typeColor = (t) => t.includes("LEGIT") ? "#16A34A" : "#DC2626";

  return (
    <div>
      <SectionLabel color="#F59E0B">live traffic analysis</SectionLabel>
      <div style={{ border: "1px solid #E2E8F0", borderRadius: 6, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["SOURCE IP", "TYPE", "REQ/S", "BANDWIDTH", "STATUS", "RISK SCORE"].map((h) => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 1, color: "#94A3B8", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: typeColor(r.type) }}>{r.ip}</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: typeColor(r.type) }}>{r.type}</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10 }}>{r.rps.toLocaleString()}</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10 }}>{r.bw}</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: statusColor(r.status), fontWeight: 700 }}>{r.status}</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10 }}>
                  <span style={{ color: riskColor(r.risk), fontWeight: 700 }}>{r.risk}</span><span style={{ color: "#94A3B8" }}>/100</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBreakdown({ metrics }) {
  const scores = [
    { label: "Rate Limiting", val: clamp(metrics.mitigationEff * 0.55, 0, 100), color: "#3B82F6" },
    { label: "Patch Coverage", val: clamp(metrics.mitigationEff * 0.35, 0, 100), color: "#16A34A" },
    { label: "Bandwidth Control", val: clamp(100 - metrics.bw, 0, 100), color: "#F59E0B" },
    { label: "User Retention", val: clamp(100 - metrics.legitDropped * 2, 0, 100), color: "#8B5CF6" },
  ];
  return (
    <div>
      <SectionLabel color="#16A34A">defense score breakdown</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
        {scores.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ fontSize: 10, color: "#64748B", width: 110, flexShrink: 0, fontFamily: "'Share Tech Mono',monospace" }}>{s.label}</span>
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
      <div ref={ref} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: 8, height: 110, overflowY: "auto", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, lineHeight: 1.7 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <span style={{ color: "#94A3B8" }}>[{l.ts}] </span>
            <span style={{ color: colorMap[l.type] || "#3B82F6" }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessModal({ metrics, onRestart }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "2px solid #16A34A", borderRadius: 12, padding: "36px 40px", maxWidth: 520, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}>
        <div style={{ display: "inline-block", border: "1px solid #D97706", borderRadius: 4, padding: "4px 14px", marginBottom: 16 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 2, color: "#D97706" }}>THALES CYBERRANGE · MISSION COMPLETE</span>
        </div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: "#15803D", marginBottom: 8 }}>DDoS ATTACK NEUTRALISED</div>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          You successfully configured Thales CyberGuard parameters to protect network infrastructure while maintaining service availability for legitimate users.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Bandwidth Index", val: metrics.bw.toFixed(0), note: "Safe zone" },
            { label: "Legit Dropped", val: `${metrics.legitDropped.toFixed(1)}%`, note: "Minimised" },
            { label: "Mitigation Eff.", val: `${metrics.mitigationEff.toFixed(0)}%`, note: "Achieved" },
            { label: "Defense Score", val: `${metrics.defScore.toFixed(0)}/100`, note: "Final" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: "#15803D", fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#86EFAC" }}>{s.note}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'Share Tech Mono',monospace", marginBottom: 18 }}>
          Key insight: every mitigation choice is an economics trade-off —<br />operator cost vs customer experience. Downtime has a real price tag.
        </p>
        <button onClick={onRestart} style={{ background: "transparent", border: "1.5px solid #3B82F6", color: "#3B82F6", fontFamily: "'Orbitron',sans-serif", fontSize: 11, padding: "10px 28px", cursor: "pointer", letterSpacing: 1, borderRadius: 4 }}>
          ↺ RESTART MISSION
        </button>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ThalesDDoSSimulation() {
  const [state, setState] = useState({ legitTraffic: 55, attackVolume: 45, patchLevel: 40, rateLimit: 35 });
  const [bwHistory, setBwHistory] = useState(() => Array(20).fill(30));
  const [logs, setLogs] = useState([
    { ts: "00:00:00", msg: "Thales CyberRange environment initialised", type: "ok" },
    { ts: "00:00:01", msg: "DDoS scenario loaded: Black Friday flood", type: "info" },
    { ts: "00:00:02", msg: "Attack detected — beginning analysis...", type: "warn" },
  ]);
  const [logIdx, setLogIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [completedOnce, setCompletedOnce] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const frameRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const metrics = useMemo(() => calcMetrics(state), [state]);

  const stepsDone = useMemo(() => {
    const done = new Set();
    STEPS.forEach((st, i) => { if (st.check(state, metrics)) done.add(i); });
    return done;
  }, [state, metrics]);

  useEffect(() => {
    if (stepsDone.size === STEPS.length && !completedOnce) {
      setCompletedOnce(true);
      setTimeout(() => setShowSuccess(true), 600);
    }
  }, [stepsDone, completedOnce]);

  useEffect(() => {
    let raf;
    let lastLog = 0;
    let lastTick = 0;

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (t - lastTick > 150) {
        lastTick = t;
        const m = calcMetrics(stateRef.current);
        setBwHistory((prev) => {
          const next = [...prev.slice(1), clamp(m.bw + (Math.random() - 0.5) * 5, 0, 130)];
          return next;
        });
        setTick((n) => n + 1);
      }
      if (t - lastLog > 3000) {
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
    setState({ legitTraffic: 55, attackVolume: 45, patchLevel: 40, rateLimit: 35 });
    setBwHistory(Array(20).fill(30));
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

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 48px)" }}>
          {/* LEFT */}
          <div style={{ borderRight: "1.5px solid #E2E8F0", background: "#FAFBFC", padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
            <StepTrack state={state} metrics={metrics} />
            <SliderGroup state={state} onChange={handleChange} />
            <FormulaEngine metrics={metrics} state={state} />
            <SocLog logs={logs} />
          </div>

          {/* RIGHT */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
            <MetricsGrid metrics={metrics} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <BandwidthChart bwHistory={bwHistory} />
              <TopoCanvas metrics={metrics} state={state} />
            </div>
            <TrafficTable state={state} metrics={metrics} tick={tick} />
            <ScoreBreakdown metrics={metrics} />
          </div>
        </div>

        {showSuccess && <SuccessModal metrics={metrics} onRestart={handleRestart} />}
      </div>
    </>
  );
}
