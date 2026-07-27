import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api, getToken, setToken, ApiError } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Guards against a stale /auth/me response (e.g. from a leftover token,
  // already in flight when the page mounted) resolving AFTER a fresh
  // login/register/logout and silently overwriting the correct state.
  // Every auth-changing action bumps this, so older requests know to
  // discard their own result instead of applying it.
  const authGen = useRef(0);

  const loadMe = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    const myGen = ++authGen.current;
    try {
      const res = await api.get("/auth/me");
      if (myGen !== authGen.current) return; // a newer login/register/logout happened — ignore this stale result
      setUser(res.user);
    } catch (err) {
      if (myGen !== authGen.current) return;
      // Token invalid/expired
      setToken(null);
      setUser(null);
    } finally {
      if (myGen === authGen.current) setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    authGen.current++; // invalidate any in-flight loadMe() from a previous token
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post("/auth/register", payload);
    authGen.current++; // invalidate any in-flight loadMe() from a previous token
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    authGen.current++; // invalidate any in-flight loadMe() so it can't re-set the user after we clear it
    try { await api.post("/auth/logout", {}); } catch { /* ignore */ }
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(() => loadMe(), [loadMe]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export { ApiError };
