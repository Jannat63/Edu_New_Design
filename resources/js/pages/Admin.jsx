import { useState, useEffect, useRef } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Users, CreditCard, FileText, Settings,
  Bell, Search, TrendingUp, ChevronRight, Eye, Edit, Trash2, Plus,
  GraduationCap, LogOut, Menu as MenuIcon, X, CheckCircle2, XCircle,
  Clock, Star, BarChart2, Award, ArrowUpRight, ArrowDownRight, Filter,
  Download, Shield, ToggleLeft, ToggleRight, Save, AlertCircle, Image,
  Tag, Globe, Landmark, Upload, User, Lock, Phone, MapPin, AlignLeft,
  ChevronDown, ChevronUp, RefreshCw, ExternalLink, Layers, Layout,
  MessageSquare, HelpCircle, FileCode, Share2, Megaphone, Link, Move,
  DollarSign,
} from "lucide-react";
import { api } from "@/lib/api";
import CurriculumModal from "@/components/CurriculumModal";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

// ── TOKENS ───────────────────────────────────────────────────────────────────
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

// ── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"overview",         label:"Overview",          icon:LayoutDashboard },
  { id:"courses",          label:"Courses",           icon:BookOpen        },
  { id:"users",            label:"Users",             icon:Users           },
  { id:"payments",         label:"Payments",          icon:CreditCard      },
  { id:"blog",             label:"Blog",              icon:FileText        },
  { id:"payment-methods",  label:"Payment Methods",   icon:Landmark        },
  { id:"notifications",    label:"Notifications",     icon:Bell            },
  { id:"menu",             label:"Mega Menu",         icon:Layers          },
  { id:"cms",              label:"Website Content",   icon:Globe           },
  { id:"settings",         label:"Settings",          icon:Settings        },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(n) { return n>=1000000?`৳${(n/1000000).toFixed(1)}M`:n>=1000?`৳${(n/1000).toFixed(0)}K`:`৳${n}`; }

function Badge({ label, type }) {
  const map = {
    published:[C.g,C.gLt,"Published"], draft:[C.y,C.yLt,"Draft"], archived:[C.t3,C.bg,"Archived"],
    active:[C.g,C.gLt,"Active"], inactive:[C.y,C.yLt,"Inactive"], banned:[C.r,C.rLt,"Banned"],
    paid:[C.g,C.gLt,"Paid"], refunded:[C.r,C.rLt,"Refunded"], pending:[C.y,C.yLt,"Pending"],
    student:[C.p,C.pLt,"Student"], instructor:[C.a,C.aLt,"Instructor"], admin:[C.r,C.rLt,"Admin"],
    bank:[C.p,C.pLt,"Bank"], mobile:[C.g,C.gLt,"Mobile"], card:[C.a,C.aLt,"Card"], other:[C.t3,C.bg,"Other"],
  };
  const [c,bg,text]=map[type||label]||[C.t3,C.bg,label];
  return <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:100,background:bg,color:c}}>{text}</span>;
}

function StatCard({ icon:Icon,label,value,change,up,color,bg,sub }) {
  return (
    <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div style={{width:48,height:48,borderRadius:14,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon size={22} color={color}/>
        </div>
        {change!==undefined&&(
          <div style={{display:"flex",alignItems:"center",gap:3,fontSize:12,fontWeight:700,color:up?C.g:C.r}}>
            {up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>}{change}%
          </div>
        )}
      </div>
      <div style={{fontSize:26,fontWeight:900,color:C.t1,letterSpacing:"-0.8px",lineHeight:1,marginBottom:4}}>{value}</div>
      <div style={{fontSize:13,color:C.t2,fontWeight:500}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:C.t3,marginTop:3}}>{sub}</div>}
    </div>
  );
}

function BarChart({ data,valueKey,color,height=80 }) {
  const max=Math.max(...data.map(d=>d[valueKey]));
  return (
    <div style={{display:"flex",gap:6,alignItems:"flex-end",height}}>
      {data.map((d,i)=>{
        const pct=(d[valueKey]/max)*100;
        const isLast=i===data.length-1;
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:"100%",height:`${pct}%`,borderRadius:"4px 4px 0 0",background:isLast?color:`${color}55`,minHeight:4}}/>
            <span style={{fontSize:10,color:isLast?C.t1:C.t3,fontWeight:isLast?700:400}}>{d.m||d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── REUSABLE MODAL ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width=520 }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.w,borderRadius:20,padding:28,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.t3}}><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type="text", placeholder="", required=false, rows }) {
  const style={width:"100%",boxSizing:"border-box",padding:"11px 13px",border:`1.5px solid ${C.bd}`,borderRadius:10,fontSize:13,color:C.t1,outline:"none",fontFamily:"inherit"};
  const onFocus=e=>e.target.style.borderColor=C.p;
  const onBlur=e=>e.target.style.borderColor=C.bd;
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:6}}>{label}{required&&<span style={{color:C.r}}> *</span>}</label>
      {rows
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...style,resize:"vertical"}} onFocus={onFocus} onBlur={onBlur}/>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={style} onFocus={onFocus} onBlur={onBlur}/>
      }
    </div>
  );
}

