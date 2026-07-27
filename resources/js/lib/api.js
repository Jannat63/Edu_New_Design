/**
 * EduBD API client
 * ─────────────────────────────────────────────────────────────────────────
 * Thin wrapper around fetch() that:
 *  - prefixes every call with /api/v1  (same-origin — no CORS)
 *  - attaches the Bearer token from localStorage automatically
 *  - parses JSON and throws a normalized ApiError on non-2xx responses
 *  - enforces a 15-second timeout so the UI never hangs forever
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const courses = await api.get("/courses?search=react");
 *   await api.post("/auth/login", { email, password });
 */

const BASE_URL  = "/api/v1";
const TOKEN_KEY = "edubd_token";
const TIMEOUT_MS = 15_000; // 15 seconds

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name    = "ApiError";
    this.status  = status;
    this.payload = payload;
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else        window.localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body, opts = {}) {
  const url     = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const headers = { Accept: "application/json", ...(opts.headers || {}) };

  const isFormData = body instanceof FormData;
  if (body && !isFormData) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Abort after TIMEOUT_MS so the UI never hangs on a slow/down server
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      ...opts,
    });
  } catch (networkErr) {
    clearTimeout(timer);
    if (networkErr.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 0, null);
    }
    throw new ApiError("Cannot connect to server. Check your internet connection.", 0, null);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

/**
 * Download a file from an authenticated endpoint.
 *
 * Plain <a href> can't attach the Bearer token, and these files (e.g.
 * assignment submissions) are intentionally served from a private disk via
 * an authenticated route rather than a public URL — so we fetch as a blob
 * with the normal auth headers, then trigger the browser's save dialog via
 * a temporary object URL.
 */
async function downloadFile(path, suggestedFileName) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const headers = { Accept: "*/*" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* not JSON, ignore */ }
    throw new ApiError(data?.message || `Download failed with status ${res.status}`, res.status, data);
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = suggestedFileName || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const api = {
  get:      (path, opts)           => request("GET",    path, null, opts),
  post:     (path, body, opts)     => request("POST",   path, body, opts),
  put:      (path, body, opts)     => request("PUT",    path, body, opts),
  patch:    (path, body, opts)     => request("PATCH",  path, body, opts),
  delete:   (path, opts)           => request("DELETE", path, null, opts),
  upload:   (path, formData, opts) => request("POST",   path, formData, opts),
  download: (path, suggestedFileName) => downloadFile(path, suggestedFileName),
};

export { BASE_URL };
