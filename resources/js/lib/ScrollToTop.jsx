/**
 * ScrollToTop
 * ────────────
 * React Router does not scroll to the top of the page when you navigate.
 * This component fixes that by watching the URL path and scrolling up.
 *
 * Mount it ONCE inside <BrowserRouter>, before <Routes>.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
