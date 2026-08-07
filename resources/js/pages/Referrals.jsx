import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Gift, Copy, Check, Users, Wallet, TrendingUp, Banknote } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePageTitle } from "@/lib/usePageTitle";
import AuthNavActions from "@/components/AuthNavActions";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

function StatCard({ icon: Icon, label, value, C }) {
  return (
    <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:14, padding:18, flex:1, minWidth:160 }}>
      <div style={{ width:34, height:34, borderRadius:9, background:C.pLt, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
        <Icon size={17} color={C.p} />
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:C.t1 }}>{value}</div>
      <div style={{ fontSize:12.5, color:C.t2, marginTop:2 }}>{label}</div>
    </div>
  );
}

function StatusPill({ status, C }) {
  const map = {
    pending:    { bg:C.yLt, fg:"#92660F" },
    processing: { bg:C.pLt, fg:C.p },
    paid:       { bg:C.gLt, fg:"#1F5B36" },
    rejected:   { bg:C.aLt, fg:C.a },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background:s.bg, color:s.fg, fontSize:11.5, fontWeight:700, padding:"3px 10px", borderRadius:20, textTransform:"capitalize" }}>
      {status}
    </span>
  );
}

export default function ReferralsPage() {
  const C = useThemeColors();
  usePageTitle("Refer & Earn");
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [commissions, setCommissions] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ amount: "", method: "bkash", account_number: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  function loadAll() {
    api.get("/referrals/summary").then(setSummary).catch(e => setError(e instanceof ApiError ? e.message : "Couldn't load your referral summary."));
    api.get("/referrals/commissions").then(r => setCommissions(r.data || [])).catch(() => {});
    api.get("/referrals/payouts").then(setPayouts).catch(() => {});
  }

  useEffect(() => { if (user) loadAll(); }, [user]);

  function copyLink() {
    if (!summary?.referral_link) return;
    navigator.clipboard?.writeText(summary.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitPayout(e) {
    e.preventDefault();
    setFormMsg(null);
    setSubmitting(true);
    try {
      const r = await api.post("/referrals/payouts", {
        amount: Number(form.amount),
        method: form.method,
        account_number: form.account_number,
      });
      setFormMsg({ ok: true, text: r.message });
      setForm({ amount: "", method: form.method, account_number: form.account_number });
      loadAll();
    } catch (e) {
      setFormMsg({ ok: false, text: e instanceof ApiError ? e.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </Link>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Link to="/dashboard" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Dashboard</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ maxWidth:820, margin:"0 auto", padding:"36px 20px 64px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:C.p, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Gift size={20} color="#fff" />
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(24px,3.4vw,32px)", fontWeight:600, color:C.t1, margin:0 }}>Refer & Earn</h1>
        </div>
        <p style={{ color:C.t2, fontSize:14.5, lineHeight:1.6, margin:"0 0 28px" }}>
          Share your link — when someone signs up and buys a course, you earn{" "}
          {summary ? `${summary.commission_rate}%` : "a"} commission on what they pay.
        </p>

        {error && (
          <div style={{ background:C.aLt, color:C.a, padding:"10px 14px", borderRadius:10, fontSize:13.5, marginBottom:20 }}>{error}</div>
        )}

        {/* Referral link */}
        <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:14, padding:18, marginBottom:20 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.t2, marginBottom:8, textTransform:"uppercase", letterSpacing:".04em" }}>Your referral link</div>
          <div style={{ display:"flex", gap:8 }}>
            <input readOnly value={summary?.referral_link || "Loading…"}
              style={{ flex:1, border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }} />
            <button onClick={copyLink} disabled={!summary}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"0 16px", borderRadius:10, border:"none", background:C.p, color:"#fff", fontSize:13.5, fontWeight:700, cursor:summary?"pointer":"default" }}>
              {copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:28 }}>
          <StatCard icon={Users} label="People referred" value={summary?.total_referred ?? "—"} C={C} />
          <StatCard icon={TrendingUp} label="Total earned" value={summary ? `৳${Number(summary.total_earned).toLocaleString()}` : "—"} C={C} />
          <StatCard icon={Wallet} label="Available balance" value={summary ? `৳${Number(summary.available_balance).toLocaleString()}` : "—"} C={C} />
        </div>

        {/* Payout request */}
        <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:14, padding:20, marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <Banknote size={17} color={C.p} />
            <h2 style={{ fontSize:15, fontWeight:700, color:C.t1, margin:0 }}>Request a payout</h2>
          </div>
          <form onSubmit={submitPayout} style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            <input required type="number" min={100} step="0.01" placeholder="Amount (৳, min 100)"
              value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
              style={{ flex:"1 1 140px", border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }} />
            <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}
              style={{ flex:"1 1 120px", border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }}>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank transfer</option>
            </select>
            <input required placeholder="Account number" value={form.account_number}
              onChange={e=>setForm(f=>({...f,account_number:e.target.value}))}
              style={{ flex:"1 1 160px", border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px 12px", fontSize:13.5, background:C.bg, color:C.t1 }} />
            <button type="submit" disabled={submitting}
              style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.p, color:"#fff", fontSize:13.5, fontWeight:700, cursor:submitting?"default":"pointer" }}>
              {submitting ? "Submitting…" : "Request payout"}
            </button>
          </form>
          {formMsg && (
            <div style={{ marginTop:12, fontSize:13, color: formMsg.ok ? "#1F5B36" : C.a }}>{formMsg.text}</div>
          )}
        </div>

        {/* Payout history */}
        {payouts && payouts.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:C.t1, margin:"0 0 12px" }}>Payout history</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {payouts.map(p => (
                <div key={p.id} style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>৳{Number(p.amount).toLocaleString()} — {p.method}</div>
                    <div style={{ fontSize:12, color:C.t3 }}>{p.created_at}</div>
                  </div>
                  <StatusPill status={p.status} C={C} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commission history */}
        <div>
          <h2 style={{ fontSize:15, fontWeight:700, color:C.t1, margin:"0 0 12px" }}>Commission history</h2>
          {commissions === null ? (
            <div style={{ color:C.t2, fontSize:13.5 }}>Loading…</div>
          ) : commissions.length === 0 ? (
            <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:12, padding:24, textAlign:"center", color:C.t2, fontSize:13.5 }}>
              No commissions yet — share your link above to start earning.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {commissions.map(c => (
                <div key={c.id} style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>{c.referred_user?.name || "A referred student"}</div>
                    <div style={{ fontSize:12, color:C.t3 }}>{new Date(c.created_at).toLocaleDateString()} · {c.rate_percent_at_time}% commission</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#1F5B36" }}>+৳{Number(c.amount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
