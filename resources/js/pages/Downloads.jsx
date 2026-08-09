import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, HardDriveDownload, Trash2, FileText, Video, X } from "lucide-react";
import { offlineStore } from "@/lib/offlineStore";
import { useAuth } from "@/lib/auth-context";
import { usePageTitle } from "@/lib/usePageTitle";
import AuthNavActions from "@/components/AuthNavActions";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

// Works fully offline once loaded — everything here reads from IndexedDB,
// nothing requires a network request. See offlineStore.js.
export default function DownloadsPage() {
  const C = useThemeColors();
  usePageTitle("Downloads");
  useAuth();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null); // the item currently being viewed
  const [videoUrl, setVideoUrl] = useState(null);

  function refresh() {
    offlineStore.list().then(list => setItems(list.sort((a, b) => b.downloadedAt - a.downloadedAt))).catch(() => setItems([]));
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (open?.kind === "video") {
      const url = URL.createObjectURL(open.blob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoUrl(null);
  }, [open]);

  async function remove(lessonId, e) {
    e.stopPropagation();
    await offlineStore.remove(lessonId);
    if (open?.lessonId === lessonId) setOpen(null);
    refresh();
  }

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

      <div style={{ maxWidth:720, margin:"0 auto", padding:"36px 20px 64px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:C.p, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HardDriveDownload size={20} color="#fff" />
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(24px,3.4vw,32px)", fontWeight:600, color:C.t1, margin:0 }}>Downloads</h1>
        </div>
        <p style={{ color:C.t2, fontSize:14, margin:"0 0 24px" }}>
          Lessons you've saved for offline use. Everything here works without a connection.
        </p>

        {open && (
          <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:14, padding:20, marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11.5, color:C.p, fontWeight:700 }}>{open.courseTitle}</div>
                <h2 style={{ fontSize:17, fontWeight:800, color:C.t1, margin:"2px 0 0" }}>{open.title}</h2>
              </div>
              <button onClick={()=>setOpen(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.t2 }}><X size={18}/></button>
            </div>
            {open.kind === "video" ? (
              <video src={videoUrl} controls style={{ width:"100%", borderRadius:10, background:"#000" }} />
            ) : (
              <div style={{ fontSize:14.5, color:C.t1, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{open.content}</div>
            )}
          </div>
        )}

        {items === null ? (
          <div style={{ color:C.t2, fontSize:13.5 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:12, padding:32, textAlign:"center", color:C.t2, fontSize:13.5 }}>
            Nothing saved yet — look for "Save offline" under a lesson while you're learning.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {items.map(item => (
              <div key={item.lessonId} onClick={()=>setOpen(item)}
                style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
                <div style={{ width:34, height:34, borderRadius:9, background:C.pLt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {item.kind === "video" ? <Video size={16} color={C.p}/> : <FileText size={16} color={C.p}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11.5, color:C.p, fontWeight:700 }}>{item.courseTitle}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                </div>
                <button onClick={(e)=>remove(item.lessonId, e)} style={{ background:"none", border:"none", cursor:"pointer", color:C.a, display:"flex", flexShrink:0 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