function SelectField({ label, value, onChange, options, required=false }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:6}}>{label}{required&&<span style={{color:C.r}}> *</span>}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",boxSizing:"border-box",padding:"11px 13px",border:`1.5px solid ${C.bd}`,borderRadius:10,fontSize:13,color:C.t1,outline:"none",background:C.w}}>
        {options.map(o=>(
          <option key={o.value??o} value={o.value??o}>{o.label??o}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ on, onToggle, label, desc }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${C.bd}`}}>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{label}</div>
        {desc&&<div style={{fontSize:12,color:C.t3,marginTop:2}}>{desc}</div>}
      </div>
      <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer"}}>
        {on?<ToggleRight size={28} color={C.g} fill={C.g}/>:<ToggleLeft size={28} color={C.t3}/>}
      </button>
    </div>
  );
}

function ImgUpload({ label, current, onChange, onRemove }) {
  const ref=useRef();
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:6}}>{label}</label>
      {current
        ? <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src={current} alt="preview" style={{width:80,height:55,objectFit:"cover",borderRadius:8,border:`1px solid ${C.bd}`}}/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button onClick={()=>ref.current.click()} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:`1px solid ${C.p}`,color:C.p,background:C.pLt,cursor:"pointer"}}>Replace</button>
              <button onClick={onRemove} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:`1px solid ${C.rLt}`,color:C.r,background:C.rLt,cursor:"pointer"}}>Remove</button>
            </div>
          </div>
        : <button onClick={()=>ref.current.click()} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",border:`1.5px dashed ${C.bd}`,borderRadius:10,background:C.bg,color:C.t3,fontSize:13,cursor:"pointer",width:"100%",justifyContent:"center"}}>
            <Upload size={15}/> Upload image
          </button>
      }
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&onChange(e.target.files[0])}/>
    </div>
  );
}

function SaveBtn({ loading, saved, onClick, label="Save changes" }) {
  return (
    <button onClick={onClick} disabled={loading||saved}
      style={{padding:"11px 24px",borderRadius:11,border:"none",background:saved?C.g:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:loading||saved?"default":"pointer",display:"flex",alignItems:"center",gap:7,transition:"background .3s"}}>
      {saved?<><CheckCircle2 size={14}/> Saved!</>:loading?<><RefreshCw size={14} style={{animation:"spin .6s linear infinite"}}/> Saving…</>:<><Save size={14}/> {label}</>}
    </button>
  );
}

// ── NOTIFICATION DROPDOWN ─────────────────────────────────────────────────────
function NotifDropdown({ unread, onClose }) {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    api.get("/notifications/recent")
      .then(r=>setItems(r.notifications||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const markAllRead=async()=>{
    try { await api.put("/notifications/read-all",{}); setItems(items.map(n=>({...n,is_read:true}))); }
    catch(e){ toast.error(e.message||"Failed"); }
  };

  return (
    <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:340,background:C.w,border:`1px solid ${C.bd}`,borderRadius:16,boxShadow:"0 16px 40px rgba(0,0,0,.15)",zIndex:300}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:14,fontWeight:800,color:C.t1}}>Notifications {unread>0&&<span style={{background:C.r,color:"#fff",fontSize:10,padding:"2px 6px",borderRadius:100,marginLeft:4}}>{unread}</span>}</span>
        {unread>0&&<button onClick={markAllRead} style={{fontSize:11,color:C.p,fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>Mark all read</button>}
      </div>
      <div style={{maxHeight:320,overflowY:"auto"}}>
        {loading&&<p style={{textAlign:"center",padding:20,color:C.t3,fontSize:13}}>Loading…</p>}
        {!loading&&items.length===0&&<p style={{textAlign:"center",padding:20,color:C.t3,fontSize:13}}>No notifications</p>}
        {items.map(n=>(
          <div key={n.id} style={{padding:"12px 18px",borderBottom:`1px solid ${C.bd}`,background:n.is_read?"transparent":C.pLt,opacity:n.is_read?.7:1}}>
            <div style={{fontSize:13,fontWeight:n.is_read?500:700,color:C.t1,lineHeight:1.4}}>{n.title}</div>
            <div style={{fontSize:12,color:C.t3,marginTop:2}}>{n.message}</div>
            <div style={{fontSize:11,color:C.t3,marginTop:4}}>{n.created_at}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 18px",borderTop:`1px solid ${C.bd}`,textAlign:"center"}}>
        <button onClick={onClose} style={{fontSize:12,color:C.p,fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>View all notifications</button>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, open, setOpen, onLogout, unread }) {
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:40}}/>}
      <aside style={{position:"fixed",top:0,left:0,bottom:0,zIndex:50,width:236,background:C.sidebar,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s ease"}}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <GraduationCap size={19} color="#fff"/>
            </div>
            <div>
              <span style={{fontFamily:"'Fraunces',serif",color:"#fff",fontWeight:600,fontSize:19,letterSpacing:"-0.2px"}}>Edu<span style={{color:"#D98577",fontStyle:"italic",fontWeight:500}}>BD</span></span>
              <div style={{fontSize:9,fontWeight:700,color:C.a,textTransform:"uppercase",letterSpacing:".1em",marginTop:-2}}>Admin Panel</div>
            </div>
          </div>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",padding:0}}><X size={17}/></button>
        </div>

        <nav style={{flex:1,padding:"10px 10px",overflowY:"auto"}}>
          <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.22)",textTransform:"uppercase",letterSpacing:".1em",padding:"4px 10px 8px"}}>Management</div>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setActive(n.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",marginBottom:2,transition:"all .15s",
                background:active===n.id?"rgba(79,70,229,.28)":"transparent",
                borderLeft:active===n.id?`3px solid ${C.p}`:"3px solid transparent"}}
              onMouseEnter={e=>{if(active!==n.id)e.currentTarget.style.background="rgba(255,255,255,.06)";}}
              onMouseLeave={e=>{if(active!==n.id)e.currentTarget.style.background="transparent";}}
            >
              <n.icon size={16} color={active===n.id?C.pMd:"rgba(255,255,255,.4)"}/>
              <span style={{fontSize:13,fontWeight:active===n.id?700:500,color:active===n.id?"#fff":"rgba(255,255,255,.5)",flex:1}}>{n.label}</span>
              {n.id==="notifications"&&unread>0&&(
                <span style={{background:C.r,color:"#fff",fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:100}}>{unread}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{padding:"12px 12px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,.35)",fontSize:13,cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.12)";e.currentTarget.style.color="#D98577";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.35)";}}
          ><LogOut size={15}/> Log out</button>
        </div>
      </aside>
    </>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function Topbar({ title, onMenuClick, unread, onBellClick, showDropdown, onCloseDropdown, onNotifNav }) {
  return (
    <div style={{background:C.w,borderBottom:`1px solid ${C.bd}`,height:62,display:"flex",alignItems:"center",gap:14,padding:"0 24px",flexShrink:0}}>
      <button onClick={onMenuClick} style={{background:C.pLt,border:"none",borderRadius:9,padding:"8px 10px",cursor:"pointer",display:"flex",alignItems:"center",color:C.p}}>
        <MenuIcon size={17}/>
      </button>
      <h1 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0,flex:1}}>{title}</h1>
      <div style={{display:"flex",alignItems:"center",gap:9,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:10,padding:"8px 13px",width:200}}>
        <Search size={14} color={C.t3}/>
        <input placeholder="Search anything..." style={{border:"none",outline:"none",background:"transparent",fontSize:13,color:C.t1,width:"100%"}}/>
      </div>
      <div style={{position:"relative"}}>
        <button onClick={onBellClick} style={{background:C.bg,border:`1px solid ${C.bd}`,borderRadius:10,padding:"9px 11px",cursor:"pointer",display:"flex",position:"relative"}}>
          <Bell size={17} color={C.t2}/>
          {unread>0&&<span style={{position:"absolute",top:6,right:6,width:8,height:8,borderRadius:"50%",background:C.r,border:`2px solid ${C.w}`}}/>}
        </button>
        {showDropdown&&<NotifDropdown unread={unread} onClose={()=>{onCloseDropdown();onNotifNav();}}/>}
      </div>
      <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.a},#8C2A21)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",cursor:"pointer"}}>AD</div>
    </div>
  );
}

// ── OVERVIEW PAGE ─────────────────────────────────────────────────────────────
function OverviewPage({ live }) {
  const MONTHLY=[
    {m:"Jul",rev:820000,users:2100},{m:"Aug",rev:1100000,users:2800},{m:"Sep",rev:1350000,users:3400},
    {m:"Oct",rev:1580000,users:4100},{m:"Nov",rev:1920000,users:4900},{m:"Dec",rev:2240000,users:5800},
  ];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:24}}>
        <StatCard icon={CreditCard} label="Total revenue"  value={live?fmt(live.total_revenue):"৳7.43M"} change={24} up color={C.p} bg={C.pLt} sub="All time"/>
        <StatCard icon={Users}      label="Total students" value={live?live.total_students?.toLocaleString():"43,100"} change={18} up color={C.g} bg={C.gLt}/>
        <StatCard icon={BookOpen}   label="Active courses" value={live?live.published_courses?.toString():"6"} change={5} up color={C.a} bg={C.aLt}/>
        <StatCard icon={BarChart2}  label="Enrollments"    value={live?live.total_enrollments?.toLocaleString():"24,100"} change={16} up color={C.y} bg={C.yLt}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:24}}>
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"22px"}}>
          <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:4}}>Revenue — last 6 months</div>
          <div style={{fontSize:12,color:C.t3,marginBottom:18}}>Monthly earnings in BDT</div>
          <BarChart data={MONTHLY} valueKey="rev" color={C.p} height={100}/>
        </div>
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"22px"}}>
          <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:4}}>New students</div>
          <div style={{fontSize:12,color:C.t3,marginBottom:18}}>Monthly registrations</div>
          <BarChart data={MONTHLY} valueKey="users" color={C.g} height={100}/>
        </div>
      </div>
    </div>
  );
}

// ── COURSES PAGE (FIXED) ──────────────────────────────────────────────────────
function CoursesPage() {
  const [courses,setCourses]=useState([]);
  const [categories,setCategories]=useState([]);
  const [instructors,setInstructors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [modal,setModal]=useState(null); // null | { mode:"add"|"edit", course? }
  const [form,setForm]=useState({});
  const [thumb,setThumb]=useState(null);
  const [thumbPreview,setThumbPreview]=useState(null);
  const [saving,setSaving]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [curriculumCourse,setCurriculumCourse]=useState(null);

  const load=()=>{
    setLoading(true);
    Promise.all([
      api.get("/admin/courses?per_page=100"),
      Promise.resolve([]),
      api.get("/admin/users?role=instructor&per_page=100"),
    ]).then(([cr,_,ur])=>{
      setCourses(cr?.data||[]);
      setInstructors(ur?.data||[]);
    }).catch(()=>{}).finally(()=>setLoading(false));

    // Load categories
  };

  useEffect(()=>{
    load();
    api.get("/admin/blog-categories").then(r=>setCategories(r||[])).catch(()=>{});
  },[]);

  const openAdd=()=>{ setForm({title:"",subtitle:"",description:"",category_id:"",instructor_id:"",price:"",level:"Beginner",status:"draft"}); setThumb(null); setThumbPreview(null); setModal({mode:"add"}); };
  const openEdit=(c)=>{ setForm({title:c.title||"",subtitle:c.subtitle||"",description:c.description||"",category_id:c.category_id||"",instructor_id:c.instructor_id||"",price:c.price||"",level:c.level||"Beginner",status:c.status||"draft"}); setThumb(null); setThumbPreview(c.thumbnail_url||null); setModal({mode:"edit",course:c}); };

  const handleThumb=(file)=>{ setThumb(file); setThumbPreview(URL.createObjectURL(file)); };

  const handleSave=async()=>{
    if(!form.title?.trim()){ toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>{ if(v!==undefined&&v!==null&&v!=="") fd.append(k,v); });
      if(thumb) fd.append("thumbnail",thumb);

      if(modal.mode==="add"){
        await api.post("/admin/courses",fd);
        toast.success("Course created.");
      } else {
        fd.append('_method','PUT'); await api.post(`/admin/courses/${modal.course.id}`,fd);
        toast.success("Course updated.");
      }
      setModal(null); load();
    } catch(e){ toast.error(e.message||"Failed to save."); }
    finally{ setSaving(false); }
  };

  const handleDelete=async(c)=>{
    if(!window.confirm(`Delete "${c.title}"?`)) return;
    setBusyId(c.id);
    try { await api.delete(`/admin/courses/${c.id}`); setCourses(p=>p.filter(x=>x.id!==c.id)); toast.success("Course deleted."); }
    catch(e){ toast.error(e.message||"Delete failed."); }
    finally{ setBusyId(null); }
  };

  const handlePublish=async(c)=>{
    const ns=c.status==="published"?"draft":"published";
    try { await api.post(`/admin/courses/${c.id}/publish`,{status:ns}); setCourses(p=>p.map(x=>x.id===c.id?{...x,status:ns}:x)); toast.success(`Course ${ns}.`); }
    catch(e){ toast.error(e.message||"Failed."); }
  };

  const filtered=courses.filter(c=>{
    const ms=c.title?.toLowerCase().includes(search.toLowerCase())||c.instructor?.toLowerCase().includes(search.toLowerCase());
    return ms&&(filter==="all"||c.status===filter);
  });

  return (
    <>
    <div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:11,padding:"9px 14px",flex:"1 1 200px"}}>
          <Search size={15} color={C.t3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses or instructors..." style={{border:"none",outline:"none",fontSize:13,color:C.t1,background:"transparent",width:"100%"}}/>
        </div>
        <div style={{display:"flex",gap:7}}>
          {[["all","All"],["published","Published"],["draft","Draft"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"9px 16px",borderRadius:10,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:filter===v?C.p:C.w,borderColor:filter===v?C.p:C.bd,color:filter===v?"#fff":C.t2}}>{l}</button>
          ))}
        </div>
        <button onClick={openAdd} style={{display:"flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          <Plus size={15}/> Add course
        </button>
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading courses…</p>}

      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"10px 20px",background:C.bg,fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:".05em"}}>
          <span>Course</span><span>Students</span><span>Rating</span><span>Price</span><span>Status</span><span>Actions</span>
        </div>
        {filtered.map(c=>(
          <div key={c.id} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"13px 20px",borderTop:`1px solid ${C.bd}`,alignItems:"center"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22,flexShrink:0}}>📚</span>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{c.title}</div>
                <div style={{fontSize:11,color:C.t3}}>{c.instructor||"—"}</div>
              </div>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:C.t2}}>{(c.total_students||0).toLocaleString()}</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <Star size={12} fill={C.y} color={C.y}/>
              <span style={{fontSize:13,fontWeight:600}}>{c.average_rating||"—"}</span>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:C.t1}}>৳{(c.price||0).toLocaleString()}</span>
            <Badge type={c.status}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setCurriculumCourse(c)} title="Manage curriculum" style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.gLt}`,background:C.gLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Layers size={13} color={C.g}/></button>
              <button onClick={()=>openEdit(c)} title="Edit" style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={13} color={C.p}/></button>
              <button onClick={()=>handlePublish(c)} title={c.status==="published"?"Unpublish":"Publish"} style={{width:30,height:30,borderRadius:8,border:`1px solid ${c.status==="published"?C.yLt:C.gLt}`,background:c.status==="published"?C.yLt:C.gLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {c.status==="published"?<XCircle size={13} color={C.y}/>:<CheckCircle2 size={13} color={C.g}/>}
              </button>
              <button onClick={()=>handleDelete(c)} disabled={busyId===c.id} style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:busyId===c.id?.5:1}}><Trash2 size={13} color={C.r}/></button>
            </div>
          </div>
        ))}
        {!loading&&filtered.length===0&&<p style={{textAlign:"center",padding:30,color:C.t3}}>No courses found.</p>}
      </div>

      {modal&&(
        <Modal title={modal.mode==="add"?"Add New Course":"Edit Course"} onClose={()=>setModal(null)} width={560}>
          <Field label="Course Title" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} required placeholder="e.g. Complete React & Next.js Bootcamp"/>
          <Field label="Subtitle" value={form.subtitle} onChange={v=>setForm(p=>({...p,subtitle:v}))} placeholder="Short tagline"/>
          <Field label="Description" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} rows={4} placeholder="Course description…"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <SelectField label="Level" value={form.level} onChange={v=>setForm(p=>({...p,level:v}))} options={["Beginner","Intermediate","Advanced","All Levels"].map(v=>({value:v,label:v}))}/>
            <SelectField label="Status" value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={[{value:"draft",label:"Draft"},{value:"published",label:"Published"}]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Price (৳)" value={form.price} onChange={v=>setForm(p=>({...p,price:v}))} type="number" placeholder="0"/>
            <Field label="Discount Price (৳)" value={form.discount_price||""} onChange={v=>setForm(p=>({...p,discount_price:v}))} type="number" placeholder="Optional"/>
          </div>
          <ImgUpload label="Thumbnail" current={thumbPreview} onChange={handleThumb} onRemove={()=>{setThumb(null);setThumbPreview(null);}}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <button onClick={()=>setModal(null)} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>
              {saving?"Saving…":modal.mode==="add"?"Create Course":"Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>

      {curriculumCourse&&(
        <CurriculumModal
          courseId={curriculumCourse.id}
          courseTitle={curriculumCourse.title}
          onClose={()=>setCurriculumCourse(null)}
          isAdmin={true}
        />
      )}
    </>
  );
}

