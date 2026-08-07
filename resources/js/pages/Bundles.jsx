import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/lib/usePageTitle";
import { GraduationCap, Package, ChevronRight, Sparkles } from "lucide-react";
import AuthNavActions from "@/components/AuthNavActions";
import { api } from "@/lib/api";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

function Navbar() {
  const C = useThemeColors();
  return (
    <nav style={{ position:"sticky",top:0,zIndex:100,background:C.w,borderBottom:`1px solid ${C.bd}` }}>
      <div style={{ display:"flex",alignItems:"center",height:64,gap:28,maxWidth:1280,margin:"0 auto",padding:"0 clamp(20px,4vw,40px)" }}>
        <Link to="/" style={{ display:"flex",alignItems:"center",gap:9,textDecoration:"none",flexShrink:0 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", color:C.t1,fontWeight:600,fontSize:21,letterSpacing:"-0.3px" }}>Edu<span style={{ color:C.a,fontStyle:"italic",fontWeight:500 }}>BD</span></span>
        </Link>
        <div style={{ display:"flex",gap:2,flex:1 }}>
          {[["Home","/"],["Courses","/courses"],["Bundles","/bundles"],["Blog","/blog"],["About","/about"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:l==="Bundles"?C.p:C.t2,fontSize:14,fontWeight:l==="Bundles"?700:500,padding:"7px 13px",borderRadius:8,textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{ background:"#1A2044", padding:"32px clamp(20px,4vw,40px)", marginTop:60 }}>
      <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <span style={{ color:"rgba(255,255,255,.25)", fontSize:13 }}>© 2026 EduBD · Bangladesh's #1 Learning Platform</span>
        <div style={{ display:"flex", gap:20 }}>
          {[["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:"rgba(255,255,255,.3)", fontSize:13, textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function BundleCard({ b }) {
  const savingsPct = b.original_price && b.original_price > b.price
    ? Math.round((1 - b.price / b.original_price) * 100)
    : null;

  return (
    <Link to={`/bundle/${b.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, overflow:"hidden", transition:"all .18s", height:"100%", display:"flex", flexDirection:"column" }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.p; e.currentTarget.style.boxShadow=`0 12px 32px ${C.p}22`; e.currentTarget.style.transform="translateY(-3px)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.bd; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; }}
      >
        <div style={{ height:140, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          <Package size={44} color="rgba(255,255,255,.9)" strokeWidth={1.5} />
          {savingsPct !== null && (
            <div style={{ position:"absolute", top:12, right:12, background:C.a, color:"#fff", fontSize:12, fontWeight:800, padding:"4px 10px", borderRadius:20, display:"flex", alignItems:"center", gap:4 }}>
              <Sparkles size={12} /> Save {savingsPct}%
            </div>
          )}
          <div style={{ position:"absolute", bottom:12, left:12, background:"rgba(0,0,0,.35)", color:"#fff", fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:20 }}>
            {b.course_count} course{b.course_count === 1 ? "" : "s"}
          </div>
        </div>

        <div style={{ padding:18, display:"flex", flexDirection:"column", flex:1 }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:C.t1, margin:"0 0 8px", lineHeight:1.35 }}>{b.title}</h3>
          {b.description && <p style={{ fontSize:13, color:C.t3, margin:"0 0 12px", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{b.description}</p>}

          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
            {b.courses.slice(0,3).map(c => (
              <span key={c.id} style={{ fontSize:11, color:C.t2, background:C.bg, border:`1px solid ${C.bd}`, borderRadius:8, padding:"3px 8px" }}>{c.title}</span>
            ))}
            {b.course_count > 3 && <span style={{ fontSize:11, color:C.t3, padding:"3px 4px" }}>+{b.course_count - 3} more</span>}
          </div>

          <div style={{ marginTop:"auto", display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontSize:20, fontWeight:900, color:C.p }}>৳{b.price.toLocaleString()}</span>
            {b.original_price && b.original_price > b.price && (
              <span style={{ fontSize:13, color:C.t3, textDecoration:"line-through" }}>৳{b.original_price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BundlesPage() {
  const C = useThemeColors();
  usePageTitle("Course Bundles");
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bundles")
      .then(r => setBundles(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Navbar />

      {/* Header */}
      <div style={{ background:C.pLt, borderBottom:`1px solid ${C.bd}`, padding:"28px clamp(20px,4vw,40px)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.t3,marginBottom:10 }}>
            <Link to="/" style={{ color:C.t3,textDecoration:"none" }}>Home</Link>
            <ChevronRight size={14} />
            <span style={{ color:C.p,fontWeight:600 }}>Bundles</span>
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(22px,3vw,32px)", fontWeight:600, color:C.t1, margin:"0 0 4px", letterSpacing:"-0.5px" }}>Course Bundles</h1>
          <p style={{ color:C.t2, fontSize:14, margin:0 }}>Multiple courses, one price, real savings — pick a bundle and get every course in it at once.</p>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"32px clamp(20px,4vw,40px) 20px" }}>
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} style={{ height:320, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, opacity:.5 }} />
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 20px", color:C.t3 }}>
            <Package size={44} style={{ marginBottom:14, opacity:.4 }} />
            <p style={{ fontSize:15, fontWeight:600, color:C.t2, margin:0 }}>No bundles available right now.</p>
            <p style={{ fontSize:13, margin:"6px 0 0" }}>Check back soon, or browse our full course catalogue instead.</p>
            <Link to="/courses" style={{ display:"inline-block", marginTop:18, color:C.p, fontWeight:700, fontSize:14, textDecoration:"none" }}>Browse all courses →</Link>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
            {bundles.map(b => <BundleCard key={b.id} b={b} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
