import { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext({ dark: false, toggle: () => {} });

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("edubd_dark") === "1"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("edubd_dark", dark ? "1" : "0"); } catch {}
  }, [dark]);

  return (
    <DarkModeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export const useDarkMode = () => useContext(DarkModeContext);

// ── Shared color palette (light/dark) ───────────────────────────────────────
// Every page defines its own local `const C = {...}` with these same keys
// and light-mode hex values (theme.js documents the core subset and the
// reasoning behind them). Rather than rewriting every page's color object,
// useThemeColors() below returns the same 16-key shape a page's local `C`
// already has, so a component can opt in to dark mode by shadowing its
// local C with `const C = useThemeColors();` — no other line has to change.
//
// The dark values for p/pDk/a/g/y/w-bg/bd/t1/t2 are the same ones already
// designed in resources/views/app.blade.php's [data-theme="dark"] block
// (kept in sync with that file manually, since pages don't read CSS
// variables — see UPGRADE_PLAN.md Phase 1 notes on why). The *Lt tint keys,
// pMd, w (card surface) and t3 don't have an existing dark counterpart
// there, so they're derived here: same hue family, re-balanced for a dark
// surface (light tints become dark muted surfaces, mid-tones lighten for
// contrast).
const LIGHT_COLORS = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  r:"#B23A2E", rLt:"#F7E3DF", // alias — Quiz.jsx uses r/rLt for the same red instead of a/aLt
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C", yLt:"#F5E9D4",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

const DARK_COLORS = {
  p:"#6B76C9", pDk:"#8B95E0", pLt:"#2A2E52", pMd:"#9AA3E0",
  a:"#E0685A", aLt:"#3A2420",
  r:"#E0685A", rLt:"#3A2420", // alias — keep in sync with a/aLt above
  g:"#5FA378", gLt:"#1F2E24",
  y:"#E0A94E", yLt:"#332A18",
  w:"#262320", bg:"#1C1A17", bd:"#3A362F",
  t1:"#F3ECE0", t2:"#B8AFA0", t3:"#948C7D",
};

/**
 * Returns the current palette — LIGHT_COLORS or DARK_COLORS depending on
 * the active theme. Shape matches the `const C = {...}` object every page
 * already defines locally, so a page opts in with:
 *
 *   function Navbar() {
 *     const C = useThemeColors();   // was: local hardcoded object
 *     ...unchanged JSX below...
 *   }
 *
 * Scoped to a single function this way, it themes just that function's
 * markup without touching sibling components in the same file that still
 * use the file's original hardcoded `C`.
 */
export function useThemeColors() {
  const { dark } = useDarkMode();
  return dark ? DARK_COLORS : LIGHT_COLORS;
}

// ── Dark mode toggle button ─────────────────────────────────────────────────
export function DarkModeToggle({ size = "md" }) {
  const { dark, toggle } = useDarkMode();
  const s = size === "sm" ? 32 : 38;
  return (
    <button onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ width:s, height:s, borderRadius:s/2, border:`1.5px solid ${dark ? "#3A362F" : "#E4DBC8"}`,
        background: dark ? "#28305E" : "#FBF6EE",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize: size === "sm" ? 14 : 16, transition:"all .2s" }}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
