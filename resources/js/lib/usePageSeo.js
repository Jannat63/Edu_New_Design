/**
 * usePageSeo
 * ──────────
 * For pages that aren't a course or blog post (those carry their own SEO
 * fields and don't need this — see Course.jsx/Blog.jsx, which read
 * course.meta_title / post.seo.title directly from their own API response).
 * Everything else — Home, About, the Courses listing, etc. — has no entity
 * of its own to hold meta fields, so this looks up an admin-managed
 * override by the current URL path (Admin → SEO) and falls back to
 * whatever the page passes in when nothing's been set.
 *
 * Sets the tab title (same fallback-to-site-name behavior as usePageTitle,
 * which this replaces rather than complements — calling both on the same
 * page would just fight over document.title) and the meta-description tag,
 * and returns { faqs } in case the page wants to render them.
 *
 * Usage:  const { faqs } = usePageSeo({
 *           fallbackTitle: "About EduBD",
 *           fallbackDescription: "Bangladesh's marketplace for..."
 *         });
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSetting } from "./useSiteContent";
import { api } from "./api";

function setMetaTag(attr, key, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function usePageSeo({ fallbackTitle, fallbackDescription, fallbackImage } = {}) {
  const { pathname } = useLocation();
  const siteName = useSiteSetting("site_name", "EduBD");
  const [seo, setSeo] = useState({ meta_title: null, meta_description: null, og_image: null, faqs: [] });

  useEffect(() => {
    let cancelled = false;
    api.get(`/page-seo?path=${encodeURIComponent(pathname)}`)
      .then(r => { if (!cancelled) setSeo(r || {}); })
      .catch(() => {}); // no override for this path is the normal case, not an error
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    const title = seo.meta_title || fallbackTitle;
    document.title = title ? `${title} — ${siteName}` : siteName;
    setMetaTag("name", "description", seo.meta_description || fallbackDescription);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", seo.meta_description || fallbackDescription);
    setMetaTag("property", "og:image", seo.og_image || fallbackImage);
    return () => { document.title = siteName; };
  }, [seo, fallbackTitle, fallbackDescription, fallbackImage, siteName]);

  return { faqs: seo.faqs || [] };
}
