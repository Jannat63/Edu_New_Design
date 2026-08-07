

import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Check,
  GraduationCap, Star, AlertCircle, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

// ── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C", r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

// ── PASSWORD STRENGTH ─────────────────────────────────────────────────────────
function pwStrength(pwd) {
  if (!pwd) return { score:0, label:"", color:"" };
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score:1, label:"Weak",   color:C.r  };
  if (s === 2) return { score:2, label:"Fair",   color:C.y  };
  if (s === 3) return { score:3, label:"Good",   color:C.g  };
  return          { score:4, label:"Strong", color:C.g  };
}

// ── VALIDATE ──────────────────────────────────────────────────────────────────
function validate(mode, fields) {
  const errs = {};
  if (mode === "register" && !fields.name.trim())
    errs.name = "Full name is required.";
  if (!fields.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
    errs.email = "Please enter a valid email address.";
  if (fields.password.length < 8)
    errs.password = "Password must be at least 8 characters.";
  if (mode === "register" && fields.password !== fields.confirm)
    errs.confirm = "Passwords do not match.";
  if (mode === "register" && fields.phone.replace(/\D/g,"").length < 10)
    errs.phone = "Enter a valid 10-digit phone number.";
  if (mode === "register" && !fields.terms)
    errs.terms = "You must accept the terms to continue.";
  return errs;
}

// ── INPUT COMPONENT ───────────────────────────────────────────────────────────
function Input({ label, icon:Icon, type="text", value, onChange, placeholder, error, note, suffix, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.t1, marginBottom:7 }}>{label}</label>
      <div style={{ position:"relative" }}>
        {Icon && (
          <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", zIndex:1 }}>
            <Icon size={16} color={error ? C.r : focused ? C.p : C.t3} />
          </div>
        )}
        <input
          type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onKeyDown={onKeyDown}
          style={{
            width:"100%", boxSizing:"border-box",
            padding:`13px 14px 13px ${Icon?"44px":"14px"}`,
            paddingRight: suffix ? "46px" : "14px",
            border:`1.5px solid ${error ? C.r : focused ? C.p : C.bd}`,
            borderRadius:12, fontSize:14, color:C.t1, outline:"none",
            background: error ? C.rLt : C.w,
            transition:"border-color .15s, background .15s",
          }}
        />
        {suffix && (
          <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)" }}>{suffix}</div>
        )}
      </div>
      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
          <AlertCircle size={13} color={C.r} />
          <span style={{ fontSize:12, color:C.r }}>{error}</span>
        </div>
      )}
      {note && !error && <p style={{ fontSize:11, color:C.t3, margin:"5px 0 0" }}>{note}</p>}
    </div>
  );
}

// ── SOCIAL BUTTON ─────────────────────────────────────────────────────────────
function SocialBtn({ logo, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px 16px", background: hov ? C.bg : C.w, border:`1.5px solid ${hov ? C.p : C.bd}`, borderRadius:12, fontSize:13, fontWeight:600, color:C.t1, cursor:"pointer", transition:"all .15s" }}
    >
      <span style={{ fontSize:18 }}>{logo}</span> {label}
    </button>
  );
}

