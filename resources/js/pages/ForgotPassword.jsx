

import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Mail, GraduationCap, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  g:"#3A6B4C", gLt:"#E3EDE6",
  r:"#B23A2E",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function ForgotPasswordPage() {
  usePageTitle("Forgot Password");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address."); return;
    }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20 }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </a>
      </nav>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:20, padding:"40px 36px", maxWidth:420, width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,.07)" }}>
          {sent ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:C.gLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <CheckCircle2 size={36} color={C.g} />
              </div>
              <h2 style={{ fontSize:22, fontWeight:900, color:C.t1, margin:"0 0 10px" }}>Check your inbox</h2>
              <p style={{ fontSize:14, color:C.t2, lineHeight:1.75, margin:"0 0 24px" }}>
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
              </p>
              <a href="/login" style={{ display:"inline-flex", alignItems:"center", gap:7, background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", padding:"11px 22px", borderRadius:11, fontSize:14, fontWeight:700, textDecoration:"none" }}>
                Back to login <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize:24, fontWeight:900, color:C.t1, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Reset your password</h2>
              <p style={{ fontSize:14, color:C.t3, margin:"0 0 28px", lineHeight:1.7 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.t1, marginBottom:7 }}>Email address</label>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:C.bg, border:`1.5px solid ${error ? C.r : C.bd}`, borderRadius:12, padding:"0 14px", marginBottom:error ? 8 : 20 }}>
                <Mail size={16} color={C.t3} />
                <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
                  type="email" placeholder="you@example.com"
                  style={{ flex:1, border:"none", outline:"none", fontSize:14, color:C.t1, padding:"13px 0", background:"transparent" }} />
              </div>
              {error && <p style={{ fontSize:12, color:C.r, margin:"0 0 18px", display:"flex", alignItems:"center", gap:5 }}>{error}</p>}

              <button onClick={submit} disabled={loading}
                style={{ width:"100%", background: loading ? C.t3 : `linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? "Sending..." : <><Mail size={16} /> Send reset link</>}
              </button>

              <div style={{ textAlign:"center", marginTop:20 }}>
                <a href="/login" style={{ fontSize:13, color:C.p, fontWeight:600, textDecoration:"none" }}>← Back to login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
