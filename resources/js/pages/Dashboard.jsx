import { useState, useEffect, useRef } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Award, CreditCard, User, Settings,
  Bell, Star, Clock, ChevronRight, Play, Download,
  CheckCircle2, GraduationCap, LogOut,
  BarChart2, BadgeCheck, Menu, X, Target, Upload,
  RefreshCw, ExternalLink, AlertCircle, Camera, Gift,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C", yLt:"#F5E9D4",
  r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
  sidebar:"#171432",
};

const NAV = [
  { id:"dashboard",    label:"Dashboard",    icon:LayoutDashboard },
  { id:"courses",      label:"My Courses",   icon:BookOpen        },
  { id:"certificates", label:"Certificates", icon:Award           },
  { id:"payments",     label:"Payments",     icon:CreditCard      },
  { id:"wishlist",     label:"Wishlist",      icon:BookOpen        },
  { id:"analytics",    label:"Analytics",     icon:BarChart2       },
  { id:"referrals",    label:"Refer & Earn",  icon:Gift, href:"/referrals" },
  { id:"profile",      label:"Profile",       icon:User            },
];

function initials(name) {
  return (name||"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";
}

function ProgressRing({ pct, size=52, stroke=5, color=C.p }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, offset=circ-(pct/100)*circ;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.bd} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset .6s ease"}}/>
    </svg>
  );
}

