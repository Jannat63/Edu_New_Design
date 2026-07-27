/**
 * EduBD Toast Notification System
 * ─────────────────────────────────
 * Usage anywhere:
 *   import { toast } from "@/lib/toast";
 *   toast.success("Enrolled successfully!");
 *   toast.error("Payment failed. Try again.");
 *   toast.info("Check your email for a verification link.");
 *   toast.warning("Your session is about to expire.");
 */

import { useState, useEffect, useCallback } from "react";

// Singleton event bus — no context / Redux needed
const listeners = new Set();
let nextId = 0;

export const toast = {
  success: (msg, dur) => emit("success", msg, dur),
  error:   (msg, dur) => emit("error",   msg, dur),
  info:    (msg, dur) => emit("info",    msg, dur),
  warning: (msg, dur) => emit("warning", msg, dur),
};

function emit(type, message, duration = 4000) {
  const id = ++nextId;
  listeners.forEach(fn => fn({ id, type, message, duration }));
}

// ── ToastContainer — mount once in app.jsx inside <BrowserRouter> ──────────
const COLORS = {
  success: { bg:"#E3EDE6", border:"#B9D4C2", icon:"#3A6B4C", text:"#22432E" },
  error:   { bg:"#F7E3DF", border:"#E8B8AE", icon:"#B23A2E", text:"#5A211B" },
  info:    { bg:"#DFEBEA", border:"#B8D6D6", icon:"#3F8A8A", text:"#1C4444" },
  warning: { bg:"#F5E9D4", border:"#E6C77E", icon:"#C98A2C", text:"#5C4319" },
};
const ICONS = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
  warning: "⚠",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev.slice(-4), t]); // max 5 at a time
      setTimeout(() => remove(t.id), t.duration);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, [remove]);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10,
      pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            background: c.bg, border: `1.5px solid ${c.border}`,
            borderRadius: 14, padding: "13px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            minWidth: 280, maxWidth: 380,
            pointerEvents: "all", cursor: "pointer",
            animation: "slideIn 0.25s ease",
          }} onClick={() => remove(t.id)}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              background: c.icon, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, flexShrink: 0, marginTop: 1,
            }}>
              {ICONS[t.type]}
            </span>
            <span style={{ fontSize: 14, color: c.text, fontWeight: 600, lineHeight: 1.5 }}>
              {t.message}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
