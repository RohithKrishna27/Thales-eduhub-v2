import { useState, useRef, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL   = "gemini-flash-latest"; // ✅ Fixed: matches the endpoint

// ── HELPERS ───────────────────────────────────────────────────────────────────
const flatExps = (experiments = {}) => {
  const out = [];
  Object.entries(experiments).forEach(([subject, arr]) => {
    if (Array.isArray(arr)) {
      arr.forEach(e => out.push({ ...e, subject }));
    }
  });
  return out;
};

const grade = s => {
  if (s == null) return "—";
  if (s >= 90) return "S";
  if (s >= 80) return "A";
  if (s >= 70) return "B";
  if (s >= 60) return "C";
  return "D";
};

const gradeColor = g =>
  ({ S: "#10b981", A: "#2563eb", B: "#7c3aed", C: "#d97706", D: "#dc2626", "—": "#9ca3af" })[g] || "#9ca3af";

const subColor = s =>
  ({ physics: "#0ea5e9", chemistry: "#f97316", biology: "#22c55e", mathematics: "#a855f7" })[s] || "#6b7280";

const calcAvg = (exps) => {
  const scores = exps.filter(e => e.completed && e.score != null).map(e => e.score);
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
};

const totalMinutes = (sessions = []) =>
  sessions.reduce((acc, s) => {
    if (!s.timeSpentFormatted) return acc;
    const parts = s.timeSpentFormatted.split(":").map(Number);
    return acc + (parts[0] || 0) + Math.round((parts[1] || 0) / 60);
  }, 0);

// ── CARD COMPONENTS ───────────────────────────────────────────────────────────
const StatsCard = ({ student, exps, sessions }) => {
  const done = exps.filter(e => e.completed);
  const avg  = calcAvg(exps);
  const ovG  = grade(avg);
  const mins = totalMinutes(sessions);

  const stats = [
    { label: "Total Labs",    val: exps.length,              icon: "🔬", color: "#0ea5e9" },
    { label: "Completed",     val: done.length,              icon: "✅", color: "#22c55e" },
    { label: "Avg Score",     val: avg != null ? `${avg}%` : "—", icon: "🎯", color: "#7c3aed" },
    { label: "Overall Grade", val: ovG,                      icon: "🏆", color: gradeColor(ovG) },
    { label: "Time Studied",  val: mins ? `${mins}m` : "—", icon: "⏱",  color: "#0ea5e9" },
    { label: "Sessions",      val: sessions.length,          icon: "📅", color: "#f97316" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, margin: "6px 0" }}>
      {stats.map(({ label, val, icon, color }) => (
        <div key={label} style={{
          background: `${color}08`,
          border: `1.5px solid ${color}22`,
          borderRadius: 12,
          padding: "12px 14px",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'DM Mono',monospace" }}>{val}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{icon} {label}</div>
        </div>
      ))}
    </div>
  );
};

const LabsCard = ({ exps }) => {
  const bySubject = {};
  exps.forEach(e => {
    if (!bySubject[e.subject]) bySubject[e.subject] = [];
    bySubject[e.subject].push(e);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0" }}>
      {Object.entries(bySubject).map(([sub, arr]) => (
        <div key={sub} style={{
          background: "#fff",
          border: `1.5px solid ${subColor(sub)}22`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <div style={{
            padding: "8px 14px",
            background: `${subColor(sub)}10`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${subColor(sub)}18`
          }}>
            <span style={{ fontWeight: 700, color: subColor(sub), textTransform: "capitalize", fontSize: 13 }}>{sub}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{arr.filter(e => e.completed).length}/{arr.length} done</span>
          </div>
          {arr.map(e => (
            <div key={e.id} style={{
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f3f4f6"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{e.completed ? "✅" : "⏳"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{e.difficulty} · {e.duration}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {e.completed && e.score != null ? (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 16, color: gradeColor(grade(e.score)) }}>{grade(e.score)}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{e.score}%</div>
                  </>
                ) : e.completed ? (
                  <span style={{ fontSize: 11, color: "#22c55e", padding: "2px 8px", border: "1px solid #22c55e40", borderRadius: 999 }}>Done</span>
                ) : (
                  <span style={{ fontSize: 11, color: "#9ca3af", padding: "2px 8px", border: "1px solid #e5e7eb", borderRadius: 999 }}>Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const SessionsCard = ({ sessions }) => {
  const mins = totalMinutes(sessions);
  if (!sessions.length) return (
    <div style={{ padding: 16, color: "#9ca3af", fontSize: 13, textAlign: "center" }}>No sessions recorded yet.</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0" }}>
      {sessions.map((s, i) => (
        <div key={i} style={{
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: i === 0 ? "#dcfce7" : "#f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${i === 0 ? "#22c55e40" : "#e5e7eb"}`
            }}>
              <span style={{ fontSize: 14 }}>{i === 0 ? "🟢" : "⚫"}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                {s.page ? s.page.replace(/([A-Z])/g, " $1").trim() : "—"}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.subject} · {s.date} at {s.time}</div>
            </div>
          </div>
          <div style={{ fontWeight: 700, color: "#0ea5e9", fontSize: 14 }}>⏱ {s.timeSpentFormatted}</div>
        </div>
      ))}
      <div style={{
        background: "#f0f9ff",
        border: "1.5px solid #bae6fd",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        gap: 24
      }}>
        {[
          ["Sessions", sessions.length, "#0ea5e9"],
          ["Total Time", mins ? `${mins}m` : "—", "#22c55e"],
          ["Avg/Session", sessions.length ? `${Math.round(mins / sessions.length)}m` : "—", "#7c3aed"]
        ].map(([l, v, c]) => (
          <div key={l}>
            <div style={{ fontSize: 20, fontWeight: 800, color: c, fontFamily: "'DM Mono',monospace" }}>{v}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarksCard = ({ student, exps, onDownload }) => {
  const done = exps.filter(e => e.completed);
  const avg  = calcAvg(exps);
  const ovG  = grade(avg);

  return (
    <div style={{ margin: "6px 0" }}>
      <div style={{
        background: "#fff",
        border: "1.5px solid #e0e7ff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(99,102,241,0.08)"
      }}>
        <div style={{
          background: "linear-gradient(135deg,#1e1b4b,#312e81)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>📋 Academic Marks Card</div>
            <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>
              {student.name} · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: gradeColor(ovG) }}>{ovG}</div>
            <div style={{ fontSize: 11, color: "#a5b4fc" }}>Overall · {avg != null ? `${avg}%` : "—"}</div>
          </div>
        </div>
        <div>
          {exps.map(e => (
            <div key={e.id} style={{
              padding: "10px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f3f4f6"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{e.title}</div>
                <div style={{ fontSize: 11, color: subColor(e.subject), textTransform: "capitalize" }}>{e.subject}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{e.duration}</span>
                <div style={{ textAlign: "right", minWidth: 50 }}>
                  {e.completed && e.score != null ? (
                    <>
                      <div style={{ fontWeight: 800, fontSize: 15, color: gradeColor(grade(e.score)) }}>{grade(e.score)}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{e.score}%</div>
                    </>
                  ) : e.completed ? (
                    <span style={{ fontSize: 11, color: "#22c55e" }}>✓ Done</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#9ca3af", padding: "2px 8px", border: "1px solid #e5e7eb", borderRadius: 999 }}>Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          padding: "12px 20px",
          background: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            ✅ {done.length} completed · ⏳ {exps.length - done.length} pending
          </div>
          <button
            onClick={onDownload}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg,#059669,#0891b2)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            ⬇ Download
          </button>
        </div>
      </div>
    </div>
  );
};

// ── GEMINI CALL ───────────────────────────────────────────────────────────────
const callGemini = async (student, exps, sessions, history, userMsg) => {
  const done    = exps.filter(e => e.completed);
  const pending = exps.filter(e => !e.completed).map(e => e.title).join(", ") || "None";
  const avg     = calcAvg(exps);
  const ovG     = grade(avg);
  const mins    = totalMinutes(sessions);

  const systemContext = `You are "Thales", a warm, expert, encouraging AI class teacher for Thales Learning Platform.

You have full access to ${student.name}'s academic data:
- Completed labs (${done.length}/${exps.length}): ${done.map(e => `${e.title} [${e.subject}${e.score != null ? `, ${e.score}%, ${grade(e.score)}` : ", no score yet"}]`).join("; ") || "None"}
- Pending labs: ${pending}
- Average score: ${avg != null ? `${avg}%` : "N/A"}, Overall grade: ${ovG}
- Study sessions: ${sessions.length} sessions, ~${mins} total minutes
- Student email: ${student.email}
- Role: ${student.role || "student"}

Your personality: A caring, knowledgeable teacher who knows this student personally. Reference their specific data naturally in responses.

Rules:
- Keep answers concise but warm and personal
- When giving career advice, reference their subject strengths
- When suggesting next steps, reference their actual pending labs
- Use light emojis, never excessive
- If user wants to see stats/overview, say exactly: SHOW_STATS on its own line
- If user wants to see labs/experiments, say exactly: SHOW_LABS on its own line
- If user wants to see sessions/login history, say exactly: SHOW_SESSIONS on its own line
- If user wants marks card/report card, say exactly: SHOW_MARKSCARD on its own line
- For downloads say exactly: DOWNLOAD_MARKS on its own line
- These trigger words must be alone on their line, no other text on that line
- Otherwise reply naturally as a warm teacher`;

  const contents = [
    ...history
      .filter(m => m.text && !(m.cards && m.cards.length && !m.text.trim()))
      .map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.text }]
      })),
    { role: "user", parts: [{ text: userMsg }] }
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemContext }] },
        contents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 900 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not fetch a response. Please try again.";
};

// ── MARKS DOWNLOAD ────────────────────────────────────────────────────────────
const downloadMarksCard = (student, exps) => {
  const done = exps.filter(e => e.completed);
  const avg  = calcAvg(exps);
  const ovG  = grade(avg);

  const rows = exps.map(e => `
    <tr>
      <td>${e.title}</td>
      <td style="text-transform:capitalize;color:${subColor(e.subject)}">${e.subject}</td>
      <td>${e.difficulty}</td>
      <td style="font-weight:700">${e.completed && e.score != null ? `${e.score}%` : e.completed ? "Done" : "Not attempted"}</td>
      <td style="font-weight:800;color:${gradeColor(grade(e.score))};font-size:18px">${e.completed ? grade(e.score) : "—"}</td>
      <td>${e.completed ? '<span style="color:#10b981">✓ Complete</span>' : '<span style="color:#6b7280">⏳ Pending</span>'}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Marks Card – ${student.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;background:#f0f4f8;padding:40px;color:#1e293b}
  .wrap{max-width:860px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.12)}
  .top{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:36px 40px;display:flex;justify-content:space-between;align-items:center}
  .school{font-family:'DM Serif Display',serif;font-size:26px}
  .sub{font-size:12px;opacity:.6;margin-top:4px;letter-spacing:1.5px;text-transform:uppercase}
  .sname{font-family:'DM Serif Display',serif;font-size:20px}
  .smeta{font-size:12px;opacity:.6;margin-top:6px}
  .body{padding:36px 40px}
  h2{font-family:'DM Serif Display',serif;font-size:18px;margin-bottom:18px;border-bottom:2px solid #e2e8f0;padding-bottom:10px}
  table{width:100%;border-collapse:collapse}
  th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;font-weight:600}
  td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:14px}
  .summ{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px}
  .sbox{background:#f8fafc;border-radius:12px;padding:18px;text-align:center}
  .sv{font-family:'DM Serif Display',serif;font-size:32px;color:#0f172a}
  .sl{font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
  .foot{background:#f8fafc;padding:16px 40px;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div><div class="school">🎓 Thales Learning Platform</div><div class="sub">Academic Performance Report · ${new Date().getFullYear()}</div></div>
    <div style="text-align:right"><div class="sname">${student.name}</div><div class="smeta">${student.email}<br/>Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
  </div>
  <div class="body">
    <h2>Laboratory Experiment Results</h2>
    <table><thead><tr><th>Experiment</th><th>Subject</th><th>Difficulty</th><th>Score</th><th>Grade</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="summ">
      <div class="sbox"><div class="sv">${done.length}/${exps.length}</div><div class="sl">Labs Completed</div></div>
      <div class="sbox"><div class="sv">${avg != null ? `${avg}%` : "—"}</div><div class="sl">Average Score</div></div>
      <div class="sbox"><div class="sv" style="color:${gradeColor(ovG)}">${ovG}</div><div class="sl">Overall Grade</div></div>
    </div>
  </div>
  <div class="foot"><span>Computer-generated by Thales Learning Platform</span><span>Verified · ${new Date().toISOString().split("T")[0]}</span></div>
</div></body></html>`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = `${student.name.replace(/\s+/g, "_")}_MarksCard.html`;
  a.click();
};

// ── QUICK ACTIONS ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "📊 My Progress",    msg: "Show me my overall performance stats" },
  { label: "🔬 All Labs",       msg: "Show me all my lab experiments" },
  { label: "🕐 Session History",msg: "Show my study session history" },
  { label: "📋 Marks Card",     msg: "Show my marks card" },
  { label: "🎯 What's next?",   msg: "What should I study next based on my performance?" },
  { label: "🚀 Career Guide",   msg: "Give me career guidance based on my subjects and scores" },
  { label: "📈 Improve scores", msg: "How can I improve my scores?" },
  { label: "💡 Study plan",     msg: "Create a weekly study plan for me" },
];

// ── PARSE AI RESPONSE ─────────────────────────────────────────────────────────
const parseResponse = (text) => {
  const lines     = text.split("\n");
  const cards     = [];
  const cleanLines = [];
  let triggerDownload = false;

  lines.forEach(line => {
    const t = line.trim();
    if (t === "SHOW_STATS")      cards.push("stats");
    else if (t === "SHOW_LABS")  cards.push("labs");
    else if (t === "SHOW_SESSIONS") cards.push("sessions");
    else if (t === "SHOW_MARKSCARD") cards.push("markscard");
    else if (t === "DOWNLOAD_MARKS") triggerDownload = true;
    else cleanLines.push(line);
  });

  return { cleanText: cleanLines.join("\n").trim(), cards, triggerDownload };
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ThalesClassTeacherAI() {
  const [student,  setStudent]  = useState(null);
  const [exps,     setExps]     = useState([]);
  const [sessions, setSessions] = useState([]);
  const [fetchErr, setFetchErr] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [sideOpen, setSideOpen] = useState(true);

  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // ── Fetch from Firebase ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFetchErr("Not logged in. Please sign in to continue.");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setFetchErr("Could not fetch: student profile not found.");
          return;
        }
        const data = snap.data();

        const profile = {
          name:      data.name     || "Student",
          email:     data.email    || "",
          photoURL:  data.photoURL || "",
          role:      data.role     || "student",
          uid:       data.uid      || user.uid,
          totalCompleted: data.totalCompleted || 0,
        };

        let expsList = [];
        const labExpDoc = data.LabExperiment?.experiments || data.experiments || {};
        expsList = flatExps(labExpDoc);

        const enrolled = data.Enrolled_labs || [];
        enrolled.forEach(entry => {
          const entryExps = flatExps(entry.experiments || {});
          entryExps.forEach(ee => {
            const found = expsList.find(e => e.id === ee.id);
            if (found) {
              if (ee.score != null && found.score == null) found.score = ee.score;
              if (ee.completed) found.completed = true;
            }
          });
        });

        const sess = Array.isArray(data.learningSessions)
          ? data.learningSessions
          : [];

        setStudent(profile);
        setExps(expsList);
        setSessions(sess);

        const done   = expsList.filter(e => e.completed);
        const avg    = calcAvg(expsList);
        setMessages([{
          role:      "ai",
          text:      `Hello ${profile.name.split(" ")[0]}! 👋\n\nI'm **Thales**, your personal AI class teacher. I can see all your academic data and I'm here to help you grow.\n\nQuick snapshot: you've completed **${done.length} lab${done.length !== 1 ? "s" : ""}** so far${avg != null ? ` with an average score of **${avg}%**` : ""}. Let's make it even better! ✨\n\nAsk me anything — stats, career guidance, study plans, or explanations of your experiments.`,
          timestamp: new Date()
        }]);
      } catch (err) {
        console.error(err);
        setFetchErr(`Could not fetch: ${err.message}`);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const send = async (msg) => {
    const userText = (msg || input).trim();
    if (!userText || loading || !student) return;
    setInput("");

    setMessages(prev => [...prev, { role: "user", text: userText, timestamp: new Date() }]);
    setLoading(true);

    try {
      const raw = await callGemini(student, exps, sessions, messages, userText);
      const { cleanText, cards, triggerDownload } = parseResponse(raw);
      if (triggerDownload) downloadMarksCard(student, exps);
      setMessages(prev => [...prev, { role: "ai", text: cleanText, cards, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "ai",
        text: `⚠️ Could not fetch a response: ${err.message}. Please try again.`,
        timestamp: new Date()
      }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── ERROR STATE ───────────────────────────────────────────────────────────
  if (fetchErr) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans','Segoe UI',sans-serif"
      }}>
        <div style={{
          background: "#fff", border: "1.5px solid #fee2e2",
          borderRadius: 16, padding: "32px 40px", maxWidth: 400, textAlign: "center",
          boxShadow: "0 4px 24px rgba(220,38,38,.08)"
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 8 }}>Could not fetch data</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>{fetchErr}</div>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (!student) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans','Segoe UI',sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e5e7eb",
            borderTop: "3px solid #6366f1", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <div style={{ color: "#6b7280", fontSize: 14 }}>Fetching your data…</div>
        </div>
      </div>
    );
  }

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff`;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "#f8fafc",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      color: "#111827", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin { to { transform:rotate(360deg) } }
        .msg-enter { animation: fadeUp .3s ease both }
        .dot { width:7px; height:7px; border-radius:50%; background:#6366f1; animation:pulse 1s infinite }
        .dot:nth-child(2) { animation-delay:.2s }
        .dot:nth-child(3) { animation-delay:.4s }
        .side-btn:hover { background:#f1f5f9 !important; color:#111827 !important }
        .chip-btn:hover { background:#ede9fe !important; border-color:#c4b5fd !important; color:#7c3aed !important }
        .send-btn:hover { transform:scale(1.05) }
        textarea:focus { outline:none }
        .msg-text strong { color:#4f46e5; font-weight:700 }
        .msg-text em { color:#6b7280 }
      `}</style>

      {/* ── SIDEBAR ── */}
      {sideOpen && (
        <aside style={{
          width: 260, background: "#fff",
          borderRight: "1.5px solid #e5e7eb",
          display: "flex", flexDirection: "column", flexShrink: 0
        }}>
          {/* Profile */}
          <div style={{ padding: "20px 16px", borderBottom: "1.5px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img
                src={student.photoURL || avatarFallback}
                alt=""
                style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #e0e7ff", objectFit: "cover" }}
                onError={e => { e.target.src = avatarFallback; }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", lineHeight: 1.2 }}>{student.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {student.role} · Grade {grade(calcAvg(exps))}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["Labs Done", `${exps.filter(e => e.completed).length}/${exps.length}`, "#22c55e"],
                ["Avg Score", calcAvg(exps) != null ? `${calcAvg(exps)}%` : "—", "#7c3aed"]
              ].map(([l, v, c]) => (
                <div key={l} style={{
                  background: "#f9fafb", border: "1.5px solid #e5e7eb",
                  borderRadius: 8, padding: "8px 10px"
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: c, fontFamily: "'DM Mono',monospace" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: "14px 16px 6px", fontSize: 10, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>
            Quick Actions
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 10px" }}>
            {QUICK_ACTIONS.map(({ label, msg }) => (
              <button
                key={label}
                className="side-btn"
                onClick={() => send(msg)}
                disabled={loading}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 10px",
                  background: "transparent", border: "none", borderRadius: 8,
                  color: "#6b7280", fontSize: 13, cursor: "pointer",
                  marginBottom: 2, transition: "all .15s", display: "flex",
                  alignItems: "center", gap: 6
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 16px", borderTop: "1.5px solid #f3f4f6",
            fontSize: 11, color: "#d1d5db", display: "flex", alignItems: "center", gap: 6
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            Powered by Gemini AI
          </div>
        </aside>
      )}

      {/* ── MAIN CHAT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#f8fafc" }}>

        {/* Header */}
        <div style={{
          padding: "12px 20px", borderBottom: "1.5px solid #e5e7eb",
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <button
            onClick={() => setSideOpen(p => !p)}
            style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px 6px", borderRadius: 6, fontSize: 18 }}
          >
            ☰
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0
          }}>
            🎓
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Thales Class Teacher</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Your AI academic advisor · Always here for you</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#22c55e" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            Online
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map((msg, i) => (
            <div key={i} className="msg-enter" style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: 10, alignItems: "flex-start"
            }}>
              {/* AI avatar */}
              {msg.role === "ai" && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0, marginTop: 2
                }}>🎓</div>
              )}

              <div style={{
                maxWidth: "76%", display: "flex", flexDirection: "column", gap: 8,
                alignItems: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                {/* Text bubble */}
                {msg.text && (
                  <div
                    className="msg-text"
                    style={{
                      padding: "12px 16px",
                      borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                      background: msg.role === "ai" ? "#fff" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                      border: msg.role === "ai" ? "1.5px solid #e5e7eb" : "none",
                      boxShadow: msg.role === "ai" ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(99,102,241,0.25)",
                      fontSize: 14, lineHeight: 1.7,
                      color: msg.role === "ai" ? "#374151" : "#fff",
                      whiteSpace: "pre-wrap", wordBreak: "break-word"
                    }}
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.+?)\*/g, "<em>$1</em>")
                    }}
                  />
                )}

                {/* Rich cards */}
                {msg.cards && msg.cards.map(card => (
                  <div key={card} style={{ width: "100%", maxWidth: 520 }}>
                    {card === "stats"     && <StatsCard student={student} exps={exps} sessions={sessions} />}
                    {card === "labs"      && <LabsCard exps={exps} />}
                    {card === "sessions"  && <SessionsCard sessions={sessions} />}
                    {card === "markscard" && <MarksCard student={student} exps={exps} onDownload={() => downloadMarksCard(student, exps)} />}
                  </div>
                ))}

                {/* Timestamp */}
                <div style={{ fontSize: 10, color: "#d1d5db" }}>
                  {msg.timestamp?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* User avatar */}
              {msg.role === "user" && (
                <img
                  src={student.photoURL || avatarFallback}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #e0e7ff", objectFit: "cover", flexShrink: 0, marginTop: 2 }}
                  onError={e => { e.target.src = avatarFallback; }}
                />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg-enter" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
              }}>🎓</div>
              <div style={{
                padding: "14px 18px", background: "#fff",
                border: "1.5px solid #e5e7eb", borderRadius: "4px 16px 16px 16px",
                display: "flex", gap: 5, alignItems: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
              }}>
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick chips */}
        <div style={{ padding: "0 20px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["📊 My stats", "🔬 Show labs", "📋 Marks card", "🚀 Career advice", "💡 Study plan"].map(q => (
            <button
              key={q}
              className="chip-btn"
              onClick={() => send(q)}
              disabled={loading}
              style={{
                padding: "6px 14px",
                background: "#f5f3ff",
                border: "1.5px solid #ede9fe",
                borderRadius: 999, color: "#7c3aed",
                fontSize: 12, cursor: "pointer", fontWeight: 500,
                transition: "all .15s", whiteSpace: "nowrap"
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{ padding: "0 20px 20px", flexShrink: 0 }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "#fff", border: "1.5px solid #e5e7eb",
            borderRadius: 16, padding: "10px 10px 10px 16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask me anything — performance, career guidance, study tips…"
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#111827", fontSize: 14, lineHeight: 1.6,
                resize: "none", fontFamily: "inherit", outline: "none",
                maxHeight: 120, overflow: "auto"
              }}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: loading || !input.trim()
                  ? "#f3f4f6"
                  : "linear-gradient(135deg,#6366f1,#0ea5e9)",
                border: "none", color: loading || !input.trim() ? "#9ca3af" : "#fff",
                cursor: loading || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s", flexShrink: 0, fontSize: 16
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#d1d5db", marginTop: 8 }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}