

import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, GraduationCap } from "lucide-react";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  g:"#3A6B4C", gLt:"#E3EDE6",
  r:"#B23A2E", rLt:"#F7E3DF",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function PaymentResultPage() {
  usePageTitle("Payment Result");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status  = params.get("status");
  const courseSlug = params.get("course");
  const [countdown, setCountdown] = useState(5);

  const isSuccess   = status === "success";
  const isFailed    = status === "failed";
  const isCancelled = status === "cancelled";

  useEffect(() => {
    if (!isSuccess) return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); navigate("/dashboard"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess, navigate]);

  const configs = {
    success: {
      icon:    <CheckCircle2 size={56} color={C.g} />,
      bg:      C.gLt,
      border:  "rgba(16,185,129,.3)",
      title:   "Payment successful! 🎉",
      message: "Your enrollment is confirmed. You can start learning right away.",
      actions: [
        { label:"Go to my courses →", href:"/dashboard",         primary:true  },
        { label:"Back to home",        href:"/",                  primary:false },
      ],
    },
    failed: {
      icon:    <XCircle size={56} color={C.r} />,
      bg:      C.rLt,
      border:  "rgba(239,68,68,.3)",
      title:   "Payment failed",
      message: "Your payment could not be processed. You have not been charged. Please try again.",
      actions: [
        { label:"Try again",    href: courseSlug ? `/course/${courseSlug}` : "/courses", primary:true  },
        { label:"Back to home", href:"/",                                             primary:false },
      ],
    },
    cancelled: {
      icon:    <AlertCircle size={56} color={C.y} />,
      bg:      "#F5E9D4",
      border:  "rgba(245,158,11,.3)",
      title:   "Payment cancelled",
      message: "You cancelled the payment. No charges were made.",
      actions: [
        { label:"Browse courses", href:"/courses", primary:true  },
        { label:"Back to home",   href:"/",        primary:false },
      ],
    },
    error: {
      icon:    <AlertCircle size={56} color={C.r} />,
      bg:      C.rLt,
      border:  "rgba(239,68,68,.3)",
      title:   "Something went wrong",
      message: "We could not verify your payment. Please contact support with your transaction details.",
      actions: [
        { label:"Go to dashboard", href:"/dashboard", primary:true  },
        { label:"Contact support", href:"/contact",   primary:false },
      ],
    },
  };

  const cfg = configs[status] || configs.error;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      {/* Navbar */}
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </a>
      </nav>

      {/* Content */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        <div style={{ background:C.w, border:`1.5px solid ${cfg.border}`, borderRadius:24, padding:"48px 40px", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,.08)" }}>
          <div style={{ width:88, height:88, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
            {cfg.icon}
          </div>

          <h1 style={{ fontSize:26, fontWeight:900, color:C.t1, margin:"0 0 12px", letterSpacing:"-0.5px" }}>{cfg.title}</h1>
          <p style={{ fontSize:15, color:C.t2, lineHeight:1.72, margin:"0 0 32px" }}>{cfg.message}</p>

          {isSuccess && (
            <div style={{ background:C.pLt, borderRadius:12, padding:"12px 16px", marginBottom:24, fontSize:13, color:C.p, fontWeight:600 }}>
              Redirecting to your dashboard in {countdown} second{countdown !== 1 ? "s" : ""}...
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {cfg.actions.map(({ label, href, primary }) => (
              <a key={label} href={href} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 24px", borderRadius:12, fontSize:14, fontWeight:700, textDecoration:"none",
                background:  primary ? `linear-gradient(135deg,${C.p},#4B5390)` : "transparent",
                color:       primary ? "#fff" : C.t2,
                border:      primary ? "none" : `1.5px solid ${C.bd}`,
                boxShadow:   primary ? `0 6px 18px ${C.p}35` : "none",
              }}>
                {label} {primary && <ArrowRight size={16} />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
