import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useThemeColors } from "@/lib/darkMode";

/**
 * Shared site wordmark — identical markup to what every page's own Navbar()
 * used to inline separately (see UPGRADE_PLAN.md Phase 5 item 15). Used as
 * the `logo` prop for <MegaMenu />.
 */
export default function Logo() {
  const C = useThemeColors();
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.p},#4B5390)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GraduationCap size={20} color="#fff" strokeWidth={2} />
      </div>
      <span style={{ color: C.t1, fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px" }}>
        Edu<span style={{ color: C.p }}>BD</span>
      </span>
    </Link>
  );
}
