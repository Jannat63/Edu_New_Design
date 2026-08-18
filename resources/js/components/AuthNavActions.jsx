import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useThemeColors } from "@/lib/darkMode";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import { LayoutDashboard, User, LogOut, ChevronDown, Bell, ShoppingCart, Trash2, X } from "lucide-react";

function initials(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
}

/**
 * NotificationBell — the same bell + dropdown pattern Admin.jsx already had
 * (NotifDropdown/Topbar there), just self-contained instead of needing
 * unread-count state lifted to a parent, since nothing outside this
 * component needs it here. The backend (NotificationController — index,
 * unread-count, recent, mark-read, mark-all-read, delete) already existed
 * and was already scoped correctly per-user; it just had no caller anywhere
 * except the admin panel, so students/instructors — who are the actual
 * recipients of CourseEnrolled/AssignmentGraded/NewDiscussionReply — had no
 * way to see a notification without checking email (UPGRADE_PLAN.md
 * Phase 5 item 16). Polls unread-count every 60s; the dropdown itself only
 * fetches on open, not on a timer, to avoid hammering the endpoint.
 */
function NotificationBell() {
  const C = useThemeColors();
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const load = () => api.get("/notifications/unread-count").then(r => setUnread(r?.count || 0)).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      api.get("/notifications/recent")
        .then(r => { setItems(r?.notifications || []); setUnread(r?.unread_count || 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all", {});
      setItems(items.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const clickItem = async (n) => {
    if (!n.is_read) {
      try { await api.put(`/notifications/${n.id}/read`, {}); } catch {}
      setUnread(u => Math.max(0, u - 1));
    }
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={toggle} aria-label="Notifications" style={{ background:C.bg, border:`1px solid ${C.bd}`, borderRadius:10, padding:"9px 10px", cursor:"pointer", display:"flex", position:"relative" }}>
        <Bell size={17} color={C.t2} />
        {unread > 0 && <span style={{ position:"absolute", top:6, right:6, width:8, height:8, borderRadius:"50%", background:C.r, border:`2px solid ${C.w}` }} />}
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:320, maxWidth:"88vw", background:C.w, border:`1px solid ${C.bd}`, borderRadius:16, boxShadow:"0 16px 40px rgba(0,0,0,.15)", zIndex:300 }}>
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, fontWeight:800, color:C.t1 }}>
              Notifications {unread > 0 && <span style={{ background:C.r, color:"#fff", fontSize:10, padding:"2px 6px", borderRadius:100, marginLeft:4 }}>{unread}</span>}
            </span>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize:11, color:C.p, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {loading && <p style={{ textAlign:"center", padding:20, color:C.t3, fontSize:13 }}>Loading…</p>}
            {!loading && items.length === 0 && <p style={{ textAlign:"center", padding:20, color:C.t3, fontSize:13 }}>No notifications yet</p>}
            {items.map(n => {
              const row = (
                <div key={n.id} onClick={() => clickItem(n)} style={{ padding:"12px 16px", borderBottom:`1px solid ${C.bd}`, background:n.is_read?"transparent":C.pLt, cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight:n.is_read?500:700, color:C.t1, lineHeight:1.4 }}>{n.title}</div>
                  {n.message && <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>{n.message}</div>}
                  <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>{n.created_at}</div>
                </div>
              );
              return n.url ? <Link key={n.id} to={n.url} style={{ textDecoration:"none" }} onClick={() => clickItem(n)}>{row}</Link> : row;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CartPanel — Phase 6 item 20, UPGRADE_PLAN.md. Same dropdown-from-a-header-
 * icon pattern as NotificationBell above. Checkout reuses PaymentMethodModal
 * (already shared between Course.jsx and BundleDetail.jsx for single-item
 * purchases) rather than building a second gateway picker.
 */
function CartPanel() {
  const C = useThemeColors();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loadingGateway, setLoadingGateway] = useState(null);
  const ref = useRef(null);

  const refreshCount = () => api.get("/cart").then(r => setCart(r || { items: [], total: 0, count: 0 })).catch(() => {});

  useEffect(() => { refreshCount(); }, []);

  useEffect(() => {
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) { setLoading(true); refreshCount().finally(() => setLoading(false)); }
  };

  const removeItem = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      setCart(c => {
        const items = c.items.filter(i => i.cart_item_id !== cartItemId);
        return { items, count: items.length, total: items.reduce((s, i) => s + i.price, 0) };
      });
    } catch (e) { toast.error(e.message || "Could not remove item."); }
  };

  const selectGateway = async (gateway) => {
    setLoadingGateway(gateway);
    try {
      const r = await api.post("/payments/initiate-cart", { gateway });
      if (r.free) {
        toast.success(r.message || "Enrolled for free!");
        setShowPayment(false); setOpen(false);
        setCart({ items: [], total: 0, count: 0 });
        setTimeout(() => navigate("/dashboard"), 1000);
        return;
      }
      if (r.redirect_url) { window.location.href = r.redirect_url; return; }
      toast.error("Could not start checkout. Please try again.");
    } catch (e) {
      toast.error(e.message || "Could not start checkout.");
    } finally { setLoadingGateway(null); }
  };

  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={toggle} aria-label="Cart" style={{ background:C.bg, border:`1px solid ${C.bd}`, borderRadius:10, padding:"9px 10px", cursor:"pointer", display:"flex", position:"relative" }}>
        <ShoppingCart size={17} color={C.t2} />
        {cart.count > 0 && <span style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, borderRadius:8, background:C.p, color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>{cart.count}</span>}
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:320, maxWidth:"88vw", background:C.w, border:`1px solid ${C.bd}`, borderRadius:16, boxShadow:"0 16px 40px rgba(0,0,0,.15)", zIndex:300 }}>
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.bd}` }}>
            <span style={{ fontSize:14, fontWeight:800, color:C.t1 }}>Your Cart</span>
          </div>
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {loading && <p style={{ textAlign:"center", padding:20, color:C.t3, fontSize:13 }}>Loading…</p>}
            {!loading && cart.items.length === 0 && <p style={{ textAlign:"center", padding:20, color:C.t3, fontSize:13 }}>Your cart is empty.</p>}
            {cart.items.map(item => (
              <div key={item.cart_item_id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:`1px solid ${C.bd}` }}>
                <div style={{ width:40, height:40, borderRadius:8, background: item.thumbnail ? `url(${item.thumbnail}) center/cover` : `linear-gradient(135deg,${C.p},#4B5390)`, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.p }}>৳{item.price.toLocaleString()}</div>
                </div>
                <button onClick={() => removeItem(item.cart_item_id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.t3, padding:4 }}><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
          {cart.items.length > 0 && (
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12, fontSize:13 }}>
                <span style={{ color:C.t2 }}>Total</span>
                <span style={{ fontWeight:800, color:C.t1 }}>৳{cart.total.toLocaleString()}</span>
              </div>
              <button onClick={() => { setOpen(false); setShowPayment(true); }} style={{ width:"100%", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:11, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Checkout ({cart.count} {cart.count===1?"item":"items"})
              </button>
            </div>
          )}
        </div>
      )}

      {showPayment && (
        <PaymentMethodModal amount={cart.total} itemLabel="your cart" onClose={() => setShowPayment(false)} onSelect={selectGateway} loadingGateway={loadingGateway} />
      )}
    </div>
  );
}

/**
 * AuthNavActions — drop this into the right side of any page's navbar.
 * Shows "Log in / Get started" for guests, or a notification bell + avatar
 * dropdown (Dashboard / Log out) for logged-in users, routed correctly by
 * role.
 */
export default function AuthNavActions() {
  const C = useThemeColors(); // was a hardcoded light-only palette — same fix as MegaMenu.jsx, same reason (this renders on every page, dark mode or not)
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
    <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
      {!user.is_admin && <NotificationBell />}
      {!user.is_admin && <CartPanel />}
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
    </div>
  );
}
