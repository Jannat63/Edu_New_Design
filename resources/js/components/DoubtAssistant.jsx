import { useState, useEffect, useRef } from "react";
import { MessageCircleQuestion, Send, Loader2, Bot, X, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useThemeColors } from "@/lib/darkMode";

/**
 * AI doubt-solving assistant, scoped to a single lesson (Phase 2 item 3).
 * Collapsed to a floating button by default; expands into a small chat
 * panel. Text-lesson answers are grounded in the actual lesson content;
 * video-lesson answers are flagged as course-context-only since there's no
 * transcript to ground them in yet — see AnthropicDoubtAssistant.php.
 */
export default function DoubtAssistant({ lessonId, lessonTitle }) {
  const C = useThemeColors();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Reset per-lesson state when the student navigates to a different lesson.
    setMessages([]);
    setLoaded(false);
    setError(null);
    setOpen(false);
  }, [lessonId]);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    api.get(`/lessons/${lessonId}/doubts`)
      .then(r => {
        if (cancelled) return;
        setMessages(r.messages || []);
        setRemaining(r.remaining_today);
        setLoaded(true);
      })
      .catch(e => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Couldn't load your previous questions."); });
    return () => { cancelled = true; };
  }, [open, loaded, lessonId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const question = input.trim();
    if (!question || sending) return;
    setInput("");
    setError(null);
    setSending(true);
    // Optimistic: show the question immediately, backfill its real id/timestamp on success.
    const tempId = `pending-${Date.now()}`;
    setMessages(m => [...m, { id: tempId, role: "user", content: question }]);

    try {
      const r = await api.post(`/lessons/${lessonId}/doubts`, { question });
      setMessages(m => [...m.filter(x => x.id !== tempId), r.question, r.answer]);
      setRemaining(r.remaining_today);
    } catch (e) {
      setMessages(m => m.filter(x => x.id !== tempId));
      setInput(question); // give the question back so it isn't lost
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} title="Ask a question about this lesson"
        style={{
          position:"fixed", bottom:24, right:24, zIndex:150,
          display:"flex", alignItems:"center", gap:8,
          background:C.p, color:"#fff", border:"none", borderRadius:28,
          padding:"12px 18px", fontSize:14, fontWeight:600,
          boxShadow:"0 8px 24px rgba(0,0,0,0.25)", cursor:"pointer",
        }}>
        <MessageCircleQuestion size={18} />
        Ask a doubt
      </button>
    );
  }

  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:150,
      width:"min(380px, calc(100vw - 32px))", height:"min(520px, calc(100vh - 100px))",
      background:C.w, border:`1px solid ${C.bd}`, borderRadius:16,
      boxShadow:"0 16px 48px rgba(0,0,0,0.28)",
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:`1px solid ${C.bd}`, background:C.pLt }}>
        <div style={{ width:32, height:32, borderRadius:9, background:C.p, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Bot size={17} color="#fff" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1 }}>Doubt-solving assistant</div>
          <div style={{ fontSize:11.5, color:C.t2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lessonTitle}</div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.t2, padding:4, display:"flex" }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {loaded && messages.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:8, color:C.t2, marginTop:24, padding:"0 12px" }}>
            <Sparkles size={22} color={C.p} />
            <div style={{ fontSize:13, lineHeight:1.5 }}>
              Confused about something in this lesson? Ask here — answers are scoped to this
              course, so it stays on-topic.
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap:4 }}>
            <div style={{
              maxWidth:"88%", padding:"9px 13px", borderRadius:14,
              borderBottomRightRadius: m.role === "user" ? 3 : 14,
              borderBottomLeftRadius:  m.role === "user" ? 14 : 3,
              background: m.role === "user" ? C.p : C.bg,
              color: m.role === "user" ? "#fff" : C.t1,
              fontSize:13.5, lineHeight:1.5, whiteSpace:"pre-wrap",
            }}>
              {m.content}
            </div>
            {m.role === "assistant" && !m.grounded_in_transcript && (
              <div style={{ fontSize:10.5, color:C.t3, padding:"0 4px" }}>
                Based on the course description, not this video's transcript
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div style={{ display:"flex", alignItems:"center", gap:6, color:C.t2, fontSize:12.5 }}>
            <Loader2 size={14} className="spin" style={{ animation:"doubt-spin 0.8s linear infinite" }} />
            Thinking…
          </div>
        )}
        <style>{`@keyframes doubt-spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {error && (
        <div style={{ padding:"8px 16px", fontSize:12, color:C.a, background:C.aLt, borderTop:`1px solid ${C.bd}` }}>{error}</div>
      )}

      {remaining !== null && remaining <= 5 && !error && (
        <div style={{ padding:"6px 16px", fontSize:11, color:C.t3, borderTop:`1px solid ${C.bd}` }}>
          {remaining} question{remaining === 1 ? "" : "s"} left today
        </div>
      )}

      {/* Input */}
      <div style={{ display:"flex", gap:8, padding:12, borderTop:`1px solid ${C.bd}` }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about this lesson…"
          disabled={sending}
          style={{
            flex:1, border:`1px solid ${C.bd}`, borderRadius:10, padding:"9px 12px",
            fontSize:13.5, background:C.bg, color:C.t1, outline:"none",
          }}
        />
        <button onClick={send} disabled={sending || !input.trim()}
          style={{
            width:36, height:36, borderRadius:9, border:"none",
            background: input.trim() && !sending ? C.p : C.bd,
            color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
            cursor: input.trim() && !sending ? "pointer" : "default", flexShrink:0,
          }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
