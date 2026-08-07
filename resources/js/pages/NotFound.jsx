import { GraduationCap, Home, ArrowLeft, Search } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function NotFound() {
  const C = useThemeColors();
  usePageTitle("Page Not Found");
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>

      {/* Navbar */}
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>
            Edu<span style={{ color:C.p }}>BD</span>
          </span>
        </a>
        <DarkModeToggle size="sm" />
      </nav>

      {/* Content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", textAlign:"center" }}>

        {/* 404 graphic */}
        <div style={{ fontSize:96, fontWeight:900, background:`linear-gradient(135deg,${C.p},#4B5390)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1, marginBottom:8, letterSpacing:"-4px" }}>
          404
        </div>

        <div style={{ width:80, height:4, background:`linear-gradient(90deg,${C.p},#4B5390)`, borderRadius:99, margin:"0 auto 28px" }} />

        <h1 style={{ fontSize:26, fontWeight:900, color:C.t1, margin:"0 0 12px" }}>
          Page not found
        </h1>
        <p style={{ fontSize:15, color:C.t2, margin:"0 0 36px", maxWidth:400, lineHeight:1.7 }}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", borderRadius:12, textDecoration:"none", fontWeight:700, fontSize:14 }}>
            <Home size={16} /> Go home
          </a>
          <a href="/courses" style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", background:C.w, border:`1.5px solid ${C.bd}`, color:C.t1, borderRadius:12, textDecoration:"none", fontWeight:700, fontSize:14 }}>
            <Search size={16} /> Browse courses
          </a>
          <button onClick={() => window.history.back()} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", background:C.w, border:`1.5px solid ${C.bd}`, color:C.t2, borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:14 }}>
            <ArrowLeft size={16} /> Go back
          </button>
        </div>

        {/* Popular links */}
        <div style={{ marginTop:48, padding:"24px 32px", background:C.w, border:`1px solid ${C.bd}`, borderRadius:16, maxWidth:400, width:"100%" }}>
          <p style={{ fontSize:13, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 14px" }}>Popular pages</p>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {[
              ["🎓", "All Courses",       "/courses"],
              ["🔑", "Login / Register",  "/login"],
              ["📊", "My Dashboard",      "/dashboard"],
              ["📝", "Blog",              "/blog/latest"],
            ].map(([emoji, label, href]) => (
              <a key={href} href={href} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, textDecoration:"none", color:C.t2, fontSize:14, fontWeight:500, transition:"background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background=C.bg}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <span>{emoji}</span> {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