// ── LEFT PANEL ────────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{ flex:"0 0 440px", background:`linear-gradient(155deg,${C.pDk} 0%,${C.p} 45%,#4B5390 100%)`, padding:"48px 44px", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      {/* Decoration blobs */}
      <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,.06)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-60, left:-60, width:220, height:220, borderRadius:"50%", background:`rgba(249,115,22,.12)`, pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:56, position:"relative" }}>
        <div style={{ width:38, height:38, borderRadius:11, background:"rgba(255,255,255,.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <GraduationCap size={21} color="#fff" strokeWidth={2} />
        </div>
        <span style={{ color:"#fff", fontWeight:900, fontSize:22, letterSpacing:"-0.5px" }}>EduBD</span>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", position:"relative" }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontSize:"clamp(26px,2.5vw,36px)", fontWeight:600, margin:"0 0 14px", letterSpacing:"-0.6px", lineHeight:1.16 }}>
          Learn skills that<br />matter in 2025.
        </h2>
        <p style={{ color:"rgba(255,255,255,.6)", fontSize:15, lineHeight:1.75, margin:"0 0 32px" }}>
          Join 50,000+ students from Bangladesh building real careers with expert-led courses.
        </p>

        {/* Features list */}
        {[
          "500+ expert-crafted courses",
          "Pay with bKash, Nagad or card",
          "Verified PDF certificates",
          "Bengali & English content",
          "Lifetime course access",
        ].map(f=>(
          <div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:13 }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Check size={12} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize:14, color:"rgba(255,255,255,.8)", fontWeight:500 }}>{f}</span>
          </div>
        ))}

        {/* Stats row */}
        <div style={{ display:"flex", gap:28, marginTop:30, paddingTop:28, borderTop:"1px solid rgba(255,255,255,.13)" }}>
          {[["50K+","Students"],["4.9★","Rating"],["500+","Courses"]].map(([v,l])=>(
            <div key={l}>
              <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-0.5px" }}>{v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial card */}
      <div style={{ background:"rgba(255,255,255,.09)", backdropFilter:"blur(12px)", borderRadius:16, padding:"20px 20px", border:"1px solid rgba(255,255,255,.14)", marginTop:32, position:"relative" }}>
        <div style={{ display:"flex", gap:3, marginBottom:10 }}>
          {[...Array(5)].map((_,i)=><Star key={i} size={13} fill="#C98A2C" color="#C98A2C" />)}
        </div>
        <p style={{ fontSize:13, color:"rgba(255,255,255,.8)", lineHeight:1.72, margin:"0 0 14px", fontStyle:"italic" }}>
          "Got my first developer job after completing the React course. Best investment I've ever made for my career."
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:C.a, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff", flexShrink:0 }}>RI</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Rafiqul Islam</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)" }}>Frontend Developer · Dhaka</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LOGIN FORM ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [remember, setRemember] = useState(false);
  const [errs,     setErrs]     = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [apiError, setApiError] = useState("");

  const handleKeyDown = (e) => { if (e.key === 'Enter') submit(); };

  const submit = async () => {
    const e = validate("login", { email, password, confirm:"", name:"", phone:"9999999999", terms:true });
    setErrs(e);
    if (Object.keys(e).length) return;

    setApiError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      setSuccess(true);
      toast.success("Welcome back! Redirecting...");
      setTimeout(() => {
        const dest = user.is_admin ? "/admin" : user.is_instructor ? "/instructor-dashboard" : "/dashboard";
        navigate(dest);
      }, 1200);
    } catch (err) {
      setApiError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:C.gLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <CheckCircle2 size={36} color={C.g} />
      </div>
      <h3 style={{ fontSize:22, fontWeight:900, color:C.t1, margin:"0 0 8px" }}>Welcome back!</h3>
      <p style={{ fontSize:14, color:C.t3 }}>Redirecting to your dashboard...</p>
      <div style={{ marginTop:20, width:"100%", height:3, background:C.bd, borderRadius:100 }}>
        <div style={{ background:`linear-gradient(90deg,${C.p},#4B5390)`, width:"100%", height:"100%", borderRadius:100, animation:"none" }} />
      </div>
    </div>
  );

  return (
    <div>
      {/* Social login */}
      <div style={{ display:"flex", gap:10, marginBottom:22 }}>
        <SocialBtn logo="🇬" label="Google" />
        <SocialBtn logo="📘" label="Facebook" />
      </div>

      {/* Divider */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
        <div style={{ flex:1, height:1, background:C.bd }} />
        <span style={{ fontSize:12, color:C.t3, fontWeight:500 }}>or continue with email</span>
        <div style={{ flex:1, height:1, background:C.bd }} />
      </div>

      {/* Email */}
      <Input label="Email address" icon={Mail} type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" error={errs.email} onKeyDown={handleKeyDown} />

      {/* Password */}
      <Input label="Password" icon={Lock} type={showPwd?"text":"password"} value={password} onChange={setPassword}
        placeholder="Enter your password" error={errs.password} onKeyDown={handleKeyDown}
        suffix={
          <button onClick={()=>setShowPwd(!showPwd)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:C.t3, padding:0 }}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      {/* Remember me + forgot */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none" }} onClick={()=>setRemember(!remember)}>
          <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${remember?C.p:C.bd}`, background:remember?C.p:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
            {remember && <Check size={11} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ fontSize:13, color:C.t2 }}>Remember me</span>
        </label>
        <a href="/forgot-password" style={{ fontSize:13, color:C.p, fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
      </div>

      {apiError && (
        <div style={{ background:"#F7E3DF", border:"1px solid #E8B8AE", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#8C2A21", display:"flex", alignItems:"center", gap:8 }}>
          <AlertCircle size={15} /> {apiError}
        </div>
      )}

      {/* Submit */}
      <button onClick={submit} disabled={loading}
        style={{ width:"100%", background: loading?C.t3:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:13, padding:"14px", fontSize:15, fontWeight:800, cursor: loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow: loading?"none":`0 8px 24px ${C.p}40`, transition:"all .2s" }}>
        {loading ? "Signing in..." : <><ArrowRight size={18} /> Sign in</>}
      </button>

      {/* Switch to register */}
      <p style={{ textAlign:"center", fontSize:13, color:C.t3, marginTop:22 }}>
        Don't have an account?{" "}
        <button onClick={onSwitch} style={{ background:"none", border:"none", color:C.p, fontWeight:700, fontSize:13, cursor:"pointer", padding:0 }}>
          Create one free →
        </button>
      </p>
    </div>
  );
}

// ── REGISTER FORM ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const { register } = useAuth();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [terms,    setTerms]    = useState(false);
  const [errs,     setErrs]     = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [apiError, setApiError] = useState("");

  const strength = pwStrength(password);

  const submit = async () => {
    const e = validate("register", { name, email, phone, password, confirm, terms });
    setErrs(e);
    if (Object.keys(e).length) return;

    setApiError("");
    setLoading(true);
    try {
      await register({ name, email, phone: `+880${phone}`, password, password_confirmation: confirm, ref: ref || undefined });
      setSuccess(true);
      toast.success("Account created! Welcome to EduBD 🎉");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:C.gLt, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <CheckCircle2 size={36} color={C.g} />
      </div>
      <h3 style={{ fontSize:22, fontWeight:900, color:C.t1, margin:"0 0 8px" }}>Account created!</h3>
      <p style={{ fontSize:14, color:C.t3, margin:"0 0 20px" }}>Check your email to verify your account.</p>
      <div style={{ background:C.pLt, borderRadius:12, padding:"14px 18px", textAlign:"left" }}>
        {["Verify your email address","Complete your profile","Start learning!"].map((s,i)=>(
          <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i<2?12:0 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background: i===0?C.p:C.bd, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: i===0?"#fff":C.t3, flexShrink:0 }}>{i+1}</div>
            <span style={{ fontSize:13, color: i===0?C.t1:C.t3, fontWeight: i===0?600:400 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {/* Social login */}
      <div style={{ display:"flex", gap:10, marginBottom:22 }}>
        <SocialBtn logo="🇬" label="Google" />
        <SocialBtn logo="📘" label="Facebook" />
      </div>

      {/* Divider */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
        <div style={{ flex:1, height:1, background:C.bd }} />
        <span style={{ fontSize:12, color:C.t3, fontWeight:500 }}>or register with email</span>
        <div style={{ flex:1, height:1, background:C.bd }} />
      </div>

      {/* Full name */}
      <Input label="Full name" icon={User} value={name} onChange={setName}
        placeholder="e.g. Tanvir Ahmed" error={errs.name} />

      {/* Email */}
      <Input label="Email address" icon={Mail} type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" error={errs.email} />

      {/* Phone with BD prefix */}
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.t1, marginBottom:7 }}>
          Phone number (for bKash/Nagad payment)
        </label>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:C.bg, border:`1.5px solid ${C.bd}`, borderRadius:12, padding:"0 14px", fontSize:13, fontWeight:700, color:C.t2, flexShrink:0, whiteSpace:"nowrap" }}>
            🇧🇩 +880
          </div>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="1XX XXXX XXXX"
            style={{ flex:1, border:`1.5px solid ${errs.phone?C.r:C.bd}`, borderRadius:12, padding:"13px 14px", fontSize:14, color:C.t1, outline:"none", boxSizing:"border-box", background: errs.phone?C.rLt:C.w }} />
        </div>
        {errs.phone && (
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
            <AlertCircle size={13} color={C.r} />
            <span style={{ fontSize:12, color:C.r }}>{errs.phone}</span>
          </div>
        )}
      </div>

      {/* Password */}
      <Input label="Password" icon={Lock} type={showPwd?"text":"password"} value={password} onChange={setPassword}
        placeholder="Minimum 8 characters" error={errs.password}
        suffix={
          <button onClick={()=>setShowPwd(!showPwd)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:C.t3, padding:0 }}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      {/* Password strength */}
      {password && (
        <div style={{ marginTop:-10, marginBottom:18 }}>
          <div style={{ display:"flex", gap:4, marginBottom:5 }}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{ flex:1, height:4, borderRadius:100, background: i<=strength.score ? strength.color : C.bd, transition:"background .2s" }} />
            ))}
          </div>
          <span style={{ fontSize:12, color:strength.color, fontWeight:600 }}>{strength.label} password</span>
        </div>
      )}

      {/* Confirm password */}
      <Input label="Confirm password" icon={Lock} type={showCon?"text":"password"} value={confirm} onChange={setConfirm}
        placeholder="Re-enter your password" error={errs.confirm}
        suffix={
          <button onClick={()=>setShowCon(!showCon)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:C.t3, padding:0 }}>
            {showCon ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      {/* Terms */}
      <div style={{ marginBottom:22 }}>
        <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", userSelect:"none" }} onClick={()=>setTerms(!terms)}>
          <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${errs.terms?C.r:terms?C.p:C.bd}`, background:terms?C.p:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s", marginTop:1, flexShrink:0 }}>
            {terms && <Check size={11} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ fontSize:13, color:C.t2, lineHeight:1.6 }}>
            I agree to the{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer" style={{ color:C.p, fontWeight:600, textDecoration:"none" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="/contact" target="_blank" rel="noopener noreferrer" style={{ color:C.p, fontWeight:600, textDecoration:"none" }}>Privacy Policy</a>
          </span>
        </label>
        {errs.terms && (
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6, marginLeft:28 }}>
            <AlertCircle size={13} color={C.r} />
            <span style={{ fontSize:12, color:C.r }}>{errs.terms}</span>
          </div>
        )}
      </div>

      {/* Submit */}
      <button onClick={submit} disabled={loading}
        style={{ width:"100%", background: loading?C.t3:`linear-gradient(135deg,${C.a},#8C2A21)`, color:"#fff", border:"none", borderRadius:13, padding:"14px", fontSize:15, fontWeight:800, cursor: loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow: loading?"none":`0 8px 24px ${C.a}40`, transition:"all .2s" }}>
        {loading ? "Creating your account..." : <> Create free account <ArrowRight size={18} /> </>}
      </button>

      {/* Switch to login */}
      <p style={{ textAlign:"center", fontSize:13, color:C.t3, marginTop:22 }}>
        Already have an account?{" "}
        <button onClick={onSwitch} style={{ background:"none", border:"none", color:C.p, fontWeight:700, fontSize:13, cursor:"pointer", padding:0 }}>
          Log in →
        </button>
      </p>
    </div>
  );
}

