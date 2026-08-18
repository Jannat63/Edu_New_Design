import { useState } from "react";
import { GraduationCap, Mail, MapPin, Phone, Send } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { usePageSeo } from "@/lib/usePageSeo";
import { toast } from "@/lib/toast";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function ContactPage() {
  const C = useThemeColors();
  usePageSeo({ fallbackTitle: "Contact Us" });

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.warning("Please fill in all fields.");
      return;
    }
    const subject = encodeURIComponent(`Message from ${name} via EduBD contact page`);
    const body    = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:support@edubd.com?subject=${subject}&body=${body}`;
    toast.success("Opening your email client...");
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
          <Link to="/courses" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Courses</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"56px 24px 70px", textAlign:"center" }}>
        <h1 style={{ color:"#fff", fontSize:"clamp(28px,4vw,40px)", fontWeight:900, margin:"0 0 12px", letterSpacing:"-1px" }}>
          Get in touch
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:560, margin:"0 auto" }}>
          Questions about a course, a payment, or partnering with us? We'd love to hear from you.
        </p>
      </div>

      <main style={{ maxWidth:900, margin:"-32px auto 0", padding:"0 24px 64px", position:"relative", zIndex:2 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:24, alignItems:"start" }}>

          {/* Contact info */}
          <div style={{ background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:28, display:"flex", flexDirection:"column", gap:20 }}>
            {[
              { icon:Mail,  label:"Email",   value:"support@edubd.com", href:"mailto:support@edubd.com" },
              { icon:Phone, label:"Phone",   value:"+880 1700-000000",  href:"tel:+8801700000000" },
              { icon:MapPin,label:"Office",  value:"Gulshan, Dhaka, Bangladesh", href:null },
            ].map(({ icon:Icon, label, value, href }) => (
              <div key={label} style={{ display:"flex", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:11, background:C.pLt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={18} color={C.p} />
                </div>
                <div>
                  <div style={{ fontSize:12, color:C.t3, fontWeight:600, marginBottom:2 }}>{label}</div>
                  {href ? (
                    <a href={href} style={{ fontSize:14, color:C.t1, fontWeight:700, textDecoration:"none" }}>{value}</a>
                  ) : (
                    <div style={{ fontSize:14, color:C.t1, fontWeight:700 }}>{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <form onSubmit={handleSubmit} style={{ background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:28 }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.t1, marginBottom:7 }}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Rafiq Islam"
                style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", border:`1.5px solid ${C.bd}`, borderRadius:11, fontSize:14, outline:"none" }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.t1, marginBottom:7 }}>Your email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", border:`1.5px solid ${C.bd}`, borderRadius:11, fontSize:14, outline:"none" }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.t1, marginBottom:7 }}>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" rows={5}
                style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", border:`1.5px solid ${C.bd}`, borderRadius:11, fontSize:14, outline:"none", resize:"vertical", fontFamily:"inherit" }} />
            </div>
            <button type="submit" style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:11, fontWeight:700, fontSize:14, cursor:"pointer" }}>
              <Send size={16} /> Send message
            </button>
            <p style={{ fontSize:11, color:C.t3, textAlign:"center", marginTop:12, marginBottom:0 }}>
              This opens your email app with the message pre-filled to support@edubd.com.
            </p>
          </form>
        </div>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
