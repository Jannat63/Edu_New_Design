/**
 * usePageTitle
 * ────────────
 * Updates the browser tab title when a page mounts.
 * Site name comes from Admin → Website Content → General (falls back to
 * "EduBD" until that loads, or if it was never set).
 * Usage:  usePageTitle("Login");
 *         usePageTitle(`${course.title} — EduBD`);
 */
import { useEffect } from "react";
import { useSiteSetting } from "./useSiteContent";

export function usePageTitle(title) {
  const base = useSiteSetting("site_name", "EduBD");

  useEffect(() => {
    document.title = title ? `${title} — ${base}` : base;
    return () => { document.title = base; };
  }, [title, base]);
}