function StatCard({ icon:Icon, label, value, sub, color, bg }) {
  return (
    <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"22px 20px",display:"flex",gap:16,alignItems:"center"}}>
      <div style={{width:52,height:52,borderRadius:15,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon size={24} color={color}/>
      </div>
      <div>
        <div style={{fontSize:24,fontWeight:900,color:C.t1,letterSpacing:"-0.5px",lineHeight:1}}>{value}</div>
        <div style={{fontSize:13,color:C.t2,fontWeight:500,marginTop:3}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:C.t3,marginTop:2}}>{sub}</div>}
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, open, setOpen, onLogout, user }) {
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:40}}/>}
      <aside style={{position:"fixed",top:0,left:0,bottom:0,zIndex:50,width:240,background:C.sidebar,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s ease",boxShadow:open?"4px 0 32px rgba(0,0,0,.4)":"none"}}>
        <div style={{padding:"20px 22px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <GraduationCap size={19} color="#fff"/>
            </div>
            <span style={{fontFamily:"'Fraunces',serif",color:"#fff",fontWeight:600,fontSize:20,letterSpacing:"-0.2px"}}>Edu<span style={{color:"#D98577",fontStyle:"italic",fontWeight:500}}>BD</span></span>
          </div>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",display:"flex",padding:0}}><X size={18}/></button>
        </div>

        <div style={{padding:"18px 20px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {user?.avatar
              ? <img src={user.avatar} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/>
              : <div style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>{initials(user?.name)}</div>
            }
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name||"Student"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>Student</div>
            </div>
          </div>
        </div>

        <nav style={{padding:"12px 12px",flex:1,overflowY:"auto"}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.25)",textTransform:"uppercase",letterSpacing:".1em",padding:"4px 10px 8px"}}>Main menu</div>
          {NAV.map(n=>(
            n.href ? (
              <Link key={n.id} to={n.href}
                style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:"11px 12px",borderRadius:11,cursor:"pointer",textAlign:"left",marginBottom:3,transition:"all .15s",background:"transparent",borderLeft:"3px solid transparent",textDecoration:"none",boxSizing:"border-box"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                <n.icon size={16} color="rgba(255,255,255,.4)"/>
                <span style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,.5)"}}>{n.label}</span>
              </Link>
            ) : (
            <button key={n.id} onClick={()=>setActive(n.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:"11px 12px",borderRadius:11,border:"none",cursor:"pointer",textAlign:"left",marginBottom:3,transition:"all .15s",background:active===n.id?"rgba(79,70,229,.25)":"transparent",borderLeft:active===n.id?`3px solid ${C.p}`:"3px solid transparent"}}
              onMouseEnter={e=>{if(active!==n.id)e.currentTarget.style.background="rgba(255,255,255,.05)";}}
              onMouseLeave={e=>{if(active!==n.id)e.currentTarget.style.background="transparent";}}>
              <n.icon size={16} color={active===n.id?C.pMd:"rgba(255,255,255,.4)"}/>
              <span style={{fontSize:13,fontWeight:active===n.id?700:500,color:active===n.id?"#fff":"rgba(255,255,255,.5)"}}>{n.label}</span>
            </button>
            )
          ))}
        </nav>

        <div style={{padding:"12px 12px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <button onClick={onLogout}
            style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,.35)",fontSize:13,cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.12)";e.currentTarget.style.color="#D98577";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.35)";}}>
            <LogOut size={15}/> Log out
          </button>
        </div>
      </aside>
    </>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function Topbar({ title, onMenu, user }) {
  return (
    <div style={{background:C.w,borderBottom:`1px solid ${C.bd}`,height:62,display:"flex",alignItems:"center",gap:14,padding:"0 24px",flexShrink:0}}>
      <button onClick={onMenu} style={{background:C.pLt,border:"none",borderRadius:9,padding:"8px 10px",cursor:"pointer",display:"flex",color:C.p}}><Menu size={17}/></button>
      <h1 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0,flex:1}}>{title}</h1>
      {user?.avatar
        ? <img src={user.avatar} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover"}} alt=""/>
        : <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{initials(user?.name)}</div>
      }
    </div>
  );
}

// ── DASHBOARD PAGE ─────────────────────────────────────────────────────────────
function DashboardPage({ stats, courses }) {
  const active = courses.filter(c=>c.progress<100);
  const done   = courses.filter(c=>c.progress>=100);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        <StatCard icon={BookOpen}   label="Enrolled"  value={courses.length}               color={C.p} bg={C.pLt}/>
        <StatCard icon={Target}     label="In Progress" value={active.length}              color={C.a} bg={C.aLt}/>
        <StatCard icon={CheckCircle2} label="Completed" value={done.length}                color={C.g} bg={C.gLt}/>
        <StatCard icon={Award}      label="Certificates" value={stats?.certs||done.length} color={C.y} bg={C.yLt}/>
      </div>

      {active.length>0&&(
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px 22px",marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:16}}>Continue Learning</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {active.slice(0,3).map(c=>(
              <Link key={c.id} to={`/learn/${c.slug}${c.last_lesson_id?`?lesson=${c.last_lesson_id}`:""}`}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:`1px solid ${C.bd}`,textDecoration:"none",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.p}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.bd}>
                <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  {c.emoji||"📚"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                  <div style={{fontSize:11,color:C.t3,marginTop:3}}>
                    {c.completed_lessons||0} / {c.total_lessons||0} lessons · {c.progress||0}% done
                  </div>
                  <div style={{marginTop:6,height:4,background:C.bg,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${c.progress||0}%`,background:`linear-gradient(90deg,${C.p},${C.pMd})`,borderRadius:2}}/>
                  </div>
                </div>
                <Play size={16} color={C.p} fill={C.p}/>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MY COURSES PAGE ────────────────────────────────────────────────────────────
function CoursesPage({ courses, loading }) {
  const [filter, setFilter] = useState("all");
  const filtered = courses.filter(c=>{
    if(filter==="active") return c.progress<100;
    if(filter==="completed") return c.progress>=100;
    return true;
  });

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {[["all","All"],["active","In Progress"],["completed","Completed"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{padding:"8px 16px",borderRadius:10,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:filter===v?C.p:C.w,borderColor:filter===v?C.p:C.bd,color:filter===v?"#fff":C.t2}}>
            {l}
          </button>
        ))}
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading your courses…</p>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {filtered.map(c=>(
          <div key={c.id} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
            <div style={{height:140,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,position:"relative"}}>
              {c.thumbnail
                ? <img src={c.thumbnail} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}} alt=""/>
                : <span style={{position:"relative"}}>{c.emoji||"📚"}</span>
              }
              {c.progress>=100&&(
                <div style={{position:"absolute",top:10,right:10,background:C.g,color:"#fff",borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                  <CheckCircle2 size={12}/> Completed
                </div>
              )}
            </div>
            <div style={{padding:"16px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:C.t1,lineHeight:1.4,flex:1}}>{c.title}</div>
                {c.rating>0 && (
                  <div style={{display:"flex",alignItems:"center",gap:3,fontSize:12,fontWeight:700,color:C.y,flexShrink:0}}>
                    <Star size={11} fill={C.y}/>{c.rating}
                  </div>
                )}
              </div>
              {c.instructor && <div style={{fontSize:12,color:C.t3,marginBottom:12}}>{c.instructor}</div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.t3,marginBottom:8}}>
                <span>{c.completed_lessons||0} / {c.total_lessons||0} lessons</span>
                <span style={{fontWeight:700,color:C.p}}>{c.progress||0}%</span>
              </div>
              <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden",marginBottom:14}}>
                <div style={{height:"100%",width:`${c.progress||0}%`,background:`linear-gradient(90deg,${C.p},${C.pMd})`,borderRadius:3,transition:"width .4s"}}/>
              </div>
              <Link to={`/learn/${c.slug}${c.last_lesson_id?`?lesson=${c.last_lesson_id}`:""}`}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",borderRadius:10,background:c.progress>=100?C.gLt:C.pLt,color:c.progress>=100?C.g:C.p,textDecoration:"none",fontSize:13,fontWeight:700}}>
                {c.progress>=100?<><Award size={14}/> Review Course</>:<><Play size={14} fill={C.p}/> Continue</>}
              </Link>
            </div>
          </div>
        ))}
        {!loading&&filtered.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"48px 0",color:C.t3}}>
            <BookOpen size={40} color={C.bd} style={{marginBottom:12}}/>
            <div style={{fontSize:15,fontWeight:600}}>
              {filter==="completed"?"No completed courses yet.":filter==="active"?"No courses in progress.":"You haven't enrolled in any courses yet."}
            </div>
            <Link to="/courses" style={{display:"inline-block",marginTop:16,padding:"10px 22px",borderRadius:11,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",textDecoration:"none",fontSize:13,fontWeight:700}}>Browse Courses</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CERTIFICATES PAGE ──────────────────────────────────────────────────────────
function CertificatesPage({ certs, loading }) {
  return (
    <div>
      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading certificates…</p>}
      {!loading&&certs.length===0&&(
        <div style={{textAlign:"center",padding:"48px 0",color:C.t3}}>
          <Award size={40} color={C.bd} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:600}}>No certificates yet.</div>
          <div style={{fontSize:13,marginTop:4}}>Complete a course to earn your first certificate.</div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {certs.map(c=>(
          <div key={c.id} style={{background:`linear-gradient(135deg,#1A2044,#4B5390)`,borderRadius:18,padding:"24px",color:"#fff",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-20,right:-20,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
            <div style={{position:"absolute",bottom:-30,left:-30,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
            <div style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:42,height:42,borderRadius:11,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Award size={22} color="#fff"/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:".1em"}}>Certificate of Completion</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#fff",marginTop:1}}>EduBD</div>
                </div>
              </div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.4,marginBottom:12}}>{c.course}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:16}}>Issued: {c.issued_at}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontFamily:"monospace"}}>{c.verify_code}</div>
                {c.download_url&&(
                  <a href={c.download_url} target="_blank" rel="noopener noreferrer"
                    style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:"rgba(255,255,255,.15)",color:"#fff",textDecoration:"none",fontSize:12,fontWeight:600}}>
                    <Download size={12}/> Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PAYMENTS PAGE ──────────────────────────────────────────────────────────────
function PaymentsPage({ payments, loading }) {
  return (
    <div>
      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading payment history…</p>}
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        {!loading&&payments.length===0&&(
          <p style={{textAlign:"center",padding:40,color:C.t3}}>No payments yet.</p>
        )}
        {payments.map((p,i)=>(
          <div key={p.id||i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:8,padding:"14px 20px",borderBottom:`1px solid ${C.bd}`,alignItems:"center",fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{fontWeight:600,color:C.t1}}>{p.course}</div>
              <div style={{fontSize:11,color:C.t3,marginTop:2}}>{p.transaction_id}</div>
            </div>
            <span style={{fontWeight:800,color:C.t1}}>৳{typeof p.amount==="number"?p.amount.toLocaleString():p.amount}</span>
            <span style={{fontSize:12,color:C.t2}}>{p.gateway}</span>
            <span style={{fontSize:12,color:C.t3}}>{p.paid_at}</span>
            <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:p.status==="paid"?C.g:C.y,background:p.status==="paid"?C.gLt:C.yLt,padding:"3px 9px",borderRadius:100}}>
              <CheckCircle2 size={10}/>{p.status==="paid"?"Paid":"Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PROFILE PAGE ──────────────────────────────────────────────────────────────
function ProfilePage({ user, onUserUpdate }) {
  const [form, setForm]     = useState({ name:user?.name||"", email:user?.email||"", phone:user?.phone||"", city:user?.city||"", bio:user?.bio||"" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [pwForm, setPwForm] = useState({ current_password:"", password:"", password_confirmation:"" });
  const [savingPw, setSavingPw] = useState(false);
  const avatarRef           = useRef();

  useEffect(()=>{
    if(user) setForm({ name:user.name||"", email:user.email||"", phone:user.phone||"", city:user.city||"", bio:user.bio||"" });
  },[user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await api.put("/auth/me", form);
      onUserUpdate(r.user||r);
      setSaved(true); setTimeout(()=>setSaved(false),2500);
      toast.success("Profile updated.");
    } catch(e){ toast.error(e.message||"Failed to save."); }
    finally { setSaving(false); }
  };

  const handleAvatar = async (file) => {
    if(!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const r = await api.post("/auth/me/avatar", fd);
      onUserUpdate({ ...user, avatar: r.avatar_url });
      toast.success("Profile picture updated.");
    } catch(e){ toast.error(e.message||"Upload failed."); }
  };

  const handleDeleteAvatar = async () => {
    if(!window.confirm("Remove your profile picture?")) return;
    try {
      await api.delete("/auth/me/avatar");
      onUserUpdate({ ...user, avatar: null });
      toast.success("Profile picture removed.");
    } catch(e){ toast.error(e.message||"Failed."); }
  };

  const handlePwSave = async () => {
    if(!pwForm.password) { toast.error("New password required."); return; }
    if(pwForm.password!==pwForm.password_confirmation) { toast.error("Passwords don't match."); return; }
    setSavingPw(true);
    try {
      await api.put("/auth/me/password", pwForm);
      setPwForm({ current_password:"", password:"", password_confirmation:"" });
      toast.success("Password changed.");
    } catch(e){ toast.error(e.message||"Failed."); }
    finally { setSavingPw(false); }
  };

  const FieldEl=({ label, value, onChange, type="text", rows })=>{
    const s={width:"100%",boxSizing:"border-box",padding:"10px 13px",border:`1.5px solid ${C.bd}`,borderRadius:10,fontSize:13,color:C.t1,outline:"none",fontFamily:"inherit"};
    return (
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>{label}</label>
        {rows?<textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} style={{...s,resize:"vertical"}}/>
          :<input type={type} value={value} onChange={e=>onChange(e.target.value)} style={s}/>}
      </div>
    );
  };

  return (
    <div style={{maxWidth:600}}>
      {/* Avatar */}
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"24px",marginBottom:18,display:"flex",alignItems:"center",gap:20}}>
        <div style={{position:"relative",flexShrink:0}}>
          {user?.avatar
            ? <img src={user.avatar} style={{width:88,height:88,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.bd}`}} alt=""/>
            : <div style={{width:88,height:88,borderRadius:"50%",background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:800,color:"#fff"}}>{initials(user?.name)}</div>
          }
          <button onClick={()=>avatarRef.current?.click()}
            style={{position:"absolute",bottom:2,right:2,width:26,height:26,borderRadius:"50%",background:C.p,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <Camera size={12} color="#fff"/>
          </button>
          <input ref={avatarRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>handleAvatar(e.target.files[0])}/>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C.t1}}>{user?.name}</div>
          <div style={{fontSize:13,color:C.t3,marginTop:3}}>{user?.email}</div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={()=>avatarRef.current?.click()} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.p}`,background:C.pLt,color:C.p,fontSize:12,fontWeight:600,cursor:"pointer"}}>Upload Photo</button>
            {user?.avatar&&<button onClick={handleDeleteAvatar} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.rLt}`,background:C.rLt,color:C.r,fontSize:12,fontWeight:600,cursor:"pointer"}}>Remove</button>}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"24px",marginBottom:18}}>
        <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:18}}>Personal Information</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          <FieldEl label="Full Name"   value={form.name}  onChange={v=>setForm(p=>({...p,name:v}))}/>
          <FieldEl label="Email"       value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} type="email"/>
          <FieldEl label="Phone"       value={form.phone} onChange={v=>setForm(p=>({...p,phone:v}))}/>
          <FieldEl label="City"        value={form.city}  onChange={v=>setForm(p=>({...p,city:v}))}/>
        </div>
        <FieldEl label="Bio" value={form.bio} onChange={v=>setForm(p=>({...p,bio:v}))} rows={3}/>
        <button onClick={handleSave} disabled={saving||saved}
          style={{padding:"11px 24px",borderRadius:11,border:"none",background:saved?C.g:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving||saved?"default":"pointer",display:"flex",alignItems:"center",gap:7}}>
          {saved?<><CheckCircle2 size={14}/> Saved!</>:saving?<><RefreshCw size={14} style={{animation:"spin .6s linear infinite"}}/> Saving…</>:"Save Changes"}
        </button>
      </div>

      {/* Change password */}
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"24px"}}>
        <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:18}}>Change Password</div>
        <FieldEl label="Current Password"      value={pwForm.current_password}      onChange={v=>setPwForm(p=>({...p,current_password:v}))} type="password"/>
        <FieldEl label="New Password"          value={pwForm.password}              onChange={v=>setPwForm(p=>({...p,password:v}))} type="password"/>
        <FieldEl label="Confirm New Password"  value={pwForm.password_confirmation} onChange={v=>setPwForm(p=>({...p,password_confirmation:v}))} type="password"/>
        <button onClick={handlePwSave} disabled={savingPw}
          style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:savingPw?"wait":"pointer",opacity:savingPw?.7:1}}>
          {savingPw?"Saving…":"Update Password"}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
const TITLES = { dashboard:"Dashboard", courses:"My Courses", certificates:"My Certificates", payments:"Payment History", profile:"My Profile" };

export default function Dashboard() {
  usePageTitle("Student Dashboard");
  const navigate         = useNavigate();
  const { user: authUser, loading: authLoading, logout, setUser } = useAuth();

  const [active,   setActive]   = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courses,  setCourses]  = useState([]);
  const [certs,    setCerts]    = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats,    setStats]    = useState({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(()=>{
    if(!authLoading&&!authUser){ navigate("/login"); }
  },[authUser,authLoading]);

  useEffect(()=>{
    if(!authUser) return;
    setDataLoading(true);
    Promise.all([
      api.get("/dashboard/overview").catch(()=>({})),
      api.get("/dashboard/my-courses").catch(()=>[]),
      api.get("/dashboard/certificates").catch(()=>[]),
      api.get("/dashboard/payments").catch(()=>[]),
    ]).then(([dash, myCourses, myCerts, myPayments])=>{
      setStats(dash||{});

      // ── Map raw API fields to the shape this page renders ──────────────────
      // (myCourses() returns enrollment_id/course_id/progress_pct/category-as-string,
      //  not id/progress/instructor/rating — map explicitly rather than guessing.)
      const rawCourses = Array.isArray(myCourses) ? myCourses : (myCourses?.data || []);
      setCourses(rawCourses.map(c => ({
        id:                 c.course_id ?? c.enrollment_id,
        title:              c.title || "",
        slug:               c.slug || "",
        instructor:         "", // not returned by /dashboard/my-courses
        thumbnail:          c.thumbnail || null,
        rating:             0,  // not returned by /dashboard/my-courses
        progress:           Math.round(c.progress_pct || 0),
        completed_lessons:  c.completed_lessons || 0,
        total_lessons:      c.total_lessons || 0,
        last_lesson_id:     null, // not returned — link falls back to course start
        emoji:              "📚",
      })));

      // (certificates() returns course as a {title,slug} object, not a string)
      const rawCerts = Array.isArray(myCerts) ? myCerts : (myCerts?.data || []);
      setCerts(rawCerts.map(c => ({
        id:           c.id,
        course:       c.course?.title || "",
        issued_at:    c.issued_at || "",
        verify_code:  c.cert_code || "",
        download_url: c.pdf_url || null,
      })));

      // (payments/history() returns course as a {title,slug} object too)
      const rawPayments = Array.isArray(myPayments) ? myPayments : (myPayments?.data || []);
      setPayments(rawPayments.map(p => ({
        id:             p.id,
        course:         p.course?.title || (p.bundle ? `${p.bundle.title} (Bundle)` : ""),
        amount:         p.amount || 0,
        gateway:        p.gateway || "",
        transaction_id: p.transaction_id || "",
        paid_at:        p.paid_at || p.created_at || "",
        status:         p.status || "pending",
      })));
    }).finally(()=>setDataLoading(false));
  },[authUser]);

  const handleLogout = async () => { await logout(); navigate("/"); };

  if(authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${C.pLt}`,borderTopColor:C.p,animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const renderPage = () => {
    if(active==="dashboard")    return <DashboardPage stats={stats} courses={courses}/>;
    if(active==="courses")      return <CoursesPage courses={courses} loading={dataLoading}/>;
    if(active==="certificates") return <CertificatesPage certs={certs} loading={dataLoading}/>;
    if(active==="payments")     return <PaymentsPage payments={payments} loading={dataLoading}/>;
    if(active==="profile")      return <ProfilePage user={authUser} onUserUpdate={u=>setUser&&setUser(u)}/>;
    if(active==="wishlist")     return <WishlistPage/>;
    if(active==="analytics")    return <AnalyticsPage courses={courses}/>;
  };

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",color:C.t1,background:C.bg,minHeight:"100vh",display:"flex"}}>
      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} user={authUser}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh",marginLeft:sidebarOpen?240:0,transition:"margin .25s"}}>
        <Topbar title={TITLES[active]||active} onMenu={()=>setSidebarOpen(!sidebarOpen)} user={authUser}/>
        <main style={{flex:1,padding:"28px clamp(16px,3vw,34px)",maxWidth:1100,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
          {renderPage()}
        </main>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── WISHLIST PAGE ────────────────────────────────────────────────────────────
function WishlistPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wishlist")
      .then(r => setItems(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (courseId) => {
    try {
      await api.post(`/wishlist/courses/${courseId}`, {});
      setItems(p => p.filter(i => i.course?.id !== courseId));
      toast.success("Removed from wishlist.");
    } catch(e) { toast.error(e.message || "Failed."); }
  };

  return (
    <div>
      {loading && <p style={{textAlign:"center",padding:40,color:C.t3}}>Loading wishlist…</p>}
      {!loading && items.length === 0 && (
        <div style={{textAlign:"center",padding:"48px 0",color:C.t3}}>
          <BookOpen size={40} color={C.bd} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:600}}>Your wishlist is empty</div>
          <div style={{fontSize:13,marginTop:4}}>Save courses you're interested in for later.</div>
          <Link to="/courses" style={{display:"inline-block",marginTop:16,padding:"10px 22px",borderRadius:11,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",textDecoration:"none",fontSize:13,fontWeight:700}}>Browse Courses</Link>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {items.map(i => {
          const c = i.course;
          return (
            <div key={i.id} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
              <div style={{height:120,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,position:"relative"}}>
                {c?.thumbnail_url
                  ? <img src={c.thumbnail_url} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}} alt=""/>
                  : "📚"}
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:4,lineHeight:1.4}}>{c?.title}</div>
                <div style={{fontSize:13,fontWeight:800,color:C.p,marginBottom:12}}>৳{(c?.price||0).toLocaleString()}</div>
                <div style={{display:"flex",gap:8}}>
                  <Link to={`/course/${c?.slug}`} style={{flex:1,padding:"8px 0",borderRadius:9,background:C.pLt,color:C.p,textDecoration:"none",fontSize:12,fontWeight:700,textAlign:"center"}}>View Course</Link>
                  <button onClick={() => handleRemove(c?.id)} style={{padding:"8px 12px",borderRadius:9,border:`1px solid ${C.rLt}`,background:C.rLt,color:C.r,fontSize:12,fontWeight:600,cursor:"pointer"}}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ANALYTICS PAGE ────────────────────────────────────────────────────────────
function AnalyticsPage({ courses }) {
  const totalLessons  = courses.reduce((a,c) => a + (c.total_lessons||0), 0);
  const doneLessons   = courses.reduce((a,c) => a + (c.completed_lessons||0), 0);
  const avgProgress   = courses.length ? Math.round(courses.reduce((a,c) => a+(c.progress||0), 0)/courses.length) : 0;
  const completed     = courses.filter(c => c.progress >= 100);
  const inProgress    = courses.filter(c => c.progress > 0 && c.progress < 100);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[
          { label:"Courses Enrolled",  value:courses.length,    color:C.p, bg:C.pLt, icon:"📚" },
          { label:"Lessons Completed", value:doneLessons,        color:C.g, bg:C.gLt, icon:"✅" },
          { label:"Courses Completed", value:completed.length,   color:C.a, bg:C.aLt, icon:"🏆" },
          { label:"Avg Progress",      value:`${avgProgress}%`,  color:C.y, bg:C.yLt, icon:"📈" },
        ].map((s,i) => (
          <div key={i} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.color,letterSpacing:"-0.5px"}}>{s.value}</div>
            <div style={{fontSize:12,color:C.t3,marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px 22px",marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:16}}>In Progress</div>
          {inProgress.map(c => (
            <div key={c.id} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{c.title}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.p}}>{c.progress||0}%</span>
              </div>
              <div style={{height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${c.progress||0}%`,background:`linear-gradient(90deg,${C.p},${C.pMd||"#565E96"})`,borderRadius:4,transition:"width .4s"}}/>
              </div>
              <div style={{fontSize:11,color:C.t3,marginTop:4}}>{c.completed_lessons||0} of {c.total_lessons||0} lessons</div>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px 22px"}}>
          <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:14}}>Completed Courses 🎉</div>
          {completed.map(c => (
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:12,background:C.gLt,marginBottom:8}}>
              <span style={{fontSize:20}}>🏆</span>
              <span style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>{c.title}</span>
              <span style={{fontSize:11,fontWeight:700,color:C.g}}>100%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
