import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Video, Calendar, Plus, X, Trash2, Radio } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePageSeo } from "@/lib/usePageSeo";
import AuthNavActions from "@/components/AuthNavActions";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
}

function InstructorPanel({ C }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title:"", description:"", scheduled_at:"", duration_minutes:60 });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get("/dashboard/instructor-overview").then(r => {
      setCourses(r.courses || []);
      if (r.courses?.[0]) setCourseId(String(r.courses[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!courseId) return;
    api.get(`/instructor/courses/${courseId}/live-classes`).then(setClasses).catch(() => setClasses([]));
  }, [courseId]);

  async function schedule(e) {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);
    try {
      await api.post(`/instructor/courses/${courseId}/live-classes`, form);
      setForm({ title:"", description:"", scheduled_at:"", duration_minutes:60 });
      const r = await api.get(`/instructor/courses/${courseId}/live-classes`);
      setClasses(r);
      setMsg({ ok:true, text:"Class scheduled." });
    } catch (err) {
      setMsg({ ok:false, text: err instanceof ApiError ? err.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelClass(id) {
    if (!confirm("Cancel this live class?")) return;
    try {
      await api.delete(`/live-classes/${id}`);
      setClasses(cs => cs.map(c => c.id === id ? { ...c, status:"cancelled" } : c));
    } catch (err) { alert(err.message || "Failed to cancel."); }
  }

  return (
    <>
      <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:14, padding:20, marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <Plus size={17} color={C.p} />
          <h2 style={{ fontSize:15, fontWeight:700, color:C.t1, margin:0 }}>Schedule a live class</h2>
        </div>
        {courses.length === 0 ? (
          <p style={{ fontSize:13.5, color:C.t2 }}>You don't have any courses yet.</p>
        ) : (
          <form onSubmit={schedule} style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <select value={courseId} onChange={e=>setCourseId(e.target.value)}
              style={{ border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input required placeholder="Class title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              style={{ border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }} />
            <textarea placeholder="What will you cover? (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              rows={2} style={{ border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1, resize:"vertical", fontFamily:"inherit" }} />
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <input required type="datetime-local" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))}
                style={{ flex:"1 1 200px", border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }} />
              <input required type="number" min={15} max={480} value={form.duration_minutes} onChange={e=>setForm(f=>({...f,duration_minutes:Number(e.target.value)}))}
                style={{ width:120, border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }} />
              <span style={{ alignSelf:"center", fontSize:12.5, color:C.t3 }}>minutes</span>
            </div>
            <button type="submit" disabled={submitting}
              style={{ alignSelf:"flex-start", padding:"10px 20px", borderRadius:10, border:"none", background:C.p, color:"#fff", fontSize:13.5, fontWeight:700, cursor:submitting?"default":"pointer" }}>
              {submitting ? "Scheduling…" : "Schedule class"}
            </button>
            {msg && <div style={{ fontSize:13, color: msg.ok ? "#1F5B36" : C.a }}>{msg.text}</div>}
          </form>
        )}
      </div>

      <h2 style={{ fontSize:15, fontWeight:700, color:C.t1, margin:"0 0 12px" }}>Your scheduled classes</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {classes.length === 0 && <div style={{ color:C.t2, fontSize:13.5 }}>No classes scheduled for this course yet.</div>}
        {classes.map(c => (
          <div key={c.id} style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, opacity:c.status==="cancelled"?0.5:1 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>
                {c.title} {c.is_live_now && <span style={{ color:C.a, fontSize:11 }}>● LIVE NOW</span>}
              </div>
              <div style={{ fontSize:12, color:C.t3 }}>{fmt(c.scheduled_at)} · {c.duration_minutes} min · {c.status}</div>
            </div>
            {c.status === "scheduled" && !c.has_ended && (
              <button onClick={()=>cancelClass(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.a, display:"flex" }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function StudentPanel({ C }) {
  const [classes, setClasses] = useState(null);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api.get("/live-classes/upcoming").then(setClasses).catch(() => setClasses([])); }, []);

  async function join(id) {
    setJoining(id);
    setError(null);
    try {
      const r = await api.post(`/live-classes/${id}/join`, {});
      window.open(r.join_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't join right now.");
    } finally {
      setJoining(null);
    }
  }

  return (
    <>
      <h2 style={{ fontSize:15, fontWeight:700, color:C.t1, margin:"0 0 12px" }}>Upcoming live classes</h2>
      {error && <div style={{ background:C.aLt, color:C.a, padding:"10px 14px", borderRadius:10, fontSize:13.5, marginBottom:16 }}>{error}</div>}
      {classes === null ? (
        <div style={{ color:C.t2, fontSize:13.5 }}>Loading…</div>
      ) : classes.length === 0 ? (
        <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:12, padding:24, textAlign:"center", color:C.t2, fontSize:13.5 }}>
          No live classes scheduled for your courses right now.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {classes.map(c => (
            <div key={c.id} style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11.5, color:C.p, fontWeight:700, marginBottom:2 }}>{c.course?.title}</div>
                <div style={{ fontSize:14.5, fontWeight:700, color:C.t1 }}>
                  {c.title} {c.is_live_now && <span style={{ color:C.a, fontSize:11 }}>● LIVE NOW</span>}
                </div>
                {c.description && <div style={{ fontSize:12.5, color:C.t2, marginTop:4 }}>{c.description}</div>}
                <div style={{ fontSize:12, color:C.t3, marginTop:4 }}>{fmt(c.scheduled_at)} · {c.duration_minutes} min</div>
              </div>
              <button onClick={()=>join(c.id)} disabled={joining===c.id}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:10, border:"none",
                  background: c.is_live_now ? C.a : C.p, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                {c.is_live_now ? <Radio size={14}/> : <Video size={14}/>}
                {joining===c.id ? "Joining…" : c.is_live_now ? "Join now" : "Join"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function LiveClassesPage() {
  const C = useThemeColors();
  usePageSeo({ fallbackTitle: "Live Classes" });
  const { user } = useAuth();
  const isInstructor = user?.is_instructor || user?.is_admin;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </Link>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Link to="/dashboard" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Dashboard</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"36px 20px 64px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:C.p, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Calendar size={20} color="#fff" />
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(24px,3.4vw,32px)", fontWeight:600, color:C.t1, margin:0 }}>Live Classes</h1>
        </div>

        {isInstructor ? <InstructorPanel C={C} /> : <StudentPanel C={C} />}
      </div>
    </div>
  );
}
