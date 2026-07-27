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

// ── Dark mode toggle button ─────────────────────────────────────────────────
export function DarkModeToggle({ size = "md" }) {
  const { dark, toggle } = useDarkMode();
  const s = size === "sm" ? 32 : 38;
  return (
    <button onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ width:s, height:s, borderRadius:s/2, border:"1.5px solid #E4DBC8",
        background: dark ? "#28305E" : "#FBF6EE",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize: size === "sm" ? 14 : 16, transition:"all .2s" }}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
