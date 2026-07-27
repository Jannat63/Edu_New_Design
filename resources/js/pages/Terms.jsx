import { GraduationCap, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { useSiteContent } from "@/lib/useSiteContent";
import { renderContentBlocks } from "@/lib/renderContentBlocks";
import { usePageTitle } from "@/lib/usePageTitle";

const C = {
  p:"#28305E",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function TermsPage() {
  usePageTitle("Terms & Conditions");
  const { data: cms, loading } = useSiteContent('legal');

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", color:C.t1, fontWeight:600, fontSize:21, letterSpacing:"-0.3px" }}>Edu<span style={{ color:C.a, fontStyle:"italic", fontWeight:500 }}>BD</span></span>
        </Link>
        <div style={{ display:"flex", gap:6 }}>
          <Link to="/privacy" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Privacy Policy</Link>
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:C.t1, padding:"48px 24px 56px", textAlign:"center" }}>
        <FileText size={30} color="rgba(255,255,255,.6)" style={{ marginBottom:14 }} />
        <h1 style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontSize:"clamp(26px,3.5vw,32px)", fontWeight:600, margin:0, letterSpacing:"-0.5px" }}>
          Terms & Conditions
        </h1>
      </div>

      <main style={{ maxWidth:760, margin:"0 auto", padding:"48px 24px 72px" }}>
        <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"36px 32px" }}>
          {loading ? (
            <p style={{ color:C.t3, fontSize:14, textAlign:"center", margin:0 }}>Loading…</p>
          ) : cms?.terms_content ? (
            renderContentBlocks(cms.terms_content, { headingColor: C.t1, textColor: C.t2 })
          ) : (
            <p style={{ color:C.t3, fontSize:14, textAlign:"center", margin:0 }}>
              Terms & Conditions content hasn't been added yet.
            </p>
          )}
        </div>

        <p style={{ fontSize:13, color:C.t3, textAlign:"center", marginTop:24 }}>
          Questions about these terms? <Link to="/contact" style={{ color:C.p, fontWeight:700, textDecoration:"none" }}>Contact us</Link>.
        </p>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
