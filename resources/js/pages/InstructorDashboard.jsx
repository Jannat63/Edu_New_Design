import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Users, DollarSign, Star, Settings,
  Clock, GraduationCap, LogOut, Menu, X, TrendingUp,
  Play, Edit, Plus, FileText, CheckCircle2, AlertCircle,
  ChevronRight, Award, BarChart2, Eye, RefreshCw, Download,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import CurriculumModal from "@/components/CurriculumModal";

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
  { id:"assignments",  label:"Assignments",  icon:FileText        },
  { id:"reviews",      label:"Reviews",      icon:Star            },
  { id:"payouts",      label:"Payouts",        icon:DollarSign      },
  { id:"settings",     label:"Settings",       icon:Settings        },
];

function initials(name) { return (name||"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?"; }

function StatCard({ icon:Icon, label, value, sub, color, bg }) {
  return (
    <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px",display:"flex",gap:16,alignItems:"center"}}>
      <div style={{width:48,height:48,borderRadius:14,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon size={22} color={color}/>
      </div>
      <div>
        <div style={{fontSize:22,fontWeight:900,color:C.t1,letterSpacing:"-0.5px",lineHeight:1}}>{value}</div>
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
              <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name||"Instructor"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>Instructor</div>
            </div>
          </div>
        </div>

        <nav style={{padding:"12px 12px",flex:1,overflowY:"auto"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setActive(n.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:"11px 12px",borderRadius:11,border:"none",cursor:"pointer",textAlign:"left",marginBottom:3,transition:"all .15s",background:active===n.id?"rgba(79,70,229,.25)":"transparent",borderLeft:active===n.id?`3px solid ${C.p}`:"3px solid transparent"}}
              onMouseEnter={e=>{if(active!==n.id)e.currentTarget.style.background="rgba(255,255,255,.05)";}}
              onMouseLeave={e=>{if(active!==n.id)e.currentTarget.style.background="transparent";}}>
              <n.icon size={16} color={active===n.id?C.pMd:"rgba(255,255,255,.4)"}/>
              <span style={{fontSize:13,fontWeight:active===n.id?700:500,color:active===n.id?"#fff":"rgba(255,255,255,.5)"}}>{n.label}</span>
            </button>
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

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewPage({ stats, courses }) {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        <StatCard icon={BookOpen}   label="My Courses"    value={stats.total_courses||courses.length||0}  color={C.p} bg={C.pLt}/>
        <StatCard icon={Users}      label="Total Students" value={(stats.total_students||0).toLocaleString()} color={C.g} bg={C.gLt}/>
        <StatCard icon={DollarSign} label="Total Earnings" value={stats.total_earnings?`৳${Number(stats.total_earnings).toLocaleString()}`:"৳0"} color={C.a} bg={C.aLt}/>
        <StatCard icon={Star}       label="Avg Rating"    value={stats.average_rating?`${Number(stats.average_rating).toFixed(1)}★`:"—"} color={C.y} bg={C.yLt}/>
      </div>

      {courses.length>0&&(
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px 22px"}}>
          <div style={{fontSize:14,fontWeight:800,color:C.t1,marginBottom:16}}>Recent Courses</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {courses.slice(0,4).map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",borderRadius:12,border:`1px solid ${C.bd}`}}>
                <div style={{width:44,height:44,borderRadius:11,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📚</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                  <div style={{fontSize:12,color:C.t3,marginTop:2}}>{c.students_count||0} students · ৳{(c.price||0).toLocaleString()}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:100,background:c.status==="published"?C.gLt:C.yLt,color:c.status==="published"?C.g:C.y}}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── CREATE COURSE MODAL ───────────────────────────────────────────────────────
function CreateCourseModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title:"", subtitle:"", description:"", price:"", level:"Beginner", status:"draft" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Course title is required."); return; }
    if (!form.price) { toast.error("Price is required."); return; }
    setSaving(true);
    try {
      const r = await api.post("/instructor/courses", form);
      toast.success("Course created! Now add your curriculum.");
      onCreated(r.course);
      onClose();
    } catch(e) { toast.error(e.message||"Failed to create course."); }
    finally { setSaving(false); }
  };

  const Fld = ({label, value, onChange, type="text", placeholder, rows}) => (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>{label}</label>
      {rows
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
            style={{width:"100%",boxSizing:"border-box",padding:"9px 12px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:13,color:C.t1,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
            style={{width:"100%",boxSizing:"border-box",padding:"9px 12px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:13,color:C.t1,outline:"none"}}/>
      }
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.w,borderRadius:20,padding:28,width:"100%",maxWidth:520,boxShadow:"0 24px 64px rgba(0,0,0,.25)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>Create New Course</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.t3}}><X size={18}/></button>
        </div>
        <Fld label="Course Title *" value={form.title} onChange={v=>set("title",v)} placeholder="e.g. Complete React Bootcamp"/>
        <Fld label="Subtitle" value={form.subtitle} onChange={v=>set("subtitle",v)} placeholder="Short tagline for the course"/>
        <Fld label="Description" value={form.description} onChange={v=>set("description",v)} rows={4} placeholder="What will students learn?"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Price (৳) *" value={form.price} onChange={v=>set("price",v)} type="number" placeholder="0"/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>Level</label>
            <select value={form.level} onChange={e=>set("level",e.target.value)}
              style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:13,color:C.t1,outline:"none",background:C.w}}>
              {["Beginner","Intermediate","Advanced","All Levels"].map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>Status</label>
          <select value={form.status} onChange={e=>set("status",e.target.value)}
            style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:13,color:C.t1,outline:"none",background:C.w}}>
            <option value="draft">Draft (only you can see)</option>
            <option value="published">Published (visible to students)</option>
          </select>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>
            {saving?"Creating…":"Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MY COURSES ────────────────────────────────────────────────────────────────
function CoursesPage({ courses, loading, onManageCurriculum, onCreateCourse }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
        <button onClick={onCreateCourse} style={{display:"flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <Plus size={15}/> Create New Course
        </button>
      </div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading your courses…</p>}

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {courses.map(c=>(
          <div key={c.id} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px 22px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
              <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>📚</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
                  <span style={{fontSize:15,fontWeight:800,color:C.t1}}>{c.title}</span>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100,background:c.status==="published"?C.gLt:C.yLt,color:c.status==="published"?C.g:C.y}}>{c.status}</span>
                </div>
                <div style={{display:"flex",gap:18,fontSize:12,color:C.t3,flexWrap:"wrap"}}>
                  <span>👥 {c.students_count||0} students</span>
                  <span>💰 ৳{(c.price||0).toLocaleString()}</span>
                  {c.average_rating&&<span>⭐ {c.average_rating}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={()=>onManageCurriculum(c)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  <Play size={13}/> Manage Classes
                </button>
                <Link to="/admin"
                  style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:10,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,fontWeight:600,textDecoration:"none"}}>
                  <Edit size={12}/> Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
        {!loading&&courses.length===0&&(
          <div style={{textAlign:"center",padding:"48px 0",color:C.t3}}>
            <BookOpen size={40} color={C.bd} style={{marginBottom:12}}/>
            <div style={{fontSize:15,fontWeight:600}}>No courses yet.</div>
            <div style={{fontSize:13,marginTop:4}}>Create your first course from the Admin panel.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ASSIGNMENTS PAGE (GRADING) ────────────────────────────────────────────────
function AssignmentsPage({ courses }) {
  const [assignments, setAssignments] = useState([]);
  const [selected,    setSelected]    = useState(null);  // { assignment, submissions }
  const [loading,     setLoading]     = useState(false);
  const [gradingId,   setGradingId]   = useState(null);
  const [gradeForm,   setGradeForm]   = useState({});

  // Load all assignments across instructor's courses
  useEffect(()=>{
    if(courses.length===0) return;
    setLoading(true);
    // Fetch curriculum for each course to get assignment lesson IDs
    Promise.all(
      courses.map(c=>api.get(`/instructor/courses/${c.id}/curriculum`).catch(()=>[]))
    ).then(results=>{
      const asmts=[];
      results.forEach((secs,i)=>{
        (secs||[]).forEach(sec=>{
          (sec.lessons||[]).forEach(l=>{
            if(l.type==="assignment"&&l.assignment){
              asmts.push({ ...l.assignment, course_title:courses[i].title, course_id:courses[i].id, lesson_title:l.title });
            }
          });
        });
      });
      setAssignments(asmts);
    }).finally(()=>setLoading(false));
  },[courses.length]);

  const loadSubmissions=async(a)=>{
    try {
      const r=await api.get(`/instructor/assignments/${a.id}/submissions`);
      setSelected({ assignment:r.assignment, submissions:r.submissions||[], stats:r.stats });
      setGradeForm({});
    } catch(e){ toast.error(e.message||"Failed to load submissions."); }
  };

  const handleGrade=async(subId)=>{
    const f=gradeForm[subId];
    if(f?.score===undefined){ toast.error("Enter a score."); return; }
    try {
      await api.put(`/instructor/assignments/${selected.assignment.id}/submissions/${subId}/grade`,{
        score:parseInt(f.score), feedback:f.feedback||""
      });
      toast.success("Submission graded.");
      setSelected(p=>({...p,submissions:p.submissions.map(s=>s.id===subId?{...s,score:parseInt(f.score),feedback:f.feedback,status:"graded",graded_at:"just now"}:s)}));
      setGradingId(null);
    } catch(e){ toast.error(e.message||"Failed."); }
  };

  const statusBadge=(s)=>{
    if(s==="graded")  return <span style={{background:C.gLt,color:C.g,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100}}>✅ Graded</span>;
    if(s==="pending") return <span style={{background:C.yLt,color:C.y,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100}}>⏳ Pending</span>;
    return <span style={{background:C.bg,color:C.t3,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100}}>{s}</span>;
  };

  if(selected) return (
    <div>
      <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.p,fontSize:13,fontWeight:600,marginBottom:20,padding:0}}>
        ← Back to Assignments
      </button>
      <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,padding:"20px 22px",marginBottom:18}}>
        <div style={{fontSize:16,fontWeight:800,color:C.t1,marginBottom:4}}>{selected.assignment.title}</div>
        <div style={{display:"flex",gap:16,fontSize:13,color:C.t3}}>
          <span>Total submissions: <strong style={{color:C.t1}}>{selected.stats?.total||0}</strong></span>
          <span>Graded: <strong style={{color:C.g}}>{selected.stats?.graded||0}</strong></span>
          <span>Pending: <strong style={{color:C.y}}>{selected.stats?.pending||0}</strong></span>
          {selected.stats?.avg_score!=null&&<span>Avg score: <strong style={{color:C.p}}>{Number(selected.stats.avg_score).toFixed(1)}/{selected.assignment.max_score}</strong></span>}
        </div>
      </div>

      {selected.submissions.length===0&&<p style={{textAlign:"center",padding:40,color:C.t3}}>No submissions yet.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {selected.submissions.map(s=>(
          <div key={s.id} style={{background:C.w,border:`1.5px solid ${s.status==="pending"?C.bd:C.gLt}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {s.student?.avatar
                  ? <img src={s.student.avatar} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover"}} alt=""/>
                  : <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>{initials(s.student?.name)}</div>
                }
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.t1}}>{s.student?.name}</div>
                  <div style={{fontSize:12,color:C.t3}}>{s.student?.email}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {s.status==="graded"&&<span style={{fontSize:18,fontWeight:900,color:C.g}}>{s.score}/{selected.assignment.max_score}</span>}
                {statusBadge(s.status)}
              </div>
            </div>

            <div style={{display:"flex",gap:16,fontSize:12,color:C.t3,marginBottom:10,flexWrap:"wrap"}}>
              <span>Submitted: {s.submitted_at}</span>
              {s.file_name&&<a href={s.file_url} onClick={(e)=>{e.preventDefault();api.download(s.file_url,s.file_name).catch(()=>toast.error("Could not download the file."));}} style={{color:C.p,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}><Download size={12}/>{s.file_name}</a>}
            </div>

            {s.notes&&<p style={{fontSize:13,color:C.t2,background:C.bg,borderRadius:8,padding:"10px 12px",margin:"0 0 10px",lineHeight:1.5}}>"{s.notes}"</p>}

            {s.status==="graded"&&s.feedback&&(
              <div style={{background:C.gLt,borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.g,marginBottom:4}}>YOUR FEEDBACK</div>
                <p style={{fontSize:13,color:C.t2,margin:0,lineHeight:1.5}}>{s.feedback}</p>
              </div>
            )}

            {/* Grade form */}
            {gradingId===s.id
              ? <div style={{background:C.pLt,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.p}44`}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>Score (max {selected.assignment.max_score})</label>
                      <input type="number" min={0} max={selected.assignment.max_score}
                        value={gradeForm[s.id]?.score??""} onChange={e=>setGradeForm(p=>({...p,[s.id]:{...p[s.id],score:e.target.value}}))}
                        style={{width:80,padding:"8px 10px",border:`1.5px solid ${C.p}`,borderRadius:8,fontSize:14,fontWeight:700,textAlign:"center",outline:"none"}}/>
                    </div>
                    <div style={{flex:1,minWidth:200}}>
                      <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>Feedback (optional)</label>
                      <textarea value={gradeForm[s.id]?.feedback||""} onChange={e=>setGradeForm(p=>({...p,[s.id]:{...p[s.id],feedback:e.target.value}}))} rows={2}
                        placeholder="Write feedback for the student…"
                        style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",border:`1.5px solid ${C.bd}`,borderRadius:8,fontSize:13,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button onClick={()=>handleGrade(s.id)} style={{padding:"8px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.g},#2E5640)`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                      <CheckCircle2 size={13}/> Submit Grade
                    </button>
                    <button onClick={()=>setGradingId(null)} style={{padding:"8px 12px",borderRadius:9,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,cursor:"pointer"}}>Cancel</button>
                  </div>
                </div>
              : <button onClick={()=>setGradingId(s.id)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:`1px solid ${s.status==="graded"?C.bd:C.p}`,background:s.status==="graded"?C.w:C.pLt,color:s.status==="graded"?C.t2:C.p,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  {s.status==="graded"?"✏️ Re-grade":"⭐ Grade Submission"}
                </button>
            }
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:16}}>All Assignments Across Your Courses</div>

      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading assignments…</p>}

      {!loading&&assignments.length===0&&(
        <div style={{textAlign:"center",padding:"48px 0",color:C.t3}}>
          <FileText size={40} color={C.bd} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:600}}>No assignments yet.</div>
          <div style={{fontSize:13,marginTop:4}}>Add assignment-type lessons to your courses to see them here.</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {assignments.map((a,i)=>(
          <div key={i} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <div style={{width:44,height:44,borderRadius:12,background:C.yLt,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <FileText size={20} color={C.y}/>
            </div>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontSize:14,fontWeight:700,color:C.t1}}>{a.title}</div>
              <div style={{fontSize:12,color:C.t3,marginTop:2}}>{a.course_title} · Max {a.max_score} pts</div>
            </div>
            <button onClick={()=>loadSubmissions(a)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
              <Eye size={13}/> View Submissions
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REVIEWS PAGE ──────────────────────────────────────────────────────────────
function ReviewsPage({ reviews, loading }) {
  return (
    <div>
      {loading&&<p style={{textAlign:"center",padding:40,color:C.t3}}>Loading reviews…</p>}
      {!loading&&reviews.length===0&&<p style={{textAlign:"center",padding:40,color:C.t3}}>No reviews yet.</p>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {reviews.map((r,i)=>(
          <div key={i} style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.t1}}>{r.student_name}</div>
                <div style={{fontSize:12,color:C.t3}}>{r.course_title}</div>
              </div>
              <div style={{display:"flex",gap:2}}>
                {[1,2,3,4,5].map(s=><span key={s} style={{color:s<=r.rating?C.y:C.bd,fontSize:14}}>★</span>)}
              </div>
            </div>
            {r.comment&&<p style={{fontSize:13,color:C.t2,lineHeight:1.6,margin:0}}>{r.comment}</p>}
            <div style={{fontSize:11,color:C.t3,marginTop:8}}>{r.created_at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
const TITLES = { dashboard:"Overview", courses:"My Courses", assignments:"Assignment Grading", reviews:"Student Reviews", settings:"Settings" };

export default function InstructorDashboard() {
  usePageTitle("Instructor Dashboard");
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [active,      setActive]      = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courses,     setCourses]     = useState([]);
  const [reviews,     setReviews]     = useState([]);
  const [stats,       setStats]       = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [curriculumCourse, setCurriculumCourse] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  useEffect(()=>{
    if(!authLoading&&!user){ navigate("/login"); return; }
    if(!authLoading&&user&&!user.is_instructor&&!user.is_admin){ navigate("/dashboard"); return; }
  },[user,authLoading]);

  useEffect(()=>{
    if(!user) return;
    setDataLoading(true);
    Promise.all([
      api.get("/dashboard/instructor-overview").catch(()=>({})),
    ]).then(([overview])=>{
      setStats(overview?.stats||{});
      setReviews(overview?.recent_reviews||[]);
      setCourses(overview?.courses||[]);
    }).finally(()=>setDataLoading(false));
  },[user]);

  const handleLogout=async()=>{ await logout(); navigate("/"); };

  if(authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${C.pLt}`,borderTopColor:C.p,animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const renderPage=()=>{
    if(active==="dashboard")   return <OverviewPage stats={stats} courses={courses}/>;
    if(active==="courses")     return <CoursesPage courses={courses} loading={dataLoading} onManageCurriculum={c=>setCurriculumCourse(c)}/>;
    if(active==="assignments") return <AssignmentsPage courses={courses}/>;
    if(active==="reviews")     return <ReviewsPage reviews={reviews} loading={dataLoading}/>;
    if(active==="payouts")     return <InstructorPayoutsPage/>;
    return null;
  };

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",color:C.t1,background:C.bg,minHeight:"100vh",display:"flex"}}>
      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} user={user}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh",marginLeft:sidebarOpen?240:0,transition:"margin .25s"}}>
        <div style={{background:C.w,borderBottom:`1px solid ${C.bd}`,height:62,display:"flex",alignItems:"center",gap:14,padding:"0 24px",flexShrink:0}}>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:C.pLt,border:"none",borderRadius:9,padding:"8px 10px",cursor:"pointer",display:"flex",color:C.p}}><Menu size={17}/></button>
          <h1 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0,flex:1}}>{TITLES[active]||active}</h1>
        </div>
        <main style={{flex:1,padding:"28px clamp(16px,3vw,34px)",maxWidth:1100,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
          {renderPage()}
        </main>
      </div>

      {showCreateCourse&&(
        <CreateCourseModal
          onClose={()=>setShowCreateCourse(false)}
          onCreated={(c)=>{ setCourses(p=>[c,...p]); setCurriculumCourse(c); }}
        />
      )}

      {curriculumCourse&&(
        <CurriculumModal
          courseId={curriculumCourse.id}
          courseTitle={curriculumCourse.title}
          onClose={()=>setCurriculumCourse(null)}
          isAdmin={false}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── INSTRUCTOR PAYOUTS PAGE ───────────────────────────────────────────────────
function InstructorPayoutsPage() {
  const [payouts,  setPayouts]  = useState([]);
  const [balance,  setBalance]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ amount:"", method:"bkash", account_number:"" });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    api.get("/instructor/payouts")
      .then(r => setPayouts(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get("/instructor/payouts/balance")
      .then(r => setBalance(r?.balance ?? 0))
      .catch(() => {});
  }, []);

  const handleRequest = async () => {
    if (!form.amount || !form.account_number) { toast.error("All fields required."); return; }
    // Mirrors the server-side check in PayoutController::request() — this is
    // just a fast UX short-circuit, the backend is the real enforcement.
    if (balance !== null && parseFloat(form.amount) > balance) {
      toast.error(`Requested amount exceeds your available balance of ৳${balance.toLocaleString()}.`);
      return;
    }
    setSaving(true);
    try {
      const r = await api.post("/instructor/payouts", { ...form, amount: parseFloat(form.amount) });
      toast.success(r.message || "Request submitted.");
      setPayouts(p => [r.payout, ...p]);
      setBalance(b => b !== null ? Math.max(0, b - parseFloat(form.amount)) : b);
      setModal(false); setForm({ amount:"", method:"bkash", account_number:"" });
    } catch(e) { toast.error(e.message || "Failed."); }
    finally { setSaving(false); }
  };

  const statusColors = { pending:[C.y,C.yLt], processing:[C.p,C.pLt], paid:[C.g,C.gLt], rejected:[C.r,C.rLt] };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:800, color:C.t1, margin:0 }}>Payout Requests</h2>
          <p style={{ fontSize:13, color:C.t3, margin:"4px 0 0" }}>Request your earnings to be transferred via bKash, Nagad, or bank.</p>
          <p style={{ fontSize:13, color:C.t2, margin:"6px 0 0", fontWeight:700 }}>
            Available balance: {balance === null ? "…" : `৳${balance.toLocaleString()}`}
          </p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ display:"flex", alignItems:"center", gap:7, background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:11, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          <DollarSign size={15}/> Request Payout
        </button>
      </div>

      {loading && <p style={{ textAlign:"center", color:C.t3 }}>Loading…</p>}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {payouts.map(p => {
          const [sc,sbg] = statusColors[p.status] || [C.t3, C.bg];
          return (
            <div key={p.id} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontSize:22, fontWeight:900, color:C.t1 }}>৳{(p.amount||0).toLocaleString()}</div>
                <div style={{ fontSize:13, color:C.t3, marginTop:2 }}>{p.method?.toUpperCase()} · {p.account_number}</div>
                <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>{p.created_at}</div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:100, background:sbg, color:sc }}>{p.status}</span>
              {p.status === "paid" && p.paid_at && <span style={{ fontSize:12, color:C.g }}>Paid on {p.paid_at}</span>}
            </div>
          );
        })}
        {!loading && payouts.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:C.t3 }}>
            <DollarSign size={40} color={C.bd} style={{ marginBottom:12 }}/>
            <div>No payout requests yet.</div>
          </div>
        )}
      </div>

      {modal && (
        <div onClick={()=>setModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.w, borderRadius:20, padding:28, width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,.25)" }}>
            <div style={{ fontSize:17, fontWeight:800, color:C.t1, marginBottom:20 }}>Request Payout</div>
            {[
              { label:"Amount (৳)", key:"amount", type:"number", placeholder:"Minimum ৳100" },
              { label:"Account Number", key:"account_number", type:"text", placeholder:"Your bKash/Nagad/bank number" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.t1, marginBottom:5 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                  style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px", border:`1.5px solid ${C.bd}`, borderRadius:10, fontSize:13, color:C.t1, outline:"none" }}/>
              </div>
            ))}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.t1, marginBottom:5 }}>Payment Method</label>
              <select value={form.method} onChange={e=>setForm(p=>({...p,method:e.target.value}))}
                style={{ width:"100%", padding:"10px 13px", border:`1.5px solid ${C.bd}`, borderRadius:10, fontSize:13, color:C.t1, outline:"none", background:C.w }}>
                {["bkash","nagad","rocket","bank"].map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setModal(false)} style={{ padding:"10px 18px", borderRadius:10, border:`1.5px solid ${C.bd}`, background:C.w, color:C.t2, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleRequest} disabled={saving}
                style={{ padding:"10px 22px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving?.7:1 }}>
                {saving ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
