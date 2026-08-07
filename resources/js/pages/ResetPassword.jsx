import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1",
  g:"#3A6B4C", gLt:"#E3EDE6",
  r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function ResetPasswordPage() {
  const C = useThemeColors();
  usePageTitle("Reset Password");
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get("token") || "";
  const email                   = searchParams.get("email") || "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const missingToken = !token || !email;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      {/* Navbar */}
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>
            Edu<span style={{ color:C.p }}>BD</span>
          </span>
        </a>
        <DarkModeToggle size="sm" />
      </nav>

      {/* Content */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:24, padding:"40px 36px", maxWidth:420, width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,.08)" }}>

          {/* Invalid link */}
          {missingToken && (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:C.rLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <AlertCircle size={32} color={C.r} />
              </div>
              <h1 style={{ fontSize:22, fontWeight:900, color:C.t1, margin:"0 0 12px" }}>Invalid reset link</h1>
              <p style={{ fontSize:14, color:C.t2, margin:"0 0 24px", lineHeight:1.6 }}>
                This link is missing required information. Please request a new password reset link.
              </p>
              <a href="/forgot-password" style={{ display:"inline-block", padding:"12px 24px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", borderRadius:12, fontSize:14, fontWeight:700, textDecoration:"none" }}>
                Request new link
              </a>
            </div>
          )}

          {/* Success */}
          {!missingToken && success && (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:C.gLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <CheckCircle2 size={32} color={C.g} />
              </div>
              <h1 style={{ fontSize:22, fontWeight:900, color:C.t1, margin:"0 0 12px" }}>Password reset! 🎉</h1>
              <p style={{ fontSize:14, color:C.t2, lineHeight:1.6 }}>
                Your password has been changed. Redirecting you to login...
              </p>
            </div>
          )}

          {/* Form */}
          {!missingToken && !success && (
            <>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:C.pLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <Lock size={24} color={C.p} />
                </div>
                <h1 style={{ fontSize:22, fontWeight:900, color:C.t1, margin:"0 0 8px" }}>Set new password</h1>
                <p style={{ fontSize:13, color:C.t2, margin:0 }}>
                  Resetting password for <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div style={{ display:"flex", alignItems:"center", gap:8, background:C.rLt, border:`1px solid rgba(239,68,68,.2)`, borderRadius:10, padding:"10px 14px", marginBottom:18 }}>
                  <AlertCircle size={15} color={C.r} />
                  <span style={{ fontSize:13, color:C.r }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New password */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.t1, marginBottom:7 }}>New password</label>
                  <div style={{ position:"relative" }}>
                    <Lock size={16} color={C.t3} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      style={{ width:"100%", boxSizing:"border-box", padding:"13px 44px", border:`1.5px solid ${C.bd}`, borderRadius:12, fontSize:14, color:C.t1, outline:"none" }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                      {showPw ? <EyeOff size={16} color={C.t3} /> : <Eye size={16} color={C.t3} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom:24 }}>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.t1, marginBottom:7 }}>Confirm new password</label>
                  <div style={{ position:"relative" }}>
                    <Lock size={16} color={C.t3} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
                    <input
                      type={showCf ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      style={{ width:"100%", boxSizing:"border-box", padding:"13px 44px", border:`1.5px solid ${C.bd}`, borderRadius:12, fontSize:14, color:C.t1, outline:"none" }}
                    />
                    <button type="button" onClick={() => setShowCf(v => !v)}
                      style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                      {showCf ? <EyeOff size={16} color={C.t3} /> : <Eye size={16} color={C.t3} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width:"100%", padding:"14px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </form>

              <p style={{ textAlign:"center", fontSize:13, color:C.t3, marginTop:20, marginBottom:0 }}>
                <a href="/login" style={{ color:C.p, fontWeight:600, textDecoration:"none" }}>Back to login</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
