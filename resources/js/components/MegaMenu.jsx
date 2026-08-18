import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, X, Menu as MenuIcon, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useThemeColors } from "@/lib/darkMode";

/**
 * MegaMenu — responsive navigation with mega-dropdown on desktop
 * and accordion on mobile.
 *
 * Usage: <MegaMenu logo={<YourLogo />} actions={<LoginButton />} />
 *
 * Data is fetched from GET /api/v1/menu which returns the active
 * menu tree managed in Admin → Mega Menu.
 */
export default function MegaMenu({ logo, actions, transparent = false }) {
  // Was a hardcoded light-only palette before — every page this gets wired
  // into already supports dark mode via this same hook (see UPGRADE_PLAN.md
  // Phase 1 item 2), so a static C here would have silently broken dark mode
  // specifically on the navbar the moment this replaced each page's own
  // Navbar(). Same 10 keys that palette already had (p/pDk/pLt/a/w/bg/bd/
  // t1/t2/t3) exist in both light and dark palettes; the one dropped key
  // ("sidebar") was defined but never actually referenced anywhere below.
  const C = useThemeColors();
  const [items, setItems]       = useState([]);
  const [open, setOpen]         = useState(null);   // id of open top-level item
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExp, setMobileExp]   = useState({});  // accordion expanded state
  const [loading, setLoading]   = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    api.get("/menu")
      .then(r => setItems(r || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const topLevel = items.filter(i => !i.parent_id);
  const children = (parentId) => items.filter(i => i.parent_id === parentId);

  // Group children by category_group for mega-column layout
  const grouped = (parentId) => {
    const kids = children(parentId);
    const groups = {};
    kids.forEach(k => {
      const g = k.category_group || "__default__";
      if (!groups[g]) groups[g] = [];
      groups[g].push(k);
    });
    return groups;
  };

  const NavLink = ({ item, onClick }) => {
    const Tag = item.url?.startsWith("http") ? "a" : Link;
    const props = item.url?.startsWith("http")
      ? { href: item.url, target: item.open_new_tab ? "_blank" : "_self", rel: "noopener noreferrer" }
      : { to: item.url || "#" };

    return (
      <Tag {...props} onClick={onClick}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10,
          color: C.t1, textDecoration:"none", fontSize:13, fontWeight:500,
          transition:"background .12s", background:"transparent" }}
        onMouseEnter={e => e.currentTarget.style.background = C.bg}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {item.icon && <span style={{ fontSize:16 }}>{item.icon}</span>}
        <span style={{ flex:1 }}>{item.title}</span>
        {item.is_featured && (
          <span style={{ fontSize:10, fontWeight:700, background:C.pLt, color:C.p, padding:"2px 6px", borderRadius:100 }}>Hot</span>
        )}
        {item.open_new_tab && <ExternalLink size={11} color={C.t3} />}
      </Tag>
    );
  };

  // ── DESKTOP DROPDOWN ────────────────────────────────────────────────────────
  const DesktopDropdown = ({ item }) => {
    const groups = grouped(item.id);
    const groupKeys = Object.keys(groups);
    const hasGroups = groupKeys.length > 1 || (groupKeys.length === 1 && groupKeys[0] !== "__default__");
    const cols = Math.min(groupKeys.length, 4);

    return (
      <div style={{
        position:"absolute", top:"calc(100% + 8px)", left:"50%", transform:"translateX(-50%)",
        background:C.w, border:`1px solid ${C.bd}`, borderRadius:18,
        boxShadow:"0 20px 60px rgba(0,0,0,.12)", padding:"20px",
        minWidth: cols > 1 ? Math.min(cols * 220, 900) : 260,
        maxWidth:"92vw",
        display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:8, zIndex:200,
        animation:"fadeSlideIn .15s ease",
      }}>
        {groupKeys.map(group => (
          <div key={group}>
            {hasGroups && group !== "__default__" && (
              <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:"uppercase",
                letterSpacing:".06em", padding:"4px 14px 8px", marginTop:4 }}>{group}</div>
            )}
            {groups[group].map(child => <NavLink key={child.id} item={child} onClick={() => setOpen(null)} />)}
          </div>
        ))}
      </div>
    );
  };

  // ── MOBILE ACCORDION ───────────────────────────────────────────────────────
  const MobileItem = ({ item }) => {
    const kids   = children(item.id);
    const isExp  = !!mobileExp[item.id];
    const toggle = () => setMobileExp(p => ({ ...p, [item.id]: !p[item.id] }));

    if (kids.length > 0) {
      return (
        <div>
          <button onClick={toggle}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"14px 20px",
              border:"none", background:"transparent", cursor:"pointer", textAlign:"left" }}>
            {item.icon && <span style={{ fontSize:18 }}>{item.icon}</span>}
            <span style={{ flex:1, fontSize:15, fontWeight:600, color:C.t1 }}>{item.title}</span>
            {isExp ? <ChevronDown size={16} color={C.t3} style={{ transform:"rotate(180deg)" }} />
                   : <ChevronDown size={16} color={C.t3} />}
          </button>
          {isExp && (
            <div style={{ paddingLeft:20, borderLeft:`2px solid ${C.pLt}`, margin:"0 20px 8px" }}>
              {kids.map(child => <NavLink key={child.id} item={child} onClick={() => setMobileOpen(false)} />)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding:"0 8px" }}>
        <NavLink item={item} onClick={() => setMobileOpen(false)} />
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      <nav ref={menuRef}
        style={{ background: transparent ? "transparent" : C.w,
          borderBottom: transparent ? "none" : `1px solid ${C.bd}`,
          position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px",
          display:"flex", alignItems:"center", height:66, gap:24 }}>

          {/* Logo */}
          <div style={{ flexShrink:0 }}>
            {logo || (
              <Link to="/" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:22, fontWeight:900, color:C.t1 }}>
                  Edu<span style={{ color:C.p }}>BD</span>
                </span>
              </Link>
            )}
          </div>

          {/* Desktop nav */}
          <div style={{ display:"flex", alignItems:"center", gap:2, flex:1, position:"relative" }}>
            {!loading && topLevel.map(item => {
              const kids    = children(item.id);
              const isOpen  = open === item.id;

              return (
                <div key={item.id}>
                  {kids.length > 0 ? (
                    <button onClick={() => setOpen(isOpen ? null : item.id)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                        border:"none", borderRadius:10, background: isOpen ? C.pLt : "transparent",
                        color: isOpen ? C.p : C.t1, cursor:"pointer", fontSize:14, fontWeight:600,
                        transition:"all .12s" }}
                      onMouseEnter={e => { if(!isOpen) e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { if(!isOpen) e.currentTarget.style.background = "transparent"; }}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      {item.title}
                      <ChevronDown size={14} style={{ transition:"transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }} />
                    </button>
                  ) : (
                    <NavLink item={item} />
                  )}
                  {isOpen && kids.length > 0 && <DesktopDropdown item={item} />}
                </div>
              );
            })}
          </div>

          {/* Right actions */}
          <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:10 }}>
            {actions}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)}
            style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:8 }}
            className="mobile-menu-btn">
            <MenuIcon size={22} color={C.t1} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200 }} />
          <div style={{ position:"fixed", top:0, left:0, bottom:0, width:"min(340px,90vw)",
            background:C.w, zIndex:201, display:"flex", flexDirection:"column",
            overflowY:"auto", boxShadow:"4px 0 32px rgba(0,0,0,.2)",
            animation:"slideIn .2s ease" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"18px 20px", borderBottom:`1px solid ${C.bd}` }}>
              <span style={{ fontSize:18, fontWeight:900, color:C.t1 }}>
                Edu<span style={{ color:C.p }}>BD</span>
              </span>
              <button onClick={() => setMobileOpen(false)}
                style={{ background:"none", border:"none", cursor:"pointer" }}>
                <X size={20} color={C.t3} />
              </button>
            </div>
            <div style={{ flex:1, paddingTop:8 }}>
              {topLevel.map(item => <MobileItem key={item.id} item={item} />)}
            </div>
            {actions && <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.bd}` }}>{actions}</div>}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          nav > div > div:first-of-type + div { display: none !important; }
        }
        @keyframes fadeSlideIn {
          from { opacity:0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
