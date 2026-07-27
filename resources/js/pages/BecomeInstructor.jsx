import { GraduationCap, DollarSign, Users, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { usePageTitle } from "@/lib/usePageTitle";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  g:"#3A6B4C", gLt:"#E3EDE6",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

const BENEFITS = [
  { icon: DollarSign, title: "Earn real income",       body: "Keep the majority share of every enrollment. Top instructors earn a full-time income teaching part-time." },
  { icon: Users,       title: "Reach thousands",        body: "Tap into a student base actively searching for skills in your field — no marketing budget required." },
  { icon: Clock,       title: "Teach on your schedule",  body: "Record once, earn repeatedly. No live sessions required unless you want to run them." },
];

const STEPS = [
  "Apply with a short outline of what you want to teach",
  "Our team reviews your application and outline (usually within 5 business days)",
  "Record your course using our content guidelines",
  "We review, publish, and start promoting it to students",
];

export default function BecomeInstructorPage() {
  usePageTitle("Become an Instructor");

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
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"60px 24px 80px", textAlign:"center" }}>
        <h1 style={{ color:"#fff", fontSize:"clamp(28px,4vw,40px)", fontWeight:900, margin:"0 0 14px", letterSpacing:"-1px" }}>
          Teach what you know.<br/>Reach who needs it.
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:560, margin:"0 auto 28px" }}>
          Join 35+ instructors building Bangladesh's next generation of developers, designers, and marketers.
        </p>
        <Link to="/login" style={{ display:"inline-block", padding:"14px 32px", background:"#fff", color:C.p, borderRadius:12, fontWeight:800, fontSize:15, textDecoration:"none" }}>
          Apply to teach
        </Link>
      </div>

      <main style={{ maxWidth:900, margin:"0 auto", padding:"0 24px 64px" }}>

        {/* Benefits */}
        <div style={{ marginTop:-36, marginBottom:48, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))", gap:18, position:"relative", zIndex:2 }}>
          {BENEFITS.map(({ icon:Icon, title, body }) => (
            <div key={title} style={{ background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:24 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:C.pLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                <Icon size={20} color={C.p} />
              </div>
              <h3 style={{ fontSize:15, fontWeight:800, color:C.t1, margin:"0 0 8px" }}>{title}</h3>
              <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:0 }}>{body}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section style={{ marginBottom:48 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.t1, marginBottom:20, textAlign:"center" }}>How it works</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:600, margin:"0 auto" }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:16, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:14, padding:"16px 20px" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:C.p, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, flexShrink:0 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize:14, color:C.t1, fontWeight:600, margin:0 }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we look for */}
        <section style={{ background:C.gLt, border:"1.5px solid #B9D4C2", borderRadius:16, padding:"28px 24px", marginBottom:48 }}>
          <h2 style={{ fontSize:17, fontWeight:800, color:C.t1, marginBottom:14 }}>What we look for</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10 }}>
            {[
              "Real, hands-on experience in your field",
              "Ability to explain concepts clearly and patiently",
              "A course outline employers would actually value",
              "Commitment to keeping your content up to date",
            ].map(item => (
              <div key={item} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <CheckCircle2 size={16} color={C.g} style={{ flexShrink:0, marginTop:2 }} />
                <span style={{ fontSize:13, color:C.t2 }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:14, color:C.t2, marginBottom:18 }}>
            Have questions before applying? <Link to="/contact" style={{ color:C.p, fontWeight:700, textDecoration:"none" }}>Reach out to our team</Link>.
          </p>
          <Link to="/login" style={{ display:"inline-block", padding:"14px 32px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", borderRadius:12, fontWeight:800, fontSize:15, textDecoration:"none" }}>
            Create your instructor account
          </Link>
        </div>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
