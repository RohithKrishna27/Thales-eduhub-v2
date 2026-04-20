import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

const KEY_OPTIONS = [
  { bits: 128, label: "128-bit (AES-128)", color: "#D97706", risk: "Adequate for most use cases" },
  { bits: 256, label: "256-bit (AES-256)", color: "#3B82F6", risk: "Recommended standard" },
  { bits: 512, label: "512-bit (AES-512)", color: "#16A34A", risk: "Military / classified grade" },
];

const STEPS = [
  { id: 0, label: "Select a key length",                 detail: "Choose 128, 256, or 512-bit encryption",                  check: (s) => s.bits !== null },
  { id: 1, label: "Observe brute-force horizon",         detail: "Note how many model-years it takes to crack the key",     check: (s, m) => m.history.length >= 5 },
  { id: 2, label: "Raise traffic load above 60",         detail: "Simulate a busy server to see CPU and latency cost",      check: (s) => s.trafficLoad >= 60 },
  { id: 3, label: "Observe CPU exceed 70%",              detail: "Higher key + load = measurable performance hit",          check: (s, m) => m.cpu >= 70 },
  { id: 4, label: "Switch to 256-bit or higher",         detail: "Balance security and performance for production",         check: (s) => s.bits >= 256 },
  { id: 5, label: "Achieve attack success below 15%",    detail: "Attack success rate < 15% — encryption policy approved",  check: (s, m) => m.attackOk < 15 },
];

const LOG_POOL = [
  ["Brute-force attempt detected — 2.4 billion keys/sec", "err"],
  ["TLS handshake latency within SLA threshold", "ok"],
  ["CPU spike on encryption worker pool — scaling up", "warn"],
  ["Thales HSM: key rotation completed successfully", "ok"],
  ["AES-NI hardware acceleration engaged", "info"],
  ["Side-channel attack probe detected and blocked", "warn"],
  ["Key derivation function (PBKDF2) rounds verified", "info"],
  ["Certificate pinning validation passed on edge node", "ok"],
  ["Entropy pool low — reseeding from hardware RNG", "warn"],
  ["Thales payShield: symmetric key stored in HSM vault", "ok"],
  ["Cipher suite negotiation: TLS 1.3 agreed", "info"],
  ["Memory-hard hash detected in login flow — good", "ok"],
  ["Quantum-resistance audit: current keys flagged for review", "warn"],
  ["Encryption throughput: 14.2 Gbps on current hardware", "info"],
];

function calcMetrics(s, history) {
  const encryptMs = (s.bits / 128) * 1.8 + s.trafficLoad * 0.06;
  const cpu = clamp(18 + s.bits / 12 + s.trafficLoad * 0.35, 10, 99);
  const bruteYears = Math.pow(2, s.bits / 48) * 0.0004;
  const attackOk = s.bits < 200
    ? clamp(55 - s.bits / 6 + s.trafficLoad * 0.1, 5, 95)
    : clamp(8 - s.bits / 80, 0, 20);
  const throughputGbps = clamp(20 - s.trafficLoad * 0.12 - (s.bits / 128) * 1.5, 1, 20);
  const latencyMs = encryptMs + s.trafficLoad * 0.04;
  return { encryptMs, cpu, bruteYears, attackOk, throughputGbps, latencyMs, history };
}

function formatYears(y) {
  if (y >= 1e12) return `${(y / 1e12).toFixed(1)} ×10¹²`;
  if (y >= 1e9)  return `${(y / 1e9).toFixed(1)} ×10⁹`;
  if (y >= 1e6)  return `${(y / 1e6).toFixed(1)} ×10⁶`;
  return y.toFixed(0);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TopBar({ metrics, state }) {
  const keyOpt = KEY_OPTIONS.find((k) => k.bits === state.bits);
  const safe = metrics.attackOk < 15;
  const risky = metrics.attackOk > 50;
  return (
    <div style={{ background: "#F8F9FB", borderBottom: "1.5px solid #E2E8F0", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "#C8102E", color: "#fff", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, padding: "5px 12px", letterSpacing: 2, borderRadius: 3 }}>THALES</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: "#1E40AF", letterSpacing: 1, fontWeight: 600 }}>CYBERRANGE · ENCRYPTION STRENGTH vs PERFORMANCE</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: `1px solid ${keyOpt.color}`, color: keyOpt.color, background: keyOpt.color + "14" }}>🔑 KEY: {state.bits}-BIT</span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: `1px solid ${safe ? "#16A34A" : risky ? "#DC2626" : "#D97706"}`, color: safe ? "#16A34A" : risky ? "#DC2626" : "#D97706", background: (safe ? "#16A34A" : risky ? "#DC2626" : "#D97706") + "14" }}>
          ● {safe ? "POLICY APPROVED" : risky ? "INSUFFICIENT SECURITY" : "EVALUATING"}
        </span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, border: "1px solid #1D4ED8", color: "#1D4ED8", background: "#EFF6FF" }}>● HSM ONLINE</span>
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