// ── RIGHT PANEL ───────────────────────────────────────────────────────────────
function RightPanel() {
  const [mode, setMode] = useState("login");
  return (
    <div style={{ flex:1, background:C.w, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px clamp(24px,5vw,60px)", overflowY:"auto" }}>
      <div style={{ width:"100%", maxWidth:440 }}>

        {/* Tab toggle */}
        <div style={{ display:"flex", background:C.bg, borderRadius:14, padding:5, marginBottom:32, border:`1px solid ${C.bd}` }}>
          {[{ id:"login", label:"Log in" },{ id:"register", label:"Create account" }].map(t=>(
            <button key={t.id} onClick={()=>setMode(t.id)}
              style={{ flex:1, padding:"10px 16px", borderRadius:10, border:"none", fontSize:14, fontWeight:700, cursor:"pointer", transition:"all .2s",
                background: mode===t.id ? C.w : "transparent",
                color:      mode===t.id ? C.t1 : C.t3,
                boxShadow:  mode===t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Heading */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(22px,3vw,26px)", fontWeight:600, color:C.t1, margin:"0 0 6px", letterSpacing:"-0.3px" }}>
            {mode === "login" ? "Welcome back 👋" : "Start learning today 🚀"}
          </h1>
          <p style={{ fontSize:14, color:C.t3, margin:0 }}>
            {mode === "login"
              ? "Log in to access your courses and certificates."
              : "Create your free account and join 50,000+ learners."}
          </p>
        </div>

        {/* Form */}
        {mode === "login"
          ? <LoginForm    onSwitch={()=>setMode("register")} />
          : <RegisterForm onSwitch={()=>setMode("login")}    />
        }

        {/* Footer note */}
        <p style={{ textAlign:"center", fontSize:11, color:C.t3, marginTop:24, lineHeight:1.7 }}>
          Protected by 256-bit SSL encryption · Pay with bKash, Nagad or card
        </p>
      </div>
    </div>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  usePageTitle("Login");
  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color:C.t1, display:"flex", minHeight:"100vh" }}>
      <LeftPanel />
      <RightPanel />
    </div>
  );
}
