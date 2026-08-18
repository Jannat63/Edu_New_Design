import { GraduationCap, Mail, Download, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { usePageSeo } from "@/lib/usePageSeo";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function PressPage() {
  const C = useThemeColors();
  usePageSeo({ fallbackTitle: "Press & Media" });

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
          <Link to="/about" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>About</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"56px 24px 70px", textAlign:"center" }}>
        <Newspaper size={36} color="#fff" style={{ marginBottom:14, opacity:0.9 }} />
        <h1 style={{ color:"#fff", fontSize:"clamp(28px,4vw,40px)", fontWeight:900, margin:"0 0 12px", letterSpacing:"-1px" }}>
          Press & Media
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:560, margin:"0 auto" }}>
          Resources for journalists, bloggers, and partners covering EduBD.
        </p>
      </div>

      <main style={{ maxWidth:780, margin:"0 auto", padding:"0 24px 64px" }}>

        <div style={{ marginTop:-32, marginBottom:40, position:"relative", zIndex:2, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:18 }}>
          <div style={{ background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:24 }}>
            <Mail size={22} color={C.p} style={{ marginBottom:12 }} />
            <h3 style={{ fontSize:15, fontWeight:800, color:C.t1, margin:"0 0 8px" }}>Media inquiries</h3>
            <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:"0 0 10px" }}>
              For interviews, data requests, or general press questions, reach our team directly.
            </p>
            <a href="mailto:support@edubd.com" style={{ fontSize:13, color:C.p, fontWeight:700, textDecoration:"none" }}>
              support@edubd.com
            </a>
          </div>

          <div style={{ background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:24 }}>
            <Download size={22} color={C.p} style={{ marginBottom:12 }} />
            <h3 style={{ fontSize:15, fontWeight:800, color:C.t1, margin:"0 0 8px" }}>Brand assets</h3>
            <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:0 }}>
              Looking for our logo or brand guidelines? Email us and we'll send over the latest press kit.
            </p>
          </div>
        </div>

        <section style={{ marginBottom:40 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:C.t1, marginBottom:14 }}>About EduBD</h2>
          <p style={{ fontSize:14, color:C.t2, lineHeight:1.8 }}>
            EduBD is an online learning platform built specifically for Bangladesh — offering courses in
            web development, design, and business skills, priced in taka and payable via bKash, Nagad, and
            SSLCommerz. The platform has helped thousands of students build careers in tech and beyond.
            Read more on our <Link to="/about" style={{ color:C.p, fontWeight:700, textDecoration:"none" }}>About page</Link>.
          </p>
        </section>

        <section style={{ background:C.pLt, borderRadius:16, padding:"24px", textAlign:"center" }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:C.t1, marginBottom:8 }}>Writing about us?</h2>
          <p style={{ fontSize:13, color:C.t2, marginBottom:16 }}>
            We're happy to provide quotes, data points, or a founder interview on short notice.
          </p>
          <a href="mailto:support@edubd.com?subject=Press%20Inquiry" style={{ display:"inline-block", padding:"12px 24px", background:C.p, color:"#fff", borderRadius:10, fontWeight:700, fontSize:14, textDecoration:"none" }}>
            Email the press team
          </a>
        </section>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
