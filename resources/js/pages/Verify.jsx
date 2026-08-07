

import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Award, GraduationCap, Shield, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  g:"#3A6B4C", gLt:"#E3EDE6",
  r:"#B23A2E", rLt:"#F7E3DF",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function VerifyCertPage() {
  const C = useThemeColors();
  usePageTitle("Verify Certificate");
  const { code } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!code) return;
    api.get(`/verify/${code}`)
      .then(res => setData(res))
      .catch(() => setError("Certificate not found. Please check the code and try again."))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      {/* Navbar */}
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20 }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </a>
        <DarkModeToggle size="sm" />
      </nav>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        <div style={{ maxWidth:520, width:"100%" }}>

          {loading && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ width:52, height:52, borderRadius:"50%", border:`3px solid ${C.pLt}`, borderTopColor:C.p, margin:"0 auto 16px", animation:"spin 0.8s linear infinite" }} />
              <p style={{ color:C.t3, fontSize:14 }}>Verifying certificate...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && error && (
            <div style={{ background:C.w, border:`1.5px solid rgba(239,68,68,.3)`, borderRadius:20, padding:"40px", textAlign:"center" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:C.rLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
                <XCircle size={36} color={C.r} />
              </div>
              <h2 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:"0 0 10px" }}>Certificate Not Found</h2>
              <p style={{ color:C.t2, fontSize:14, margin:"0 0 24px", lineHeight:1.7 }}>{error}</p>
              <div style={{ background:"#FBF6EE", borderRadius:10, padding:"12px 16px", fontSize:13, color:C.t3, fontFamily:"monospace", wordBreak:"break-all" }}>
                Code: {code}
              </div>
            </div>
          )}

          {!loading && data?.valid && (
            <div style={{ background:C.w, border:`1.5px solid rgba(16,185,129,.3)`, borderRadius:20, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,.08)" }}>
              {/* Header */}
              <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"32px 32px", textAlign:"center" }}>
                <div style={{ width:68, height:68, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <Award size={32} color="#fff" />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>
                  Certificate of Completion
                </div>
                <h2 style={{ color:"#fff", fontSize:22, fontWeight:900, margin:"0 0 4px" }}>{data.student_name}</h2>
                <p style={{ color:"rgba(255,255,255,.65)", fontSize:14, margin:0 }}>has successfully completed</p>
                <div style={{ color:"#E0B368", fontSize:17, fontWeight:800, marginTop:8 }}>{data.course_title}</div>
              </div>

              {/* Valid badge */}
              <div style={{ background:C.gLt, borderBottom:`1px solid rgba(16,185,129,.2)`, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <CheckCircle2 size={20} color={C.g} />
                <span style={{ fontSize:14, fontWeight:700, color:"#22432E" }}>Certificate Verified ✓</span>
              </div>

              {/* Details */}
              <div style={{ padding:"24px 28px" }}>
                {[
                  { label:"Issued to",    value:data.student_name },
                  { label:"Course",       value:data.course_title },
                  { label:"Issued on",    value:data.issued_at },
                  { label:"Issued by",    value:"EduBD — Bangladesh" },
                  { label:"Certificate ID", value:data.cert_code },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.bd}`, gap:16 }}>
                    <span style={{ fontSize:13, color:C.t3, fontWeight:500, flexShrink:0 }}>{label}</span>
                    <span style={{ fontSize:13, color:C.t1, fontWeight:600, textAlign:"right", fontFamily: label==="Certificate ID" ? "monospace" : "inherit" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:"0 28px 24px", display:"flex", gap:10 }}>
                <div style={{ flex:1, background:C.pLt, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.p, fontWeight:600 }}>
                  <Shield size={14} /> This certificate is authentic and issued by EduBD.
                </div>
                <a href={`/courses`} style={{ display:"flex", alignItems:"center", gap:6, background:C.p, color:"#fff", borderRadius:10, padding:"10px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>
                  <ExternalLink size={13} /> View course
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