function KeySelector({ bits, onChange }) {
  return (
    <div>
      <SectionLabel color="#7C3AED">symmetric key length</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {KEY_OPTIONS.map((k) => (
          <button key={k.bits} onClick={() => onChange(k.bits)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, border: `1.5px solid ${bits === k.bits ? k.color : "#E2E8F0"}`, background: bits === k.bits ? k.color + "0D" : "#FAFAFA", cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: k.color + "22", border: `1px solid ${k.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🔑</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: bits === k.bits ? k.color : "#374151" }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{k.risk}</div>
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: k.color, flexShrink: 0 }}>{k.bits}-BIT</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrafficSlider({ trafficLoad, onChange }) {
  const color = trafficLoad > 70 ? "#DC2626" : trafficLoad > 40 ? "#D97706" : "#3B82F6";
  return (
    <div>
      <SectionLabel color="#3B82F6">traffic load</SectionLabel>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Server traffic load</span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color, fontWeight: 700 }}>{trafficLoad}%</span>
      </div>
      <input type="range" min={0} max={100} step={1} value={trafficLoad} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
      <div style={{ height: 3, background: "#E2E8F0", borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${trafficLoad}%`, background: color, borderRadius: 2, transition: "width .1s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#94A3B8", fontFamily: "'Share Tech Mono',monospace" }}>
        <span>IDLE</span><span>MODERATE</span><span>PEAK LOAD</span>
      </div>
    </div>
  );
}

function FormulaEngine({ metrics, state }) {
  const rows = [
    { k: "Encrypt time = (bits/128)×1.8 + load×0.06", v: `${metrics.encryptMs.toFixed(2)} ms`, color: metrics.encryptMs > 5 ? "#D97706" : "#3B82F6" },
    { k: "CPU = 18 + bits/12 + load×0.35", v: `${metrics.cpu.toFixed(0)}%`, color: metrics.cpu > 80 ? "#DC2626" : metrics.cpu > 60 ? "#D97706" : "#16A34A" },
    { k: "Brute-force horizon (model years)", v: formatYears(metrics.bruteYears), color: "#16A34A" },
    { k: "Attack success rate", v: `${metrics.attackOk.toFixed(1)}%`, color: metrics.attackOk > 40 ? "#DC2626" : metrics.attackOk > 15 ? "#D97706" : "#16A34A" },
    { k: "Throughput (Gbps)", v: `${metrics.throughputGbps.toFixed(1)} Gbps`, color: metrics.throughputGbps > 10 ? "#16A34A" : metrics.throughputGbps > 5 ? "#D97706" : "#DC2626" },
    { k: "Total latency", v: `${metrics.latencyMs.toFixed(2)} ms`, color: metrics.latencyMs > 8 ? "#D97706" : "#3B82F6" },
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

function MetricsGrid({ metrics, state }) {
  const cards = [
    { label: "ENCRYPT LATENCY", val: `${metrics.encryptMs.toFixed(2)} ms`, sub: metrics.encryptMs > 5 ? "NOTICEABLE DELAY" : "WITHIN SLA", color: metrics.encryptMs > 5 ? "#D97706" : "#3B82F6", bg: metrics.encryptMs > 5 ? "#FFFBEB" : "#EFF6FF" },
    { label: "CPU USAGE", val: `${metrics.cpu.toFixed(0)}%`, sub: metrics.cpu > 80 ? "OVERLOADED" : metrics.cpu > 60 ? "ELEVATED" : "NOMINAL", color: metrics.cpu > 80 ? "#DC2626" : metrics.cpu > 60 ? "#D97706" : "#16A34A", bg: metrics.cpu > 80 ? "#FEF2F2" : metrics.cpu > 60 ? "#FFFBEB" : "#F0FDF4" },
    { label: "ATTACK SUCCESS", val: `${metrics.attackOk.toFixed(0)}%`, sub: metrics.attackOk < 15 ? "POLICY APPROVED" : metrics.attackOk < 40 ? "MARGINAL" : "INSECURE", color: metrics.attackOk < 15 ? "#16A34A" : metrics.attackOk < 40 ? "#D97706" : "#DC2626", bg: metrics.attackOk < 15 ? "#F0FDF4" : metrics.attackOk < 40 ? "#FFFBEB" : "#FEF2F2" },
    { label: "BRUTE-FORCE HORIZON", val: formatYears(metrics.bruteYears), sub: "Model years to crack", color: "#16A34A", bg: "#F0FDF4" },
    { label: "THROUGHPUT", val: `${metrics.throughputGbps.toFixed(1)} Gbps`, sub: metrics.throughputGbps > 10 ? "HIGH PERFORMANCE" : "REDUCED", color: metrics.throughputGbps > 10 ? "#16A34A" : "#D97706", bg: metrics.throughputGbps > 10 ? "#F0FDF4" : "#FFFBEB" },
    { label: "KEY STRENGTH", val: `${state.bits}-bit`, sub: KEY_OPTIONS.find(k => k.bits === state.bits)?.risk, color: state.bits >= 256 ? "#16A34A" : "#D97706", bg: state.bits >= 256 ? "#F0FDF4" : "#FFFBEB" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.color}22`, borderLeft: `3px solid ${c.color}`, borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: c.color }}>{c.val}</div>
          <div style={{ fontSize: 9, color: c.color + "AA", marginTop: 2, fontWeight: 600 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function CpuChart({ history }) {
  return (
    <div>
      <SectionLabel color="#F59E0B">cpu usage timeline</SectionLabel>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 8px 4px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
          {history.map((v, i) => {
            const h = clamp((v / 100) * 100, 2, 100);
            const color = v > 80 ? "#DC2626" : v > 60 ? "#D97706" : "#3B82F6";
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

function KeyComparisonTable({ state, metrics }) {
  const rows = KEY_OPTIONS.map((k) => {
    const s = { bits: k.bits, trafficLoad: state.trafficLoad };
    const m = calcMetrics(s, []);
    return { ...k, encMs: m.encryptMs, cpu: m.cpu, atk: m.attackOk, bf: m.bruteYears, current: k.bits === state.bits };
  });

  return (
    <div>
      <SectionLabel color="#7C3AED">key length comparison — at current traffic load</SectionLabel>
      <div style={{ border: "1px solid #E2E8F0", borderRadius: 6, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["KEY LENGTH", "LATENCY", "CPU %", "ATTACK SUCCESS", "BRUTE-FORCE HORIZON", "VERDICT"].map((h) => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 1, color: "#94A3B8", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: r.current ? r.color + "0A" : i % 2 === 0 ? "#fff" : "#FAFAFA", borderLeft: r.current ? `3px solid ${r.color}` : "3px solid transparent" }}>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.color, fontWeight: r.current ? 700 : 400 }}>{r.label}</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.encMs > 5 ? "#D97706" : "#374151" }}>{r.encMs.toFixed(2)} ms</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.cpu > 80 ? "#DC2626" : r.cpu > 60 ? "#D97706" : "#16A34A", fontWeight: 700 }}>{r.cpu.toFixed(0)}%</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.atk < 15 ? "#16A34A" : r.atk < 40 ? "#D97706" : "#DC2626", fontWeight: 700 }}>{r.atk.toFixed(1)}%</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#16A34A" }}>{formatYears(r.bf)} yrs</td>
                <td style={{ padding: "5px 10px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: r.current ? r.color : "#94A3B8", fontWeight: r.current ? 700 : 400 }}>{r.current ? "▶ ACTIVE" : r.bits >= 256 ? "RECOMMENDED" : "WEAK"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBreakdown({ metrics, state }) {
  const scores = [
    { label: "Key strength",      val: clamp((state.bits / 512) * 100, 0, 100),           color: "#16A34A" },
    { label: "Performance",       val: clamp(100 - metrics.cpu, 0, 100),                   color: "#3B82F6" },
    { label: "Attack resistance", val: clamp(100 - metrics.attackOk, 0, 100),              color: "#7C3AED" },
    { label: "Throughput",        val: clamp((metrics.throughputGbps / 20) * 100, 0, 100), color: "#D97706" },
  ];
  return (
    <div>
      <SectionLabel color="#16A34A">policy score breakdown</SectionLabel>
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
      <SectionLabel color="#94A3B8">hsm / crypto event log</SectionLabel>
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
  const keyOpt = KEY_OPTIONS.find((k) => k.bits === state.bits);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "2px solid #16A34A", borderRadius: 12, padding: "36px 40px", maxWidth: 520, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.1)" }}>
        <div style={{ display: "inline-block", border: "1px solid #D97706", borderRadius: 4, padding: "4px 14px", marginBottom: 16 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 2, color: "#D97706" }}>THALES CYBERRANGE · MISSION COMPLETE</span>
        </div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: "#15803D", marginBottom: 8 }}>ENCRYPTION POLICY APPROVED</div>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          You selected <strong style={{ color: keyOpt.color }}>{keyOpt.label}</strong> and balanced security strength against CPU cost and latency — achieving an attack success rate below 15%.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Key Length",      val: `${state.bits}-bit`,                     note: keyOpt.risk },
            { label: "Attack Success",  val: `${metrics.attackOk.toFixed(1)}%`,        note: "Below threshold" },
            { label: "CPU Usage",       val: `${metrics.cpu.toFixed(0)}%`,             note: "Within limits" },
            { label: "Brute-Force",     val: formatYears(metrics.bruteYears) + " yrs", note: "Horizon" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, color: "#15803D", fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#86EFAC" }}>{s.note}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'Share Tech Mono',monospace", marginBottom: 18 }}>
          Key insight: stronger keys dramatically extend brute-force time,<br />but every extra bit costs measurable CPU and milliseconds.
        </p>
        <button onClick={onRestart} style={{ background: "transparent", border: "1.5px solid #3B82F6", color: "#3B82F6", fontFamily: "'Orbitron',sans-serif", fontSize: 11, padding: "10px 28px", cursor: "pointer", letterSpacing: 1, borderRadius: 4 }}>
          ↺ RESTART MISSION
        </button>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function ThalesEncryptionPerformance() {
  const [state, setState] = useState({ bits: 128, trafficLoad: 40 });
  const [cpuHistory, setCpuHistory] = useState(() => Array(20).fill(30));
  const [logs, setLogs] = useState([
    { ts: "00:00:00", msg: "Thales CyberRange encryption lab initialised", type: "ok" },
    { ts: "00:00:01", msg: "AES engine ready — select key length to begin", type: "info" },
    { ts: "00:00:02", msg: "Brute-force simulation attacker standing by", type: "warn" },
  ]);
  const [logIdx, setLogIdx] = useState(0);
  const [historyTicks, setHistoryTicks] = useState(0);
  const [completedOnce, setCompletedOnce] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const metrics = useMemo(() => calcMetrics(state, cpuHistory), [state, cpuHistory]);

  const stepsDone = useMemo(() => {
    const done = new Set();
    STEPS.forEach((st, i) => { if (st.check(state, { ...metrics, history: cpuHistory })) done.add(i); });
    return done;
  }, [state, metrics, cpuHistory]);

  useEffect(() => {
    if (stepsDone.size === STEPS.length && !completedOnce) {
      setCompletedOnce(true);
      setTimeout(() => setShowSuccess(true), 600);
    }
  }, [stepsDone, completedOnce]);

  useEffect(() => {
    let raf, lastTick = 0, lastLog = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (t - lastTick > 160) {
        lastTick = t;
        const m = calcMetrics(stateRef.current, []);
        setCpuHistory((prev) => [...prev.slice(1), clamp(m.cpu + (Math.random() - 0.5) * 4, 0, 99)]);
        setHistoryTicks((n) => n + 1);
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
    setState({ bits: 128, trafficLoad: 40 });
    setCpuHistory(Array(20).fill(30));
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
          <div style={{ borderRight: "1.5px solid #E2E8F0", background: "#FAFBFC", padding: 16, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
            <StepTrack state={state} metrics={{ ...metrics, history: cpuHistory }} />
            <KeySelector bits={state.bits} onChange={(v) => handleChange("bits", v)} />
            <TrafficSlider trafficLoad={state.trafficLoad} onChange={(v) => handleChange("trafficLoad", v)} />
            <FormulaEngine metrics={metrics} state={state} />
            <SocLog logs={logs} />
          </div>

          {/* RIGHT */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
            <MetricsGrid metrics={metrics} state={state} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <CpuChart history={cpuHistory} />
              <ScoreBreakdown metrics={metrics} state={state} />
            </div>
            <KeyComparisonTable state={state} metrics={metrics} />
          </div>
        </div>

        {showSuccess && <SuccessModal metrics={metrics} state={state} onRestart={handleRestart} />}
      </div>
    </>
  );
}