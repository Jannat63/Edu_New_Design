import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Play, Pause, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight,
  ChevronDown, Check, CheckCircle2, Circle, FileText, HelpCircle,
  GraduationCap, BookOpen, Download, Award, X, Clock, Menu, Lock,
  Upload, AlertCircle, Star, RefreshCw, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import DiscussionBoard from "@/components/DiscussionBoard";
import DoubtAssistant from "@/components/DoubtAssistant";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
  dark:"#171432", dark2:"#232049", dark3:"#312C63",
};

// ── VIDEO HELPERS ─────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? m[1] : null;
}
function isYouTube(url) { return !!(getYouTubeId(url)); }

// Bunny Stream videos are stored as their iframe embed URL (see
// BunnyStreamService::playbackUrl and its comment for why — short version:
// avoids needing hls.js for cross-browser HLS playback). Detected the same
// way YouTube is: check the URL shape, then render via iframe below instead
// of the custom <video> player.
function isBunnyEmbed(url) { return !!url && /iframe\.mediadelivery\.net\/embed\//.test(url); }

function LessonIcon({ type, size=13 }) {
  if (type==="video")      return <Play      size={size} color={C.p} fill={C.p}/>;
  if (type==="quiz")       return <HelpCircle size={size} color={C.a}/>;
  if (type==="resource")   return <Download  size={size} color={C.g}/>;
  if (type==="assignment") return <FileText  size={size} color={C.y}/>;
  return <BookOpen size={size} color={C.t3}/>;
}

function fmtTime(s) {
  const m=Math.floor(s/60); const sec=s%60;
  return `${m}:${String(sec).padStart(2,"0")}`;
}

// ── VIDEO PLAYER ──────────────────────────────────────────────────────────────
function VideoPlayer({ url, onProgress, onComplete, lessonId }) {
  const videoRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [muted,   setMuted]     = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [pct,      setPct]      = useState(0);
  const progressSaved = useRef(false);

  const ytId = getYouTubeId(url);

  // For YouTube — use iframe, no custom controls
  if (ytId) {
    return (
      <div style={{position:"relative",paddingTop:"56.25%",background:"#000",borderRadius:0}}>
        <iframe
          style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}}
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }

  // For Bunny Stream — also iframe, same reasoning as YouTube above (see
  // isBunnyEmbed). Known gap, shared with the YouTube path: no onProgress/
  // onComplete wiring through an iframe, so completion tracking doesn't fire
  // for either video source today — see UPGRADE_PLAN.md Phase 3 item 7.
  if (isBunnyEmbed(url)) {
    return (
      <div style={{position:"relative",paddingTop:"56.25%",background:"#000",borderRadius:0}}>
        <iframe
          style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}}
          src={url}
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }

  // Direct video file — custom controls
  const toggle=()=>{ const v=videoRef.current; if(!v)return; playing?v.pause():v.play(); setPlaying(!playing); };
  const seek=(e)=>{ const v=videoRef.current; if(!v||!duration)return; const rect=e.currentTarget.getBoundingClientRect(); v.currentTime=(e.clientX-rect.left)/rect.width*duration; };

  const handleTimeUpdate=()=>{
    const v=videoRef.current; if(!v) return;
    setCurrent(Math.floor(v.currentTime));
    const p=duration>0?(v.currentTime/v.duration)*100:0;
    setPct(p);
    if(p>10&&!progressSaved.current){ progressSaved.current=true; onProgress(Math.floor(v.currentTime)); }
    if(p>=90) onComplete();
  };

  return (
    <div style={{background:"#000",position:"relative",userSelect:"none"}} onClick={toggle}>
      {url
        ? <video ref={videoRef} src={url} style={{width:"100%",display:"block",maxHeight:"56vw"}}
            onTimeUpdate={handleTimeUpdate} onLoadedMetadata={e=>setDuration(Math.floor(e.target.duration))}
            onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onClick={e=>e.stopPropagation()}/>
        : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:320,color:C.t3,flexDirection:"column",gap:12}}>
            <AlertCircle size={40}/><span>No video available for this lesson.</span>
          </div>
      }
      {/* Controls */}
      {url&&(
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.8)",padding:"24px 16px 12px"}} onClick={e=>e.stopPropagation()}>
          <div onClick={seek} style={{height:4,background:"rgba(255,255,255,.25)",borderRadius:2,cursor:"pointer",marginBottom:10}}>
            <div style={{height:"100%",width:`${pct}%`,background:C.p,borderRadius:2}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={toggle} style={{background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex"}}>
              {playing?<Pause size={20}/>:<Play size={20} fill="#fff"/>}
            </button>
            <button onClick={()=>{const v=videoRef.current;if(v){v.muted=!v.muted;setMuted(!muted);}}} style={{background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex"}}>
              {muted?<VolumeX size={18}/>:<Volume2 size={18}/>}
            </button>
            <span style={{fontSize:12,color:"rgba(255,255,255,.7)",flex:1}}>{fmtTime(current)} / {fmtTime(duration)}</span>
            <button onClick={()=>videoRef.current?.requestFullscreen?.()} style={{background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex"}}>
              <Maximize size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ASSIGNMENT SUBMISSION ──────────────────────────────────────────────────────
function AssignmentPanel({ assignmentId, lessonId, onComplete }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [file, setFile]         = useState(null);
  const [notes, setNotes]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{
    if(!assignmentId) return;
    setLoading(true);
    api.get(`/assignments/${assignmentId}`)
      .then(setData).catch(()=>toast.error("Could not load assignment."))
      .finally(()=>setLoading(false));
  },[assignmentId]);

  const handleSubmit=async()=>{
    if(!file){ toast.error("Please select a file to upload."); return; }
    setSubmitting(true);
    try {
      const fd=new FormData();
      fd.append("file",file);
      if(notes) fd.append("notes",notes);
      const r=await api.post(`/assignments/${assignmentId}/submit`,fd);
      toast.success("Assignment submitted!");
      setData(p=>({...p,submission:r.submission}));
      onComplete();
    } catch(e){ toast.error(e.message||"Submission failed."); }
    finally{ setSubmitting(false); }
  };

  if(loading) return <div style={{padding:40,textAlign:"center",color:C.t3}}>Loading assignment…</div>;
  if(!data)   return <div style={{padding:40,textAlign:"center",color:C.t3}}>Assignment not found.</div>;

  const sub=data.submission;

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
        <div style={{width:44,height:44,borderRadius:12,background:C.yLt||"#F5E9D4",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <FileText size={22} color={C.y}/>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:C.y,textTransform:"uppercase",letterSpacing:".06em"}}>Assignment</div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.t1,margin:0}}>{data.title}</h2>
        </div>
      </div>

      {data.description&&(
        <div style={{background:C.bg,borderRadius:14,padding:"16px 20px",marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:8}}>Description</div>
          <p style={{fontSize:14,color:C.t2,lineHeight:1.7,margin:0}}>{data.description}</p>
        </div>
      )}

      {data.instructions&&(
        <div style={{background:"#F5E9D4",borderRadius:14,padding:"16px 20px",marginBottom:20,border:"1px solid #EDE1D6"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.y,marginBottom:8}}>Instructions</div>
          <p style={{fontSize:14,color:C.t2,lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{data.instructions}</p>
        </div>
      )}

      <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
        <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 18px",flex:1,minWidth:130}}>
          <div style={{fontSize:11,color:C.t3,marginBottom:4}}>Max Score</div>
          <div style={{fontSize:22,fontWeight:800,color:C.t1}}>{data.max_score} pts</div>
        </div>
        <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 18px",flex:1,minWidth:130}}>
          <div style={{fontSize:11,color:C.t3,marginBottom:4}}>Accepted Files</div>
          <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{data.accepted_file_types}</div>
        </div>
        <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 18px",flex:1,minWidth:130}}>
          <div style={{fontSize:11,color:C.t3,marginBottom:4}}>Max File Size</div>
          <div style={{fontSize:22,fontWeight:800,color:C.t1}}>{data.max_file_size_mb} MB</div>
        </div>
      </div>

      {/* Submission result */}
      {sub&&(
        <div style={{background:sub.status==="graded"?C.gLt:"#DFEBEA",border:`1.5px solid ${sub.status==="graded"?C.g:"#3F8A8A"}`,borderRadius:14,padding:"20px 24px",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:800,color:sub.status==="graded"?C.g:"#1C4444"}}>
              {sub.status==="graded"?"✅ Graded":"⏳ Submitted — Awaiting Review"}
            </div>
            {sub.status==="graded"&&<div style={{fontSize:24,fontWeight:900,color:C.g}}>{sub.score}/{data.max_score}</div>}
          </div>
          <div style={{fontSize:13,color:C.t2}}>Submitted: <strong>{sub.submitted_at}</strong></div>
          {sub.file_name&&<div style={{fontSize:13,color:C.t2,marginTop:4}}>File: <a href={sub.file_url} onClick={(e)=>{e.preventDefault();api.download(sub.file_url,sub.file_name).catch(()=>toast.error("Could not download the file."));}} style={{color:C.p,fontWeight:600,cursor:"pointer"}}>{sub.file_name}</a></div>}
          {sub.feedback&&<div style={{marginTop:12,padding:"12px 16px",background:"rgba(255,255,255,.6)",borderRadius:10}}>
            <div style={{fontSize:12,fontWeight:700,color:C.t3,marginBottom:6}}>INSTRUCTOR FEEDBACK</div>
            <p style={{fontSize:13,color:C.t1,lineHeight:1.6,margin:0}}>{sub.feedback}</p>
          </div>}
        </div>
      )}

      {/* Upload form */}
      {(!sub||sub.status==="pending")&&(
        <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:16,padding:"24px"}}>
          <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:16}}>{sub?"Re-submit Assignment":"Submit Assignment"}</div>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:8}}>Upload File <span style={{color:C.r}}>*</span></label>
            <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"24px",border:`2px dashed ${file?C.g:C.bd}`,borderRadius:12,cursor:"pointer",background:file?C.gLt:C.bg,transition:"all .2s"}}>
              <Upload size={28} color={file?C.g:C.t3}/>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:600,color:file?C.g:C.t2}}>{file?file.name:"Click to upload or drag and drop"}</div>
                <div style={{fontSize:12,color:C.t3,marginTop:4}}>Accepted: {data.accepted_file_types} · Max {data.max_file_size_mb}MB</div>
              </div>
              <input type="file" style={{display:"none"}} onChange={e=>setFile(e.target.files[0]||null)}
                accept={data.accepted_file_types.split(",").map(t=>`.${t.trim()}`).join(",")}/>
            </label>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:8}}>Notes (optional)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Add any notes for your instructor…"
              style={{width:"100%",boxSizing:"border-box",padding:"11px 13px",border:`1.5px solid ${C.bd}`,borderRadius:10,fontSize:13,color:C.t1,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
          </div>

          <button onClick={handleSubmit} disabled={submitting||!file}
            style={{padding:"12px 28px",borderRadius:11,border:"none",background:submitting||!file?"#D9D0C0":`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:14,fontWeight:700,cursor:submitting||!file?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
            {submitting?<><RefreshCw size={14} style={{animation:"spin .6s linear infinite"}}/> Submitting…</>:<><Upload size={14}/> Submit Assignment</>}
          </button>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── TOP BAR ───────────────────────────────────────────────────────────────────
function TopBar({ course, done, total, sidebarOpen, setSidebarOpen }) {
  const pct=total>0?Math.round((done/total)*100):0;
  return (
    <div style={{background:C.dark,height:56,display:"flex",alignItems:"center",gap:14,padding:"0 18px",borderBottom:"1px solid rgba(255,255,255,.08)",flexShrink:0}}>
      <Link to={course?`/course/${course.slug}`:"/courses"} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none",flexShrink:0}}>
        <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <GraduationCap size={14} color="#fff"/>
        </div>
        <span style={{fontFamily:"'Fraunces',serif",color:"#fff",fontWeight:600,fontSize:17,letterSpacing:"-0.2px"}}>Edu<span style={{color:"#D98577",fontStyle:"italic",fontWeight:500}}>BD</span></span>
      </Link>

      <div style={{width:1,height:22,background:"rgba(255,255,255,.12)"}}/>
      <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.7)",flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{course?.title||"Loading…"}</div>

      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{width:120,height:6,background:"rgba(255,255,255,.12)",borderRadius:3}}>
          <div style={{height:"100%",width:`${pct}%`,background:C.g,borderRadius:3,transition:"width .4s"}}/>
        </div>
        <span style={{fontSize:12,color:"rgba(255,255,255,.5)",whiteSpace:"nowrap"}}>{pct}% done</span>
      </div>

      <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"rgba(255,255,255,.07)",border:"none",borderRadius:8,padding:"7px 9px",cursor:"pointer",display:"flex",color:"rgba(255,255,255,.6)"}}>
        <Menu size={16}/>
      </button>
    </div>
  );
}

// ── CURRICULUM SIDEBAR ────────────────────────────────────────────────────────
function dripUnlockMessage(availableAt) {
  if (!availableAt) return "Not yet available";
  const d = new Date(availableAt);
  const days = Math.ceil((d - new Date()) / 86400000);
  const dateStr = d.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
  return days <= 1 ? `Unlocks tomorrow (${dateStr})` : days <= 0 ? `Unlocks today` : `Unlocks ${dateStr}`;
}

function Sidebar({ sections, currentId, onSelect, completed, open }) {
  const [expanded, setExpanded] = useState({});

  useEffect(()=>{
    // Auto-expand the section that contains the current lesson
    sections.forEach((sec,i)=>{
      if(sec.lessons.some(l=>l.id===currentId)){
        setExpanded(p=>({...p,[i]:true}));
      }
    });
  },[currentId,sections]);

  return (
    <div style={{width:320,background:C.dark2,flexShrink:0,overflowY:"auto",transition:"width .25s",display:open?"flex":"none",flexDirection:"column",borderLeft:"1px solid rgba(255,255,255,.07)"}}>
      <div style={{padding:"18px 18px 10px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".1em"}}>Course content</div>
      </div>
      {sections.map((sec,i)=>(
        <div key={sec.id}>
          <button onClick={()=>setExpanded(p=>({...p,[i]:!p[i]}))}
            style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"13px 18px",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.05)",cursor:"pointer",textAlign:"left"}}>
            <span style={{flex:1,fontSize:12,fontWeight:700,color:"rgba(255,255,255,.7)",lineHeight:1.4}}>{sec.title}</span>
            <ChevronDown size={14} color="rgba(255,255,255,.3)" style={{transform:expanded[i]?"rotate(180deg)":"rotate(0)",transition:"transform .2s",flexShrink:0}}/>
          </button>
          {expanded[i]&&sec.lessons.map(l=>{
            const done=completed.has(l.id);
            const active=l.id===currentId;
            const dripLocked=l.drip_locked;
            // l.locked means "not a preview and not enrolled" — distinct
            // from drip_locked. A lesson can be locked for either reason
            // independently; previously only dripLocked was checked here,
            // so an unenrolled user saw every non-preview lesson as freely
            // clickable and got no explanation when it 403'd.
            const enrollLocked = l.locked && !dripLocked;
            const isLocked = dripLocked || enrollLocked;
            return (
              <button key={l.id} onClick={()=>{
                  if(!isLocked) onSelect(l.id);
                  else if(dripLocked) toast.info(dripUnlockMessage(l.available_at));
                  else toast.info("Enroll in this course to unlock this lesson.");
                }}
                style={{width:"100%",display:"flex",alignItems:"flex-start",gap:10,padding:"11px 18px 11px 28px",background:active?"rgba(79,70,229,.25)":"transparent",border:"none",borderLeft:active?`3px solid ${C.p}`:"3px solid transparent",cursor:"pointer",textAlign:"left",borderBottom:"1px solid rgba(255,255,255,.03)",opacity:isLocked?.55:1}}>
                <div style={{marginTop:2,flexShrink:0}}>
                  {dripLocked?<Clock size={13} color="rgba(255,255,255,.4)"/>:enrollLocked?<Lock size={13} color="rgba(255,255,255,.4)"/>:done?<CheckCircle2 size={14} color={C.g} fill={C.g}/>:<LessonIcon type={l.type} size={13}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:active?700:500,color:active?"#fff":"rgba(255,255,255,.55)",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.25)",marginTop:3,display:"flex",gap:6}}>
                    {dripLocked ? <span style={{color:"rgba(255,255,255,.4)"}}>{dripUnlockMessage(l.available_at)}</span> : enrollLocked ? <span style={{color:"rgba(255,255,255,.4)"}}>Enroll to unlock</span> : (
                      <>
                        <span style={{textTransform:"capitalize"}}>{l.type}</span>
                        {l.duration&&l.type!=="assignment"&&<span>· {l.duration}</span>}
                        {l.is_preview&&<span style={{color:C.g}}>· Free</span>}
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Learn() {
  const { slug }        = useParams();
  const [params, setParams] = useSearchParams();
  const navigate        = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [course,    setCourse]    = useState(null);
  const [sections,  setSections]  = useState([]);
  const [lesson,    setLesson]    = useState(null);     // full lesson detail
  const [completed, setCompleted] = useState(new Set());
  const [loading,   setLoading]   = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEnrolled,  setIsEnrolled]  = useState(false);

  const currentLessonId = parseInt(params.get("lesson")) || null;

  // ── Flatten all lessons for prev/next navigation ──────────────────────────
  const allLessons = sections.flatMap(s=>s.lessons);

  // ── Load curriculum ───────────────────────────────────────────────────────
  useEffect(()=>{
    if(authLoading) return;
    if(!user){ navigate("/login"); return; }

    setLoading(true);
    Promise.all([
      api.get(`/courses/${slug}`),
      api.get(`/courses/${slug}/lessons`),
    ]).then(([courseData, currData])=>{
      setCourse(courseData);
      setSections(currData.sections||[]);
      setIsEnrolled(currData.is_enrolled||false);

      // Mark completed lessons
      const doneIds=new Set();
      (currData.sections||[]).forEach(s=>s.lessons.forEach(l=>{ if(l.is_completed) doneIds.add(l.id); }));
      setCompleted(doneIds);

      // Navigate to first lesson if none selected
      if(!params.get("lesson")){
        const first=(currData.sections||[])[0]?.lessons?.[0];
        if(first) setParams({lesson:first.id},{replace:true});
      }
    }).catch(e=>{
      toast.error("Could not load course.");
      if(e.status===403) navigate(`/course/${slug}`);
    }).finally(()=>setLoading(false));
  },[slug,user,authLoading]);

  // ── Load lesson detail when ID changes ────────────────────────────────────
  useEffect(()=>{
    if(!currentLessonId) return;
    setLessonLoading(true);
    api.get(`/lessons/${currentLessonId}`)
      .then(setLesson)
      .catch(e=>{
        if (e.status === 403 && e.payload?.available_at) {
          toast.error(dripUnlockMessage(e.payload.available_at) + ".");
        } else if (e.status === 403) {
          // Not drip-locked (no available_at) but still 403 — means the
          // viewer isn't enrolled and this isn't a preview lesson.
          // Previously this fell through both branches with zero feedback,
          // leaving the learner staring at a blank "select a lesson" panel.
          toast.error(e.message || "You need to enroll in this course to access this lesson.");
          navigate(`/course/${slug}`);
        } else {
          toast.error("Could not load lesson.");
        }
      })
      .finally(()=>setLessonLoading(false));
  },[currentLessonId]);

  const selectLesson=(id)=>{ setParams({lesson:id}); };

  const handleProgress=useCallback((positionSeconds)=>{
    if(!currentLessonId) return;
    api.post(`/lessons/${currentLessonId}/progress`,{position_seconds:positionSeconds}).catch(()=>{});
  },[currentLessonId]);

  const handleComplete=useCallback(async()=>{
    if(!currentLessonId||completed.has(currentLessonId)) return;
    try {
      await api.post(`/lessons/${currentLessonId}/complete`,{});
      setCompleted(p=>new Set([...p,currentLessonId]));
      toast.success("Lesson marked complete! 🎉");
      // Update is_completed in sections state
      setSections(prev=>prev.map(s=>({...s,lessons:s.lessons.map(l=>l.id===currentLessonId?{...l,is_completed:true}:l)})));
    } catch(e){ toast.error(e.message||"Could not save progress."); }
  },[currentLessonId,completed]);

  // Prev / Next
  const currentIdx  = allLessons.findIndex(l=>l.id===currentLessonId);
  const prevLesson  = currentIdx>0?allLessons[currentIdx-1]:null;
  const nextLesson  = currentIdx<allLessons.length-1?allLessons[currentIdx+1]:null;
  const doneCt      = completed.size;
  const totalCt     = allLessons.length;

  if(loading||authLoading) return (
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid rgba(255,255,255,.1)`,borderTopColor:C.p,animation:"spin .8s linear infinite"}}/>
      <p style={{color:"rgba(255,255,255,.4)",fontSize:14}}>Loading course…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",height:"100vh",display:"flex",flexDirection:"column",background:C.dark,overflow:"hidden"}}>
      <TopBar course={course} done={doneCt} total={totalCt} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Main content */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>

          {/* Video / Content area */}
          {lessonLoading&&(
            <div style={{background:"#000",display:"flex",alignItems:"center",justifyContent:"center",height:320}}>
              <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(255,255,255,.1)",borderTopColor:C.p,animation:"spin .8s linear infinite"}}/>
            </div>
          )}

          {!lessonLoading&&lesson&&(
            <>
              {lesson.type==="video"&&(
                <VideoPlayer url={lesson.video_url} lessonId={currentLessonId} onProgress={handleProgress} onComplete={handleComplete}/>
              )}
              {lesson.type==="assignment"&&(
                <div style={{background:C.bg,minHeight:400}}>
                  <AssignmentPanel
                    assignmentId={lesson.assignment_id||null}
                    lessonId={currentLessonId}
                    onComplete={handleComplete}/>
                </div>
              )}
              {(lesson.type==="text"||lesson.type==="resource")&&(
                <div style={{background:C.bg,padding:"32px",flex:1}}>
                  <div style={{maxWidth:720,margin:"0 auto"}}>
                    {lesson.content
                      ? <div style={{fontSize:15,color:C.t1,lineHeight:1.8}} dangerouslySetInnerHTML={{__html:sanitizeHtml(lesson.content)}}/>
                      : <p style={{color:C.t3,textAlign:"center",paddingTop:40}}>No content available for this lesson.</p>
                    }
                  </div>
                </div>
              )}
              {lesson.type==="quiz"&&(
                <div style={{background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",minHeight:300,flexDirection:"column",gap:16,padding:32}}>
                  <HelpCircle size={52} color={C.a}/>
                  <h3 style={{fontSize:20,fontWeight:800,color:C.t1,margin:0}}>Ready for the quiz?</h3>
                  <p style={{color:C.t2,fontSize:14,margin:0}}>Test your knowledge for this section.</p>
                  {lesson.quiz_id ? (
                    <Link to={`/quiz/${lesson.quiz_id}`} style={{padding:"12px 28px",borderRadius:11,background:`linear-gradient(135deg,${C.a},#8C2A21)`,color:"#fff",textDecoration:"none",fontSize:14,fontWeight:700}}>
                      Start Quiz →
                    </Link>
                  ) : (
                    <p style={{color:C.t3,fontSize:13}}>This quiz hasn't been set up yet.</p>
                  )}
                </div>
              )}

              {/* Lesson info bar */}
              {lesson.type!=="assignment"&&(
                <div style={{background:C.w,borderTop:`1px solid ${C.bd}`,padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Current Lesson</div>
                    <h2 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>{lesson.title}</h2>
                  </div>
                  {!completed.has(currentLessonId)&&(
                    <button onClick={handleComplete}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.g},#2E5640)`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      <CheckCircle2 size={15}/> Mark Complete
                    </button>
                  )}
                  {completed.has(currentLessonId)&&(
                    <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:700,color:C.g}}>
                      <CheckCircle2 size={16} fill={C.g}/> Completed
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!lessonLoading&&!lesson&&!loading&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:C.bg,padding:40}}>
              <BookOpen size={52} color={C.bd}/>
              <h3 style={{fontSize:18,fontWeight:700,color:C.t2,margin:0}}>Select a lesson to begin</h3>
            </div>
          )}

          {/* Discussion Board */}
      {lesson && !loading && (
        <DiscussionBoard courseId={course?.id} lessonId={currentLessonId} />
      )}

      {/* Prev / Next nav */}
          <div style={{background:C.w,borderTop:`1px solid ${C.bd}`,padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <button onClick={()=>prevLesson&&selectLesson(prevLesson.id)} disabled={!prevLesson}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,color:prevLesson?C.t1:"#D9D0C0",fontSize:13,fontWeight:600,cursor:prevLesson?"pointer":"not-allowed"}}>
              <ChevronLeft size={15}/> Previous
            </button>
            <div style={{fontSize:12,color:C.t3}}>{currentIdx+1} / {totalCt}</div>
            <button onClick={()=>nextLesson&&selectLesson(nextLesson.id)} disabled={!nextLesson}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,border:"none",background:nextLesson?`linear-gradient(135deg,${C.p},#4B5390)`:"#E4DBC8",color:nextLesson?"#fff":"#8A8275",fontSize:13,fontWeight:600,cursor:nextLesson?"pointer":"not-allowed"}}>
              Next <ChevronRight size={15}/>
            </button>
          </div>
        </div>

        <Sidebar sections={sections} currentId={currentLessonId} onSelect={selectLesson} completed={completed} open={sidebarOpen}/>
      </div>
      {isEnrolled && lesson && !lessonLoading && (
        <DoubtAssistant lessonId={currentLessonId} lessonTitle={lesson.title} />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