// ── USERS PAGE (ENHANCED) ──────────────────────────────────────────────────────
function UsersPage() {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [editUser,setEditUser]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [editAvatar,setEditAvatar]=useState(null);
  const [editAvatarPreview,setEditAvatarPreview]=useState(null);
  const [saving,setSaving]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [curriculumCourse,setCurriculumCourse]=useState(null);

  const load=()=>{
    setLoading(true);
    api.get("/admin/users?per_page=100")
      .then(r=>setUsers(r?.data||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const openEdit=(u)=>{
    setEditForm({ name:u.name||"", email:u.email||"", phone:u.phone||"", city:u.city||"", bio:"", password:"", role:u.role||"student", is_active:!u.is_banned });
    setEditAvatar(null); setEditAvatarPreview(u.avatar||null); setEditUser(u);
  };

  const handleSaveEdit=async()=>{
    setSaving(true);
    try {
      const fd=new FormData();
      Object.entries(editForm).forEach(([k,v])=>{ if(v!==undefined&&v!=="") fd.append(k, typeof v==="boolean" ? (v?"1":"0") : String(v)); });
      if(editAvatar) fd.append("avatar",editAvatar);
      fd.append('_method','PUT'); await api.post(`/admin/users/${editUser.id}`,fd);
      toast.success(`${editUser.name} updated.`);
      setEditUser(null); load();
    } catch(e){ toast.error(e.message||"Update failed."); }
    finally{ setSaving(false); }
  };

  const handleBan=async(u)=>{
    setBusyId(u.id);
    try {
      if(u.is_banned){ await api.put(`/admin/users/${u.id}/unban`,{}); toast.success(`${u.name} unbanned.`); }
      else { await api.put(`/admin/users/${u.id}/ban`,{}); toast.success(`${u.name} banned.`); }
      load();
    } catch(e){ toast.error(e.message||"Failed."); }
    finally{ setBusyId(null); }
  };

  const handleDelete=async(u)=>{
    if(!window.confirm(`Delete ${u.name}'s account?`)) return;
    setBusyId(u.id);
    try { await api.delete(`/admin/users/${u.id}`); setUsers(p=>p.filter(x=>x.id!==u.id)); toast.success("Account deleted."); }
    catch(e){ toast.error(e.message||"Delete failed."); }
    finally{ setBusyId(null); }
  };

  const filtered=users.filter(u=>{
    const ms=u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase());
    return ms&&(filter==="all"||u.role===filter||(filter==="banned"&&u.is_banned));
  });

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:11,padding:"9px 14px",flex:"1 1 200px"}}>
          <Search size={15} color={C.t3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..." style={{border:"none",outline:"none",fontSize:13,color:C.t1,background:"transparent",width:"100%"}}/>
        </div>
        {[["all","All"],["student","Students"],["instructor","Instructors"],["admin","Admins"],["banned","Banned"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"9px 16px",borderRadius:10,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",background:filter===v?C.p:C.w,borderColor:filter===v?C.p:C.bd,color:filter===v?"#fff":C.t2}}>{l}</button>
        ))}
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading users…</p>}

      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2.5fr 1.5fr 1fr 1fr 1fr 1fr",gap:8,padding:"10px 20px",background:C.bg,fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:".05em"}}>
          <span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Joined</span><span>Actions</span>
        </div>
        {filtered.map(u=>(
          <div key={u.id} style={{display:"grid",gridTemplateColumns:"2.5fr 1.5fr 1fr 1fr 1fr 1fr",gap:8,padding:"12px 20px",borderTop:`1px solid ${C.bd}`,alignItems:"center",fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {u.avatar
                ? <img src={u.avatar} style={{width:34,height:34,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/>
                : <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>
                    {u.name?.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
              }
              <div>
                <div style={{fontWeight:600,color:C.t1}}>{u.name}</div>
                <div style={{fontSize:11,color:C.t3}}>{u.city||"—"}</div>
              </div>
            </div>
            <span style={{color:C.t3,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</span>
            <Badge type={u.role}/>
            <Badge type={u.is_banned?"banned":u.is_active===false?"inactive":"active"}/>
            <span style={{color:C.t3,fontSize:12}}>{u.joined}</span>
            <div style={{display:"flex",gap:5}}>
              <button onClick={()=>openEdit(u)} title="Edit user" style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.pLt}`,background:C.pLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={12} color={C.p}/></button>
              <button onClick={()=>handleBan(u)} disabled={busyId===u.id} title={u.is_banned?"Unban":"Ban"} style={{width:28,height:28,borderRadius:7,border:`1px solid ${u.is_banned?C.bd:C.rLt}`,background:u.is_banned?C.w:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {u.is_banned?<CheckCircle2 size={12} color={C.g}/>:<XCircle size={12} color={C.r}/>}
              </button>
              <button onClick={()=>handleDelete(u)} disabled={busyId===u.id} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12} color={C.r}/></button>
            </div>
          </div>
        ))}
        {!loading&&filtered.length===0&&<p style={{textAlign:"center",padding:30,color:C.t3}}>No users found.</p>}
      </div>

      {/* Edit User Modal */}
      {editUser&&(
        <Modal title={`Edit — ${editUser.name}`} onClose={()=>setEditUser(null)} width={560}>
          <ImgUpload label="Profile Picture" current={editAvatarPreview}
            onChange={f=>{setEditAvatar(f);setEditAvatarPreview(URL.createObjectURL(f));}}
            onRemove={()=>{setEditAvatar(null);setEditAvatarPreview(null);}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Full Name" value={editForm.name} onChange={v=>setEditForm(p=>({...p,name:v}))} required/>
            <Field label="Email" value={editForm.email} onChange={v=>setEditForm(p=>({...p,email:v}))} type="email" required/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Phone" value={editForm.phone} onChange={v=>setEditForm(p=>({...p,phone:v}))} placeholder="+880…"/>
            <Field label="City" value={editForm.city} onChange={v=>setEditForm(p=>({...p,city:v}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <SelectField label="Role" value={editForm.role} onChange={v=>setEditForm(p=>({...p,role:v}))} options={[{value:"student",label:"Student"},{value:"instructor",label:"Instructor"},{value:"admin",label:"Admin"}]}/>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:6}}>Account Status</label>
              <div style={{display:"flex",gap:8}}>
                {[["true","Active"],["false","Inactive"]].map(([v,l])=>(
                  <label key={v} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}>
                    <input type="radio" value={v} checked={String(editForm.is_active)===v} onChange={()=>setEditForm(p=>({...p,is_active:v==="true"}))} style={{accentColor:C.p}}/> {l}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <Field label="New Password" value={editForm.password} onChange={v=>setEditForm(p=>({...p,password:v}))} type="password" placeholder="Leave blank to keep current"/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button onClick={()=>setEditUser(null)} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSaveEdit} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>
              {saving?"Saving…":"Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── PAYMENTS PAGE (TRANSACTIONS) ──────────────────────────────────────────────
function PaymentsPage() {
  const [payments,setPayments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [exporting,setExporting]=useState(false);

  useEffect(()=>{
    api.get("/admin/payments?per_page=50")
      .then(r=>setPayments(r?.data||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.download(`/admin/payments/export?_=${Date.now()}`, `edubd-transactions-${new Date().toISOString().slice(0,10)}.csv`);
    } catch (e) {
      toast.error(e.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:800,color:C.t1}}>All Transactions</span>
          <button onClick={handleExport} disabled={exporting}
            style={{display:"flex",alignItems:"center",gap:6,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:9,padding:"7px 13px",fontSize:12,fontWeight:600,color:C.t2,cursor:exporting?"wait":"pointer",opacity:exporting?.6:1}}>
            {exporting ? <RefreshCw size={13} style={{animation:"spin .6s linear infinite"}}/> : <Download size={13}/>} {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr",gap:8,padding:"9px 20px",background:C.bg,fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:".05em"}}>
          <span>Student</span><span>Course</span><span>Amount</span><span>Method</span><span>Date</span><span>Status</span>
        </div>
        {loading&&<p style={{textAlign:"center",padding:30,color:C.t3}}>Loading…</p>}
        {payments.map(p=>(
          <div key={p.id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr",gap:8,padding:"12px 20px",borderTop:`1px solid ${C.bd}`,alignItems:"center",fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{fontWeight:600,color:C.t1}}>{p.user?.name||"—"}</div>
              <div style={{fontSize:11,color:C.t3}}>{p.transaction_id}</div>
            </div>
            <span style={{color:C.t2,fontSize:12}}>{p.course||"—"}</span>
            <span style={{fontWeight:800,color:p.status==="refunded"?C.r:C.t1}}>{p.status==="refunded"?"-":""}{typeof p.amount==="number"?`৳${p.amount.toLocaleString()}`:p.amount}</span>
            <span style={{color:C.t2,fontSize:12}}>{p.gateway}</span>
            <span style={{color:C.t3,fontSize:12}}>{p.paid_at||p.created_at}</span>
            <Badge type={p.status}/>
          </div>
        ))}
        {!loading&&payments.length===0&&<p style={{textAlign:"center",padding:30,color:C.t3}}>No transactions yet.</p>}
      </div>
    </div>
  );
}

// ── BLOG PAGE (FIXED) ─────────────────────────────────────────────────────────
function BlogPage() {
  const [posts,setPosts]=useState([]);
  const [cats,setCats]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [thumb,setThumb]=useState(null);
  const [thumbPreview,setThumbPreview]=useState(null);
  const [saving,setSaving]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [curriculumCourse,setCurriculumCourse]=useState(null);

  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/admin/blog?per_page=100"),api.get("/admin/blog-categories")])
      .then(([pr,cr])=>{ setPosts(pr?.data||[]); setCats(cr||[]); })
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const blankForm={title:"",content:"",excerpt:"",blog_category_id:"",tags:"",status:"draft",meta_title:"",meta_description:""};

  const openAdd=()=>{ setForm(blankForm); setThumb(null); setThumbPreview(null); setModal({mode:"add"}); };
  const openEdit=async(p)=>{
    try {
      const detail=await api.get(`/admin/blog/${p.id}`);
      setForm({title:detail.title||"",content:detail.content||"",excerpt:detail.excerpt||"",blog_category_id:detail.blog_category_id||"",tags:(detail.tags||[]).join(", "),status:detail.status||"draft",meta_title:detail.meta_title||"",meta_description:detail.meta_description||""});
      setThumb(null); setThumbPreview(detail.thumbnail?`/storage/${detail.thumbnail}`:null);
      setModal({mode:"edit",post:p});
    } catch(e){ toast.error("Could not load post."); }
  };

  const handleSave=async()=>{
    if(!form.title?.trim()){ toast.error("Title is required."); return; }
    if(!form.content?.trim()){ toast.error("Content is required."); return; }
    setSaving(true);
    try {
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>{ if(v!==undefined&&v!==null&&v!=="") fd.append(k,k==="tags"?v:v); });
      if(form.tags) { fd.delete("tags"); form.tags.split(",").map(t=>t.trim()).filter(Boolean).forEach(t=>fd.append("tags[]",t)); }
      if(thumb) fd.append("thumbnail",thumb);
      if(modal.mode==="add"){
        await api.post("/admin/blog",fd);
        toast.success(form.status==="published" ? "Post published — live on the blog now." : "Post saved as Draft — not visible on the blog until you publish it.");
      } else {
        fd.append('_method','PUT'); await api.post(`/admin/blog/${modal.post.id}`,fd);
        toast.success(form.status==="published" ? "Post updated — live on the blog." : "Post saved as Draft — not visible on the blog until you publish it.");
      }
      setModal(null); load();
    } catch(e){ toast.error(e.message||"Failed to save."); }
    finally{ setSaving(false); }
  };

  const handleDelete=async(p)=>{
    if(!window.confirm(`Delete "${p.title}"?`)) return;
    setBusyId(p.id);
    try { await api.delete(`/admin/blog/${p.id}`); setPosts(prev=>prev.filter(x=>x.id!==p.id)); toast.success("Post deleted."); }
    catch(e){ toast.error(e.message||"Delete failed."); }
    finally{ setBusyId(null); }
  };

  const handlePublish=async(p)=>{
    try {
      if(p.status==="published"){ await api.post(`/admin/blog/${p.id}/unpublish`); }
      else { await api.post(`/admin/blog/${p.id}/publish`); }
      load(); toast.success("Status updated.");
    } catch(e){ toast.error(e.message||"Failed."); }
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClick={openAdd} style={{display:"flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <Plus size={15}/> New post
        </button>
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading posts…</p>}

      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr 1fr",gap:8,padding:"10px 20px",background:C.bg,fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:".05em"}}>
          <span>Title</span><span>Category</span><span>Views</span><span>Status</span><span>Actions</span>
        </div>
        {posts.map(p=>(
          <div key={p.id} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr 1fr",gap:8,padding:"14px 20px",borderTop:`1px solid ${C.bd}`,alignItems:"center",fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{fontWeight:600,color:C.t1,lineHeight:1.4}}>{p.title}</div>
              <div style={{fontSize:11,color:C.t3,marginTop:2}}>{p.author||"—"} · {p.published_at||p.updated_at}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,background:C.pLt,color:C.p,padding:"2px 9px",borderRadius:100}}>{p.category||"—"}</span>
            <span style={{fontWeight:600,color:C.t1}}>{(p.views||0).toLocaleString()}</span>
            <Badge type={p.status}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>openEdit(p)} title="Edit" style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={12} color={C.p}/></button>
              <button onClick={()=>handlePublish(p)} title={p.status==="published"?"Unpublish":"Publish"} style={{width:28,height:28,borderRadius:7,border:`1px solid ${p.status==="published"?C.yLt:C.gLt}`,background:p.status==="published"?C.yLt:C.gLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {p.status==="published"?<XCircle size={12} color={C.y}/>:<CheckCircle2 size={12} color={C.g}/>}
              </button>
              <button onClick={()=>handleDelete(p)} disabled={busyId===p.id} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:busyId===p.id?.5:1}}><Trash2 size={12} color={C.r}/></button>
            </div>
          </div>
        ))}
        {!loading&&posts.length===0&&<p style={{textAlign:"center",padding:30,color:C.t3}}>No posts yet. Create your first blog post!</p>}
      </div>

      {modal&&(
        <Modal title={modal.mode==="add"?"New Blog Post":`Edit: ${modal.post?.title?.slice(0,40)}…`} onClose={()=>setModal(null)} width={640}>
          <Field label="Title" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} required placeholder="Post title…"/>
          <Field label="Excerpt" value={form.excerpt} onChange={v=>setForm(p=>({...p,excerpt:v}))} rows={2} placeholder="Short summary (optional)…"/>
          <Field label="Content" value={form.content} onChange={v=>setForm(p=>({...p,content:v}))} rows={10} required placeholder="Write your post content here… (HTML or plain text)"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <SelectField label="Category" value={form.blog_category_id} onChange={v=>setForm(p=>({...p,blog_category_id:v}))}
              options={[{value:"",label:"— None —"},...(cats||[]).map(c=>({value:String(c.id),label:c.name}))]}/>
            <SelectField label="Status" value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={[{value:"draft",label:"Draft"},{value:"published",label:"Published"}]}/>
          </div>
          <Field label="Tags" value={form.tags} onChange={v=>setForm(p=>({...p,tags:v}))} placeholder="react, javascript, tutorial (comma-separated)"/>
          <ImgUpload label="Featured Image" current={thumbPreview} onChange={f=>{setThumb(f);setThumbPreview(URL.createObjectURL(f));}} onRemove={()=>{setThumb(null);setThumbPreview(null);}}/>
          <div style={{background:C.bg,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:12}}>SEO Fields</div>
            <Field label="Meta Title (max 70 chars)" value={form.meta_title} onChange={v=>setForm(p=>({...p,meta_title:v}))} placeholder="Overrides page title in search results"/>
            <Field label="Meta Description (max 160 chars)" value={form.meta_description} onChange={v=>setForm(p=>({...p,meta_description:v}))} rows={2} placeholder="Summary shown in search results…"/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button onClick={()=>setModal(null)} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>
              {saving?"Saving…":modal.mode==="add"?"Publish Post":"Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── PAYMENT METHODS PAGE (NEW) ─────────────────────────────────────────────────
function PaymentMethodsPage() {
  const [methods,setMethods]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [logo,setLogo]=useState(null);
  const [logoPreview,setLogoPreview]=useState(null);
  const [saving,setSaving]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [curriculumCourse,setCurriculumCourse]=useState(null);

  const load=()=>{
    setLoading(true);
    api.get("/admin/payment-methods").then(r=>setMethods(r||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const blank={type:"mobile",name:"",account_name:"",account_number:"",routing_number:"",instructions:"",is_active:true,sort_order:0};
  const openAdd=()=>{ setForm(blank); setLogo(null); setLogoPreview(null); setModal({mode:"add"}); };
  const openEdit=(m)=>{ setForm({type:m.type,name:m.name,account_name:m.account_name||"",account_number:m.account_number||"",routing_number:m.routing_number||"",instructions:m.instructions||"",is_active:m.is_active,sort_order:m.sort_order}); setLogo(null); setLogoPreview(m.logo_url||null); setModal({mode:"edit",method:m}); };

  const handleSave=async()=>{
    if(!form.name?.trim()){ toast.error("Name is required."); return; }
    setSaving(true);
    try {
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>{ fd.append(k, typeof v==="boolean" ? (v?"1":"0") : String(v)); });
      if(logo) fd.append("logo",logo);
      if(modal.mode==="add"){ await api.post("/admin/payment-methods",fd); toast.success("Payment method created."); }
      else { fd.append('_method','PUT'); await api.post(`/admin/payment-methods/${modal.method.id}`,fd); toast.success("Payment method updated."); }
      setModal(null); load();
    } catch(e){ toast.error(e.message||"Failed."); }
    finally{ setSaving(false); }
  };

  const handleDelete=async(m)=>{
    if(!window.confirm(`Delete "${m.name}"?`)) return;
    setBusyId(m.id);
    try { await api.delete(`/admin/payment-methods/${m.id}`); setMethods(p=>p.filter(x=>x.id!==m.id)); toast.success("Deleted."); }
    catch(e){ toast.error(e.message||"Failed."); }
    finally{ setBusyId(null); }
  };

  const handleToggle=async(m)=>{
    try { await api.put(`/admin/payment-methods/${m.id}`,{name:m.name,type:m.type,account_number:m.account_number,routing_number:m.routing_number,instructions:m.instructions,is_active:!m.is_active,sort_order:m.sort_order}); load(); }
    catch(e){ toast.error(e.message||"Failed."); }
  };

  const typeColors={bank:[C.p,C.pLt],mobile:[C.g,C.gLt],card:[C.a,C.aLt],other:[C.t3,C.bg]};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>Payment Methods</h2>
          <p style={{fontSize:13,color:C.t3,margin:"4px 0 0"}}>These payment methods will appear on the checkout page.</p>
        </div>
        <button onClick={openAdd} style={{display:"flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <Plus size={15}/> Add method
        </button>
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading…</p>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {methods.map(m=>{
          const [tc,tbg]=typeColors[m.type]||[C.t3,C.bg];
          return (
            <div key={m.id} style={{background:C.w,border:`1.5px solid ${m.is_active?C.bd:C.bd}`,borderRadius:16,padding:"18px 20px",opacity:m.is_active?1:.65}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {m.logo_url
                    ? <img src={m.logo_url} style={{width:44,height:44,objectFit:"contain",borderRadius:10,border:`1px solid ${C.bd}`}} alt=""/>
                    : <div style={{width:44,height:44,borderRadius:10,background:tbg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                        {m.type==="bank"?"🏦":m.type==="mobile"?"📱":m.type==="card"?"💳":"💰"}
                      </div>
                  }
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:C.t1}}>{m.name}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100,background:tbg,color:tc}}>{m.type}</span>
                  </div>
                </div>
                <button onClick={()=>handleToggle(m)} style={{background:"none",border:"none",cursor:"pointer"}}>
                  {m.is_active?<ToggleRight size={26} color={C.g} fill={C.g}/>:<ToggleLeft size={26} color={C.t3}/>}
                </button>
              </div>
              {m.account_number&&<div style={{fontSize:12,color:C.t2,marginBottom:4}}>Account: <strong>{m.account_number}</strong></div>}
              {m.account_name&&<div style={{fontSize:12,color:C.t2,marginBottom:4}}>Name: {m.account_name}</div>}
              {m.instructions&&<div style={{fontSize:12,color:C.t3,marginTop:8,lineHeight:1.5}}>{m.instructions.slice(0,100)}{m.instructions.length>100?"…":""}</div>}
              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button onClick={()=>openEdit(m)} style={{flex:1,padding:"8px 0",borderRadius:9,border:`1px solid ${C.bd}`,background:C.bg,color:C.t2,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Edit size={12}/> Edit
                </button>
                <button onClick={()=>handleDelete(m)} disabled={busyId===m.id} style={{padding:"8px 14px",borderRadius:9,border:`1px solid ${C.rLt}`,background:C.rLt,color:C.r,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          );
        })}
        {!loading&&methods.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:C.t3}}>
            <Landmark size={40} color={C.bd} style={{marginBottom:12}}/>
            <div>No payment methods added yet.</div>
            <button onClick={openAdd} style={{marginTop:12,padding:"9px 18px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add first method</button>
          </div>
        )}
      </div>

      {modal&&(
        <Modal title={modal.mode==="add"?"Add Payment Method":"Edit Payment Method"} onClose={()=>setModal(null)}>
          <ImgUpload label="Logo / Icon" current={logoPreview} onChange={f=>{setLogo(f);setLogoPreview(URL.createObjectURL(f));}} onRemove={()=>{setLogo(null);setLogoPreview(null);}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <SelectField label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={[{value:"mobile",label:"Mobile Banking"},{value:"bank",label:"Bank Account"},{value:"card",label:"Card Payment"},{value:"other",label:"Other"}]}/>
            <Field label="Method Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} required placeholder="e.g. bKash, Dutch-Bangla"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Account Name" value={form.account_name} onChange={v=>setForm(p=>({...p,account_name:v}))} placeholder="Account holder name"/>
            <Field label="Account Number" value={form.account_number} onChange={v=>setForm(p=>({...p,account_number:v}))} placeholder="Number / IBAN"/>
          </div>
          {form.type==="bank"&&<Field label="Routing Number" value={form.routing_number} onChange={v=>setForm(p=>({...p,routing_number:v}))} placeholder="9-digit routing number"/>}
          <Field label="Payment Instructions" value={form.instructions} onChange={v=>setForm(p=>({...p,instructions:v}))} rows={3} placeholder="Send payment to the number above and enter your TxID…"/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <input type="checkbox" id="pm-active" checked={!!form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} style={{accentColor:C.p}}/>
            <label htmlFor="pm-active" style={{fontSize:13,color:C.t1,cursor:"pointer"}}>Active (visible to students)</label>
          </div>
          <Field label="Sort Order" value={form.sort_order} onChange={v=>setForm(p=>({...p,sort_order:v}))} type="number" placeholder="0"/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button onClick={()=>setModal(null)} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>
              {saving?"Saving…":"Save Method"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── NOTIFICATIONS PAGE (NEW) ──────────────────────────────────────────────────
function NotificationsPage() {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busyId,setBusyId]=useState(null);
  const [curriculumCourse,setCurriculumCourse]=useState(null);

  const load=()=>{
    setLoading(true);
    api.get("/notifications?per_page=50").then(r=>setItems(r?.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const markRead=async(id)=>{
    setBusyId(id);
    try { await api.put(`/notifications/${id}/read`,{}); setItems(p=>p.map(n=>n.id===id?{...n,is_read:true}:n)); }
    catch(e){ toast.error(e.message||"Failed."); }
    finally{ setBusyId(null); }
  };

  const markAllRead=async()=>{
    try { await api.put("/notifications/read-all",{}); setItems(p=>p.map(n=>({...n,is_read:true}))); toast.success("All marked as read."); }
    catch(e){ toast.error(e.message||"Failed."); }
  };

  const deleteNotif=async(id)=>{
    setBusyId(id);
    try { await api.delete(`/notifications/${id}`); setItems(p=>p.filter(n=>n.id!==id)); }
    catch(e){ toast.error(e.message||"Failed."); }
    finally{ setBusyId(null); }
  };

  const clearAll=async()=>{
    if(!window.confirm("Clear all notifications?")) return;
    try { await api.delete("/notifications"); setItems([]); toast.success("Cleared."); }
    catch(e){ toast.error(e.message||"Failed."); }
  };

  const unread=items.filter(n=>!n.is_read).length;
  const typeIcons={info:"ℹ️",success:"✅",warning:"⚠️",error:"❌"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>Notifications {unread>0&&<span style={{background:C.r,color:"#fff",fontSize:12,padding:"2px 8px",borderRadius:100,marginLeft:6}}>{unread}</span>}</h2>
          <p style={{fontSize:13,color:C.t3,margin:"4px 0 0"}}>Recent system and activity notifications.</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {unread>0&&<button onClick={markAllRead} style={{padding:"8px 16px",borderRadius:9,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>Mark all read</button>}
          {items.length>0&&<button onClick={clearAll} style={{padding:"8px 16px",borderRadius:9,border:`1px solid ${C.rLt}`,background:C.rLt,color:C.r,fontSize:12,fontWeight:600,cursor:"pointer"}}>Clear all</button>}
        </div>
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading…</p>}

      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        {items.map((n,i)=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"16px 20px",borderBottom:i<items.length-1?`1px solid ${C.bd}`:"none",background:n.is_read?"transparent":C.pLt}}>
            <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{typeIcons[n.type]||"🔔"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:n.is_read?500:700,color:C.t1}}>{n.title}</div>
              <div style={{fontSize:13,color:C.t2,marginTop:2,lineHeight:1.5}}>{n.message}</div>
              <div style={{fontSize:11,color:C.t3,marginTop:6}}>{n.created_at}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {!n.is_read&&(
                <button onClick={()=>markRead(n.id)} disabled={busyId===n.id} title="Mark as read" style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.gLt}`,background:C.gLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle2 size={13} color={C.g}/></button>
              )}
              <button onClick={()=>deleteNotif(n.id)} disabled={busyId===n.id} title="Delete" style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={13} color={C.r}/></button>
            </div>
          </div>
        ))}
        {!loading&&items.length===0&&(
          <div style={{textAlign:"center",padding:48,color:C.t3}}>
            <Bell size={40} color={C.bd} style={{marginBottom:12}}/>
            <div>No notifications</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MEGA MENU PAGE (NEW) ──────────────────────────────────────────────────────
function MegaMenuPage() {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [curriculumCourse,setCurriculumCourse]=useState(null);

  const load=()=>{
    setLoading(true);
    api.get("/admin/menu").then(r=>setItems(r||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const blank={title:"",url:"",icon:"",parent_id:"",category_group:"",is_featured:false,is_active:true,open_new_tab:false,sort_order:0};
  const openAdd=(parentId="")=>{ setForm({...blank,parent_id:parentId}); setModal({mode:"add"}); };
  const openEdit=(item)=>{ setForm({title:item.title,url:item.url||"",icon:item.icon||"",parent_id:item.parent_id||"",category_group:item.category_group||"",is_featured:item.is_featured,is_active:item.is_active,open_new_tab:item.open_new_tab,sort_order:item.sort_order}); setModal({mode:"edit",item}); };

  const handleSave=async()=>{
    if(!form.title?.trim()){ toast.error("Title required."); return; }
    setSaving(true);
    try {
      const payload={...form,parent_id:form.parent_id||null};
      if(modal.mode==="add"){ await api.post("/admin/menu",payload); toast.success("Menu item created."); }
      else { await api.put(`/admin/menu/${modal.item.id}`,payload); toast.success("Menu item updated."); }
      setModal(null); load();
    } catch(e){ toast.error(e.message||"Failed."); }
    finally{ setSaving(false); }
  };

  const handleDelete=async(id)=>{
    if(!window.confirm("Delete this item? Sub-items will also be deleted.")) return;
    setBusyId(id);
    try { await api.delete(`/admin/menu/${id}`); load(); toast.success("Deleted."); }
    catch(e){ toast.error(e.message||"Failed."); }
    finally{ setBusyId(null); }
  };

  const topLevel=items.filter(i=>!i.parent_id);
  const children=(parentId)=>items.filter(i=>i.parent_id===parentId);
  const topItems=items.filter(i=>!i.parent_id);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>Mega Menu</h2>
          <p style={{fontSize:13,color:C.t3,margin:"4px 0 0"}}>Manage top-level navigation and dropdown items.</p>
        </div>
        <button onClick={()=>openAdd()} style={{display:"flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <Plus size={15}/> Add top-level item
        </button>
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading…</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {topLevel.map(item=>(
          <div key={item.id} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:C.bg,borderBottom:children(item.id).length?`1px solid ${C.bd}`:"none"}}>
              <Move size={14} color={C.t3} style={{cursor:"grab"}}/>
              <span style={{fontSize:16}}>{item.icon||"🔗"}</span>
              <span style={{fontSize:14,fontWeight:700,color:C.t1,flex:1}}>{item.title}</span>
              {item.url&&<span style={{fontSize:12,color:C.t3,flex:1}}>{item.url}</span>}
              {item.category_group&&<span style={{fontSize:11,background:C.pLt,color:C.p,padding:"2px 8px",borderRadius:100,fontWeight:600}}>{item.category_group}</span>}
              {item.is_featured&&<span style={{fontSize:11,background:C.aLt,color:C.a,padding:"2px 8px",borderRadius:100,fontWeight:600}}>Featured</span>}
              <Badge type={item.is_active?"active":"inactive"}/>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>openAdd(String(item.id))} title="Add child item" style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.gLt}`,background:C.gLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={12} color={C.g}/></button>
                <button onClick={()=>openEdit(item)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={12} color={C.p}/></button>
                <button onClick={()=>handleDelete(item.id)} disabled={busyId===item.id} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12} color={C.r}/></button>
              </div>
            </div>
            {children(item.id).map(child=>(
              <div key={child.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px 11px 44px",borderBottom:`1px solid ${C.bd}`}}>
                <ChevronRight size={12} color={C.t3}/>
                <span style={{fontSize:14}}>{child.icon||"·"}</span>
                <span style={{fontSize:13,color:C.t2,flex:1}}>{child.title}</span>
                {child.url&&<span style={{fontSize:12,color:C.t3,flex:1}}>{child.url}</span>}
                {child.is_featured&&<span style={{fontSize:11,background:C.aLt,color:C.a,padding:"2px 8px",borderRadius:100,fontWeight:600}}>Featured</span>}
                <Badge type={child.is_active?"active":"inactive"}/>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={()=>openEdit(child)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={11} color={C.p}/></button>
                  <button onClick={()=>handleDelete(child.id)} disabled={busyId===child.id} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={11} color={C.r}/></button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {!loading&&topLevel.length===0&&(
          <div style={{textAlign:"center",padding:48,background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,color:C.t3}}>
            <Layers size={40} color={C.bd} style={{marginBottom:12}}/>
            <div>No menu items yet. Add top-level navigation items to build your mega menu.</div>
          </div>
        )}
      </div>

      {modal&&(
        <Modal title={modal.mode==="add"?"Add Menu Item":"Edit Menu Item"} onClose={()=>setModal(null)}>
          <Field label="Title" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} required placeholder="e.g. Courses, About, Blog"/>
          <Field label="URL" value={form.url} onChange={v=>setForm(p=>({...p,url:v}))} placeholder="/courses, /about, https://…"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Icon (emoji or name)" value={form.icon} onChange={v=>setForm(p=>({...p,icon:v}))} placeholder="📚 or BookOpen"/>
            <SelectField label="Parent Item" value={form.parent_id} onChange={v=>setForm(p=>({...p,parent_id:v}))}
              options={[{value:"",label:"— Top Level —"},...topItems.map(i=>({value:String(i.id),label:i.title}))]}/>
          </div>
          <Field label="Category Group" value={form.category_group} onChange={v=>setForm(p=>({...p,category_group:v}))} placeholder="e.g. Web Development, Design (groups items in mega menu)"/>
          <Field label="Sort Order" value={form.sort_order} onChange={v=>setForm(p=>({...p,sort_order:v}))} type="number" placeholder="0"/>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {[["is_active","Active (visible in nav)"],["is_featured","Featured (highlighted)"],["open_new_tab","Open in new tab"]].map(([k,l])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
                <input type="checkbox" checked={!!form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.checked}))} style={{accentColor:C.p}}/>{l}
              </label>
            ))}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setModal(null)} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>
              {saving?"Saving…":"Save Item"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── CMS PAGE (NEW) ─────────────────────────────────────────────────────────────
const CMS_TABS=[
  {id:"general",   label:"General",        icon:Settings },
  {id:"hero",      label:"Hero Banner",    icon:Layout   },
  {id:"about",     label:"About Us",       icon:User     },
  {id:"mission",   label:"Mission & Vision",icon:Megaphone},
  {id:"why_us",    label:"Why Choose Us",  icon:Star     },
  {id:"stats",     label:"Statistics",     icon:BarChart2},
  {id:"social",    label:"Social Media",   icon:Share2   },
  {id:"faq",       label:"FAQ",            icon:HelpCircle},
  {id:"legal",     label:"Terms & Privacy",icon:FileCode },
];

function CMSPage() {
  const [tab,setTab]=useState("general");
  const [data,setData]=useState({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [imgFiles,setImgFiles]=useState({});
  const [imgPreviews,setImgPreviews]=useState({});

  useEffect(()=>{
    setLoading(true); setImgFiles({}); setImgPreviews({});
    api.get(`/admin/cms/${tab}`)
      .then(r=>{ const map={}; (r||[]).forEach(s=>map[s.key]=s.value); setData(map); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[tab]);

  const set=(key,val)=>setData(p=>({...p,[key]:val}));

  const handleImg=(key,file)=>{ setImgFiles(p=>({...p,[key]:file})); setImgPreviews(p=>({...p,[key]:URL.createObjectURL(file)})); };
  const handleRemoveImg=(key)=>{ setImgFiles(p=>({...p,[key]:null})); setImgPreviews(p=>({...p,[key]:null})); };

  const handleSave=async()=>{
    setSaving(true);
    try {
      const fd=new FormData();
      Object.entries(data).forEach(([k,v])=>{
        if(v!==null&&v!==undefined){
          fd.append(`settings[${k}]`, typeof v==="object"?JSON.stringify(v):String(v));
        }
      });
      Object.entries(imgFiles).forEach(([k,file])=>{ if(file) fd.append(`images[${k}]`,file); });
      await api.post(`/admin/cms/${tab}`,fd);
      setSaved(true); setTimeout(()=>setSaved(false),2500); toast.success("Content saved.");
    } catch(e){ toast.error(e.message||"Save failed."); }
    finally{ setSaving(false); }
  };

  const renderTab=()=>{
    if(loading) return <p style={{textAlign:"center",padding:40,color:C.t3}}>Loading…</p>;

    if(tab==="general") return (
      <>
        <Field label="Site Name" value={data.site_name||""} onChange={v=>set("site_name",v)} required/>
        <Field label="Tagline" value={data.site_tagline||""} onChange={v=>set("site_tagline",v)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Support Email" value={data.support_email||""} onChange={v=>set("support_email",v)} type="email"/>
          <Field label="Support Phone" value={data.support_phone||""} onChange={v=>set("support_phone",v)} placeholder="+880…"/>
        </div>
        <Field label="Address" value={data.support_address||""} onChange={v=>set("support_address",v)}/>
        <ImgUpload label="Site Logo" current={imgPreviews.site_logo||(data.site_logo?`/storage/${data.site_logo}`:null)} onChange={f=>handleImg("site_logo",f)} onRemove={()=>handleRemoveImg("site_logo")}/>
        <ImgUpload label="Favicon" current={imgPreviews.favicon||(data.favicon?`/storage/${data.favicon}`:null)} onChange={f=>handleImg("favicon",f)} onRemove={()=>handleRemoveImg("favicon")}/>
        <Toggle on={!!data.maintenance_mode} onToggle={()=>set("maintenance_mode",!data.maintenance_mode)} label="Maintenance Mode" desc="Take the site offline for visitors"/>
      </>
    );

    if(tab==="hero") return (
      <>
        <Field label="Hero Title" value={data.hero_title||""} onChange={v=>set("hero_title",v)} required placeholder="Learn Skills That Shape Your Future"/>
        <Field label="Hero Subtitle" value={data.hero_subtitle||""} onChange={v=>set("hero_subtitle",v)} rows={3}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="CTA Button Text" value={data.hero_cta_text||""} onChange={v=>set("hero_cta_text",v)} placeholder="Explore Courses"/>
          <Field label="CTA Button URL" value={data.hero_cta_url||""} onChange={v=>set("hero_cta_url",v)} placeholder="/courses"/>
        </div>
        <Field label="Video URL (optional)" value={data.hero_video_url||""} onChange={v=>set("hero_video_url",v)} placeholder="https://youtube.com/…"/>
        <ImgUpload label="Hero Background Image" current={imgPreviews.hero_image||(data.hero_image?`/storage/${data.hero_image}`:null)} onChange={f=>handleImg("hero_image",f)} onRemove={()=>handleRemoveImg("hero_image")}/>
      </>
    );

    if(tab==="about") return (
      <>
        <Field label="Page Title" value={data.about_title||""} onChange={v=>set("about_title",v)}/>
        <Field label="About Content" value={data.about_content||""} onChange={v=>set("about_content",v)} rows={10} placeholder="Write about your platform…"/>
        <Field label="SEO Meta Title" value={data.about_meta_title||""} onChange={v=>set("about_meta_title",v)} placeholder="About EduBD — Bangladesh's #1 Learning Platform"/>
        <Field label="SEO Meta Description" value={data.about_meta_desc||""} onChange={v=>set("about_meta_desc",v)} rows={2}/>
        <ImgUpload label="About Feature Image" current={imgPreviews.about_image||(data.about_image?`/storage/${data.about_image}`:null)} onChange={f=>handleImg("about_image",f)} onRemove={()=>handleRemoveImg("about_image")}/>
      </>
    );

    if(tab==="mission") return (
      <>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <h4 style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12}}>Mission</h4>
            <Field label="Mission Title" value={data.mission_title||""} onChange={v=>set("mission_title",v)}/>
            <Field label="Mission Content" value={data.mission_content||""} onChange={v=>set("mission_content",v)} rows={6}/>
          </div>
          <div>
            <h4 style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12}}>Vision</h4>
            <Field label="Vision Title" value={data.vision_title||""} onChange={v=>set("vision_title",v)}/>
            <Field label="Vision Content" value={data.vision_content||""} onChange={v=>set("vision_content",v)} rows={6}/>
          </div>
        </div>
      </>
    );

    if(tab==="why_us") {
      const items=Array.isArray(data.why_us_items)?data.why_us_items:[{icon:"",title:"",desc:""}];
      return (
        <>
          <Field label="Section Title" value={data.why_us_title||""} onChange={v=>set("why_us_title",v)}/>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12,marginTop:8}}>Feature Items</div>
          {items.map((item,i)=>(
            <div key={i} style={{background:C.bg,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:600,color:C.t2}}>Item {i+1}</span>
                {items.length>1&&<button onClick={()=>{ const n=[...items]; n.splice(i,1); set("why_us_items",n); }} style={{background:C.rLt,border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,color:C.r,cursor:"pointer"}}>Remove</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:10}}>
                <Field label="Icon" value={item.icon||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],icon:v}; set("why_us_items",n); }} placeholder="Star"/>
                <Field label="Title" value={item.title||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],title:v}; set("why_us_items",n); }}/>
              </div>
              <Field label="Description" value={item.desc||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],desc:v}; set("why_us_items",n); }} rows={2}/>
            </div>
          ))}
          <button onClick={()=>set("why_us_items",[...items,{icon:"",title:"",desc:""}])} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:`1.5px dashed ${C.bd}`,borderRadius:10,background:"transparent",color:C.t3,fontSize:13,cursor:"pointer",width:"100%",justifyContent:"center"}}>
            <Plus size={14}/> Add item
          </button>
        </>
      );
    }

    if(tab==="stats") {
      const items=Array.isArray(data.stats_items)?data.stats_items:[{value:"",label:""}];
      return (
        <>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12}}>Statistics</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {items.map((item,i)=>(
              <div key={i} style={{background:C.bg,borderRadius:12,padding:"14px 16px"}}>
                <Field label="Value" value={item.value||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],value:v}; set("stats_items",n); }} placeholder="50,000+"/>
                <Field label="Label" value={item.label||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],label:v}; set("stats_items",n); }} placeholder="Students"/>
                {items.length>1&&<button onClick={()=>{ const n=[...items]; n.splice(i,1); set("stats_items",n); }} style={{background:C.rLt,border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,color:C.r,cursor:"pointer",width:"100%"}}>Remove</button>}
              </div>
            ))}
          </div>
          <button onClick={()=>set("stats_items",[...items,{value:"",label:""}])} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:`1.5px dashed ${C.bd}`,borderRadius:10,background:"transparent",color:C.t3,fontSize:13,cursor:"pointer",marginTop:10,width:"100%",justifyContent:"center"}}>
            <Plus size={14}/> Add stat
          </button>
        </>
      );
    }

    if(tab==="social") return (
      <>
        {[["social_facebook","Facebook","https://facebook.com/…"],["social_youtube","YouTube","https://youtube.com/…"],["social_twitter","Twitter / X","https://twitter.com/…"],["social_instagram","Instagram","https://instagram.com/…"],["social_linkedin","LinkedIn","https://linkedin.com/…"]].map(([k,l,ph])=>(
          <Field key={k} label={l} value={data[k]||""} onChange={v=>set(k,v)} placeholder={ph} type="url"/>
        ))}
      </>
    );

    if(tab==="faq") {
      const items=Array.isArray(data.faq_items)?data.faq_items:[{q:"",a:""}];
      return (
        <>
          <Field label="Section Title" value={data.faq_title||""} onChange={v=>set("faq_title",v)}/>
          <div style={{marginTop:8}}>
            {items.map((item,i)=>(
              <div key={i} style={{background:C.bg,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.t2}}>Question {i+1}</span>
                  {items.length>1&&<button onClick={()=>{ const n=[...items]; n.splice(i,1); set("faq_items",n); }} style={{background:C.rLt,border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,color:C.r,cursor:"pointer"}}>Remove</button>}
                </div>
                <Field label="Question" value={item.q||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],q:v}; set("faq_items",n); }}/>
                <Field label="Answer" value={item.a||""} onChange={v=>{ const n=[...items]; n[i]={...n[i],a:v}; set("faq_items",n); }} rows={3}/>
              </div>
            ))}
            <button onClick={()=>set("faq_items",[...items,{q:"",a:""}])} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:`1.5px dashed ${C.bd}`,borderRadius:10,background:"transparent",color:C.t3,fontSize:13,cursor:"pointer",width:"100%",justifyContent:"center"}}>
              <Plus size={14}/> Add question
            </button>
          </div>
        </>
      );
    }

    if(tab==="legal") return (
      <>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12}}>Terms & Conditions</div>
          <Field label="" value={data.terms_content||""} onChange={v=>set("terms_content",v)} rows={14} placeholder="Write your Terms & Conditions here…"/>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12}}>Privacy Policy</div>
          <Field label="" value={data.privacy_content||""} onChange={v=>set("privacy_content",v)} rows={14} placeholder="Write your Privacy Policy here…"/>
        </div>
      </>
    );

    return <p style={{color:C.t3}}>Select a section.</p>;
  };

  return (
    <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
      {/* Sidebar tabs */}
      <div style={{width:200,flexShrink:0,background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:16,overflow:"hidden"}}>
        {CMS_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:"none",borderBottom:`1px solid ${C.bd}`,cursor:"pointer",textAlign:"left",background:tab===t.id?C.pLt:"transparent",borderLeft:tab===t.id?`3px solid ${C.p}`:"3px solid transparent"}}>
            <t.icon size={14} color={tab===t.id?C.p:C.t3}/>
            <span style={{fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?C.p:C.t2}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:16,padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:800,color:C.t1,margin:0}}>{CMS_TABS.find(t=>t.id===tab)?.label}</h3>
          <SaveBtn loading={saving} saved={saved} onClick={handleSave}/>
        </div>
        {renderTab()}
      </div>
    </div>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage() {
  const [settings,setSettings]=useState({site_name:"EduBD",site_tagline:"Bangladesh's #1 Online Learning Platform",support_email:"support@edubd.com",maintenance_mode:false});
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    api.get("/admin/settings/general").then(r=>{ const m={}; (r||[]).forEach(s=>m[s.key]=s.value); setSettings(m); }).catch(()=>{});
  },[]);

  const handleSave=async()=>{
    setSaving(true);
    try {
      await api.put("/admin/settings",{settings});
      setSaved(true); setTimeout(()=>setSaved(false),2500); toast.success("Settings saved.");
    } catch(e){ toast.error(e.message||"Failed."); }
    finally{ setSaving(false); }
  };

  return (
    <div style={{maxWidth:700}}>
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"22px 24px",marginBottom:18}}>
        <h3 style={{fontSize:15,fontWeight:800,color:C.t1,margin:"0 0 18px"}}>General settings</h3>
        <Field label="Site name"    value={settings.site_name||""}    onChange={v=>setSettings(p=>({...p,site_name:v}))}/>
        <Field label="Tagline"      value={settings.site_tagline||""} onChange={v=>setSettings(p=>({...p,site_tagline:v}))}/>
        <Field label="Support email" value={settings.support_email||""} onChange={v=>setSettings(p=>({...p,support_email:v}))} type="email"/>
      </div>
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"22px 24px",marginBottom:22}}>
        <h3 style={{fontSize:15,fontWeight:800,color:C.t1,margin:"0 0 4px"}}>Site control</h3>
        <Toggle on={!!settings.maintenance_mode} onToggle={()=>setSettings(p=>({...p,maintenance_mode:!p.maintenance_mode}))} label="Maintenance mode" desc="Take the site offline for visitors while you make changes"/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <SaveBtn loading={saving} saved={saved} onClick={handleSave}/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── TITLES ─────────────────────────────────────────────────────────────────────
const TITLES={overview:"Overview",courses:"Course Management",users:"User Management",payments:"Payments",blog:"Blog Management","payment-methods":"Payment Methods",notifications:"Notifications",menu:"Mega Menu",cms:"Website Content",settings:"Site Settings"};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function Admin() {
  usePageTitle("Admin Panel");
  const navigate=useNavigate();
  const { user,loading,logout }=useAuth();
  const [active,setActive]=useState("overview");
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [overview,setOverview]=useState(null);
  const [unread,setUnread]=useState(0);
  const [showNotifDropdown,setShowNotifDropdown]=useState(false);

  useEffect(()=>{
    if(!loading&&!user){ navigate("/login"); return; }
    if(!loading&&user&&!user.is_admin){ navigate("/dashboard"); return; }
  },[user,loading,navigate]);

  useEffect(()=>{
    if(!user?.is_admin) return;
    api.get("/admin/analytics/overview").then(setOverview).catch(()=>{});
    api.get("/notifications/unread-count").then(r=>setUnread(r?.count||0)).catch(()=>{});
    const timer=setInterval(()=>{
      api.get("/notifications/unread-count").then(r=>setUnread(r?.count||0)).catch(()=>{});
    },60000);
    return()=>clearInterval(timer);
  },[user]);

  const handleLogout=async()=>{ await logout(); toast.info("Logged out."); navigate("/"); };

  const handleNavChange=(id)=>{ setActive(id); setShowNotifDropdown(false); if(id==="notifications") setUnread(0); };

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid ${C.pLt}`,borderTopColor:C.p,margin:"0 auto 16px",animation:"spin .8s linear infinite"}}/>
        <p style={{color:C.t3,fontSize:14}}>Loading admin panel...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const renderPage=()=>{
    if(active==="overview")        return <OverviewPage live={overview}/>;
    if(active==="courses")         return <CoursesPage/>;
    if(active==="users")           return <UsersPage/>;
    if(active==="payments")        return <PaymentsPage/>;
    if(active==="blog")            return <BlogPage/>;
    if(active==="payment-methods") return <PaymentMethodsPage/>;
    if(active==="notifications")   return <NotificationsPage/>;
    if(active==="menu")            return <MegaMenuPage/>;
    if(active==="cms")             return <CMSPage/>;
    if(active==="coupons")         return <CouponsPage/>;
    if(active==="bundles")         return <BundlesPage/>;
    if(active==="payouts")         return <PayoutsPage/>;
    if(active==="settings")        return <SettingsPage/>;
  };

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",color:C.t1,background:C.bg,minHeight:"100vh",display:"flex"}}>
      <Sidebar active={active} setActive={handleNavChange} open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} unread={unread}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh",marginLeft:sidebarOpen?236:0,transition:"margin .25s"}}>
        <Topbar title={TITLES[active]||active} onMenuClick={()=>setSidebarOpen(!sidebarOpen)}
          unread={unread} onBellClick={()=>setShowNotifDropdown(p=>!p)}
          showDropdown={showNotifDropdown} onCloseDropdown={()=>setShowNotifDropdown(false)}
          onNotifNav={()=>handleNavChange("notifications")}/>
        <main style={{flex:1,padding:"26px clamp(16px,3vw,34px)",maxWidth:1260,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
          {renderPage()}
        </main>
      </div>
      {showNotifDropdown&&<div onClick={()=>setShowNotifDropdown(false)} style={{position:"fixed",inset:0,zIndex:100}}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── COUPONS PAGE ───────────────────────────────────────────────────────────────
function CouponsPage() {
  const [coupons,setCoupons]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({code:"",type:"percent",value:"",min_order:"",max_uses:"",is_active:true,expires_at:""});
  const [saving,setSaving]=useState(false);
  const load=()=>{ setLoading(true); api.get("/admin/coupons").then(r=>setCoupons(r||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);
  const blank={code:"",type:"percent",value:"",min_order:"",max_uses:"",is_active:true,expires_at:""};
  const openAdd=()=>{ setForm(blank); setModal({mode:"add"}); };
  const openEdit=c=>{ setForm({code:c.code,type:c.type,value:c.value,min_order:c.min_order||"",max_uses:c.max_uses||"",is_active:c.is_active,expires_at:c.expires_at||""}); setModal({mode:"edit",coupon:c}); };
  const handleSave=async()=>{
    if(!form.code||!form.value){ toast.error("Code and value required."); return; }
    setSaving(true);
    try {
      if(modal.mode==="add"){ await api.post("/admin/coupons",{...form,value:parseFloat(form.value)}); toast.success("Coupon created."); }
      else { await api.put(`/admin/coupons/${modal.coupon.id}`,{...form,value:parseFloat(form.value)}); toast.success("Coupon updated."); }
      setModal(null); load();
    } catch(e){ toast.error(e.message||"Failed."); } finally{ setSaving(false); }
  };
  const handleDelete=async id=>{ if(!window.confirm("Delete coupon?")) return; await api.delete(`/admin/coupons/${id}`); load(); };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
        <button onClick={openAdd} style={{display:"flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}><Plus size={15}/> Add Coupon</button>
      </div>
      {loading&&<p style={{textAlign:"center",color:C.t3}}>Loading…</p>}
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"10px 20px",background:C.bg,fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase"}}>
          <span>Code</span><span>Type</span><span>Value</span><span>Uses</span><span>Expires</span><span>Actions</span>
        </div>
        {coupons.map(c=>(
          <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"13px 20px",borderTop:`1px solid ${C.bd}`,alignItems:"center",fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontFamily:"monospace",fontWeight:700,color:C.p}}>{c.code}</span>
            <Badge type={c.type==="percent"?"student":"instructor"} label={c.type==="percent"?"Percent":"Fixed"}/>
            <span style={{fontWeight:700}}>{c.type==="percent"?`${c.value}%`:`৳${c.value}`}</span>
            <span style={{color:C.t2}}>{c.used_count}/{c.max_uses||"∞"}</span>
            <span style={{color:C.t3,fontSize:12}}>{c.expires_at||"Never"}</span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>openEdit(c)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={12} color={C.p}/></button>
              <button onClick={()=>handleDelete(c.id)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12} color={C.r}/></button>
            </div>
          </div>
        ))}
        {!loading&&coupons.length===0&&<p style={{textAlign:"center",padding:30,color:C.t3}}>No coupons yet.</p>}
      </div>
      {modal&&(
        <Modal title={modal.mode==="add"?"Add Coupon":"Edit Coupon"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Code" value={form.code} onChange={v=>setForm(p=>({...p,code:v.toUpperCase()}))} required placeholder="SUMMER20"/>
            <SelectField label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={[{value:"percent",label:"Percent (%)"},{value:"fixed",label:"Fixed (৳)"}]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Field label={form.type==="percent"?"Discount %":"Discount ৳"} value={form.value} onChange={v=>setForm(p=>({...p,value:v}))} type="number" required/>
            <Field label="Max Uses" value={form.max_uses} onChange={v=>setForm(p=>({...p,max_uses:v}))} type="number" placeholder="Unlimited"/>
            <Field label="Expires At" value={form.expires_at} onChange={v=>setForm(p=>({...p,expires_at:v}))} type="date"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <input type="checkbox" checked={!!form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} style={{accentColor:C.p}}/>
            <label style={{fontSize:13,color:C.t1}}>Active</label>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setModal(null)} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"Saving…":"Save"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── BUNDLES PAGE ───────────────────────────────────────────────────────────────
function BundlesPage() {
  const [bundles,setBundles]=useState([]);
  const [loading,setLoading]=useState(true);
  const load=()=>{ setLoading(true); api.get("/admin/bundles").then(r=>setBundles(r||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);
  const handleDelete=async id=>{ if(!window.confirm("Delete bundle?")) return; await api.delete(`/admin/bundles/${id}`); toast.success("Deleted."); load(); };
  return (
    <div>
      <div style={{marginBottom:16,padding:"16px 20px",background:`linear-gradient(135deg,${C.p}15,${C.p}08)`,borderRadius:14,border:`1px solid ${C.pLt}`}}>
        <div style={{fontSize:13,color:C.t2}}>Bundle multiple courses together at a discounted price. Create attractive packages for students.</div>
      </div>
      {loading&&<p style={{textAlign:"center",color:C.t3}}>Loading…</p>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {bundles.map(b=>(
          <div key={b.id} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
            <div style={{height:100,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>📦</div>
            <div style={{padding:"16px"}}>
              <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:4}}>{b.title}</div>
              <div style={{fontSize:13,color:C.t3,marginBottom:10}}>{b.courses?.length||0} courses included</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <span style={{fontSize:20,fontWeight:900,color:C.p}}>৳{b.price?.toLocaleString()}</span>
                {b.original_price&&<span style={{fontSize:13,color:C.t3,textDecoration:"line-through"}}>৳{b.original_price?.toLocaleString()}</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>handleDelete(b.id)} style={{flex:1,padding:"8px 0",borderRadius:9,border:`1px solid ${C.rLt}`,background:C.rLt,color:C.r,fontSize:12,fontWeight:600,cursor:"pointer"}}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!loading&&bundles.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:C.t3}}>No bundles yet. Create your first course bundle.</div>}
      </div>
    </div>
  );
}

// ── PAYOUTS PAGE ───────────────────────────────────────────────────────────────
function PayoutsPage() {
  const [payouts,setPayouts]=useState([]);
  const [loading,setLoading]=useState(true);
  const load=()=>{ setLoading(true); api.get("/admin/payouts").then(r=>setPayouts(r||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);
  const handleUpdate=async(id,status)=>{
    try { await api.put(`/admin/payouts/${id}`,{status}); load(); toast.success("Payout updated."); }
    catch(e){ toast.error(e.message||"Failed."); }
  };
  const statusColors={pending:[C.y,C.yLt],processing:[C.p,C.pLt],paid:[C.g,C.gLt],rejected:[C.r,C.rLt]};
  return (
    <div>
      {loading&&<p style={{textAlign:"center",color:C.t3}}>Loading…</p>}
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"10px 20px",background:C.bg,fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase"}}>
          <span>Instructor</span><span>Amount</span><span>Method</span><span>Account</span><span>Status</span><span>Actions</span>
        </div>
        {payouts.map(p=>{
          const [sc,sbg]=statusColors[p.status]||[C.t3,C.bg];
          return (
            <div key={p.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"13px 20px",borderTop:`1px solid ${C.bd}`,alignItems:"center",fontSize:13}}>
              <div>
                <div style={{fontWeight:600,color:C.t1}}>{p.instructor?.name}</div>
                <div style={{fontSize:11,color:C.t3}}>{p.created_at}</div>
              </div>
              <span style={{fontWeight:800,color:C.t1}}>৳{(p.amount||0).toLocaleString()}</span>
              <span style={{textTransform:"capitalize",color:C.t2}}>{p.method}</span>
              <span style={{fontSize:11,color:C.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.account_number}</span>
              <span style={{display:"inline-flex",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:100,background:sbg,color:sc}}>{p.status}</span>
              <div style={{display:"flex",gap:5}}>
                {p.status==="pending"&&<button onClick={()=>handleUpdate(p.id,"paid")} style={{fontSize:11,padding:"5px 10px",borderRadius:7,border:"none",background:C.gLt,color:C.g,fontWeight:700,cursor:"pointer"}}>Mark Paid</button>}
                {p.status==="pending"&&<button onClick={()=>handleUpdate(p.id,"rejected")} style={{fontSize:11,padding:"5px 10px",borderRadius:7,border:"none",background:C.rLt,color:C.r,fontWeight:700,cursor:"pointer"}}>Reject</button>}
              </div>
            </div>
          );
        })}
        {!loading&&payouts.length===0&&<p style={{textAlign:"center",padding:30,color:C.t3}}>No payout requests yet.</p>}
      </div>
    </div>
  );
}
