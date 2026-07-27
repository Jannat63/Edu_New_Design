import { useState, useEffect } from "react";
import { GraduationCap, Clock, Wrench } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./auth-context";

export default function MaintenanceGate({ children }) {
  const [maintenance, setMaintenance] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check in background — don't block initial render
    api.get('/site-content/general')
      .then(r => {
        setMaintenance(r?.maintenance_mode === true || r?.maintenance_mode === '1');
      })
      .catch(err => {
        if (err?.status === 503) setMaintenance(true);
      });
  }, []);

  // Admins always get through — otherwise there would be no way to ever turn
  // maintenance mode back off, since this overlay would block /admin too.
  // Wait for auth to resolve first so a real admin isn't shown the overlay
  // for a split second before their session loads.
  if (authLoading) return children;
  if (user?.is_admin) {
    return (
      <>
        {maintenance && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 9998,
            background: "#C98A2C", color: "#211D1A", fontSize: 13, fontWeight: 700,
            textAlign: "center", padding: "8px 16px",
          }}>
            🔧 Maintenance mode is ON — visitors see a maintenance page. You can see the site because you're an admin.
          </div>
        )}
        {children}
      </>
    );
  }

  // Always render children immediately — only overlay if maintenance ON
  if (!maintenance) return children;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(135deg,#171432 0%,#28305E 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:"rgba(255,255,255,.1)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Wrench size={34} color="#fff" />
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:12 }}>
          <GraduationCap size={22} color="#565E96" />
          <span style={{ fontSize:20, fontWeight:900, color:"#fff" }}>
            Edu<span style={{ color:"#565E96" }}>BD</span>
          </span>
        </div>
        <h1 style={{ fontSize:28, fontWeight:900, color:"#fff", margin:"0 0 14px", letterSpacing:"-0.5px" }}>
          We'll be back soon
        </h1>
        <p style={{ fontSize:15, color:"rgba(255,255,255,.6)", lineHeight:1.7, margin:"0 0 28px" }}>
          We're performing scheduled maintenance to improve your experience.
        </p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          color:"rgba(255,255,255,.4)", fontSize:13 }}>
          <Clock size={15} />
          <span>Expected duration: a few minutes</span>
        </div>
      </div>
    </div>
  );
}
