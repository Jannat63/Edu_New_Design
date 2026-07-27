import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, User, LogOut, ChevronDown } from "lucide-react";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
  r:"#B23A2E", rLt:"#F7E3DF",
};

function initials(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
}

/**
 * AuthNavActions — drop this into the right side of any page's navbar.
 * Shows "Log in / Get started" for guests, or an avatar + dropdown
 * (Dashboard / Log out) for logged-in users, routed correctly by role.
 */
export default function AuthNavActions() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Avoid flashing "Log in" for a split second while the session is still resolving
  if (loading) return <div style={{ width:96, height:36 }} />;

  if (!user) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <Link to="/login" style={{ color:C.t1, fontSize:14, fontWeight:600, textDecoration:"none", padding:"9px 16px" }}>Log in</Link>
        <Link to="/login" style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, color:C.w, fontSize:14, fontWeight:700, padding:"9px 20px", borderRadius:10, textDecoration:"none", whiteSpace:"nowrap" }}>Get started →</Link>
      </div>
    );
  }

  const dashboardHref = user.is_admin ? "/admin" : user.is_instructor ? "/instructor-dashboard" : "/dashboard";
  const roleLabel = user.is_admin ? "Admin" : user.is_instructor ? "Instructor" : "Student";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:9, background:"none", border:"none", cursor:"pointer", padding:"4px 8px 4px 4px", borderRadius:100 }}
        onMouseEnter={e => e.currentTarget.style.background = C.bg}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {user.avatar
          ? <img src={user.avatar} alt={user.name} style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover" }} />
          : <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff" }}>{initials(user.name)}</div>
        }
        <span style={{ fontSize:13, fontWeight:600, color:C.t1, maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</span>
        <ChevronDown size={14} color={C.t3} style={{ transition:"transform .15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:220, background:C.w, border:`1px solid ${C.bd}`, borderRadius:14, boxShadow:"0 16px 40px rgba(0,0,0,.14)", zIndex:300, overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.bd}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
            <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{user.email}</div>
            <span style={{ display:"inline-block", marginTop:6, fontSize:10, fontWeight:700, color:C.p, background:C.pLt, padding:"2px 9px", borderRadius:100 }}>{roleLabel}</span>
          </div>
          <Link to={dashboardHref} onClick={() => setOpen(false)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", fontSize:13, color:C.t1, textDecoration:"none" }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <LayoutDashboard size={15} color={C.t3} /> {user.is_admin ? "Admin Panel" : user.is_instructor ? "Instructor Dashboard" : "My Dashboard"}
          </Link>
          {!user.is_admin && (
            <Link to="/dashboard" onClick={() => setOpen(false)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", fontSize:13, color:C.t1, textDecoration:"none" }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <User size={15} color={C.t3} /> My Profile
            </Link>
          )}
          <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", fontSize:13, color:C.r, background:"none", border:"none", borderTop:`1px solid ${C.bd}`, cursor:"pointer", width:"100%", textAlign:"left" }}
            onMouseEnter={e => e.currentTarget.style.background = C.rLt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
