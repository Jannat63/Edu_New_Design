import { GraduationCap, Search, CreditCard, PlayCircle, Award } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { usePageTitle } from "@/lib/usePageTitle";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  g:"#3A6B4C", gLt:"#E3EDE6",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

const STEPS = [
  { icon: Search,     n: "01", title: "Find your course",  body: "Browse 120+ courses across web development, design, and business. Filter by price, level, or category to find the right fit." },
  { icon: CreditCard, n: "02", title: "Enroll & pay",       body: "Pay securely with bKash, Nagad, or card through SSLCommerz. Free courses enroll instantly with one click." },
  { icon: PlayCircle, n: "03", title: "Learn at your pace", body: "Stream video lessons, complete quizzes, and track your progress lesson-by-lesson — all from your dashboard, on any device." },
  { icon: Award,       n: "04", title: "Get certified",      body: "Pass the final quiz and download a verifiable certificate with a unique code employers can check instantly." },
];

export default function HowItWorksPage() {
  const C = useThemeColors();
  usePageTitle("How It Works");

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
          <Link to="/courses" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Courses</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"56px 24px 70px", textAlign:"center" }}>
        <h1 style={{ color:"#fff", fontSize:"clamp(28px,4vw,40px)", fontWeight:900, margin:"0 0 12px", letterSpacing:"-1px" }}>
          How EduBD works
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:560, margin:"0 auto" }}>
          From browsing to certificate — here's exactly what to expect.
        </p>
      </div>

      <main style={{ maxWidth:780, margin:"0 auto", padding:"0 24px 64px" }}>

        <div style={{ marginTop:-32, marginBottom:48, position:"relative", zIndex:2, display:"flex", flexDirection:"column", gap:16 }}>
          {STEPS.map(({ icon:Icon, n, title, body }, i) => (
            <div key={n} style={{ background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.08)", padding:"24px 26px", display:"flex", gap:20, alignItems:"flex-start" }}>
              <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={22} color="#fff" />
                </div>
                {i < STEPS.length - 1 && <div style={{ width:2, flex:1, minHeight:24, background:C.bd, marginTop:8 }} />}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:C.p, letterSpacing:"0.08em", marginBottom:4 }}>STEP {n}</div>
                <h3 style={{ fontSize:18, fontWeight:800, color:C.t1, margin:"0 0 8px" }}>{title}</h3>
                <p style={{ fontSize:14, color:C.t2, lineHeight:1.7, margin:0 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <section style={{ background:C.gLt, border:"1.5px solid #B9D4C2", borderRadius:16, padding:"28px 24px", textAlign:"center" }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:C.t1, marginBottom:10 }}>Still have questions?</h2>
          <p style={{ fontSize:14, color:C.t2, marginBottom:18 }}>
            Check our course pages for detailed curricula, or reach out directly.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/courses" style={{ padding:"12px 24px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", borderRadius:11, fontWeight:700, fontSize:14, textDecoration:"none" }}>
              Browse courses
            </Link>
            <Link to="/contact" style={{ padding:"12px 24px", background:C.w, border:`1.5px solid ${C.bd}`, color:C.t1, borderRadius:11, fontWeight:700, fontSize:14, textDecoration:"none" }}>
              Contact us
            </Link>
          </div>
        </section>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
