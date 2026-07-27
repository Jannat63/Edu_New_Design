import { useState, useEffect } from "react";
import { api } from "./api";

// Cache so we don't refetch on every component mount
const cache = {};

/**
 * useSiteContent(group?)
 * Fetches CMS content from the API.
 * - No group: returns ALL settings as flat key→value map
 * - With group: returns settings for that group only
 *
 * Usage:
 *   const cms = useSiteContent();
 *   const hero = useSiteContent('hero');
 */
export function useSiteContent(group) {
  const key = group || '__all__';
  const [data, setData] = useState(cache[key] || {});
  const [loading, setLoading] = useState(!cache[key]);

  useEffect(() => {
    if (cache[key]) { setData(cache[key]); setLoading(false); return; }
    const url = group ? `/site-content/${group}` : '/site-content';
    api.get(url)
      .then(r => { cache[key] = r || {}; setData(cache[key]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [key]);

  return { data, loading };
}

// Convenience: get a single value with fallback
export function useSiteSetting(key, fallback = '') {
  const { data } = useSiteContent();
  return data[key] ?? fallback;
}
