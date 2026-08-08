import { useState, useEffect, useRef } from "react";
import {
  X, Plus, Edit, Trash2, ChevronDown, ChevronRight, Play,
  FileText, HelpCircle, BookOpen, Download, Save, RefreshCw,
  Link as LinkIcon, Upload as UploadIcon, CheckCircle2, Video, AlertCircle,
} from "lucide-react";
import { Upload as TusUpload } from "tus-js-client";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's local
// timezone; Date's own getters already return local values, this just
// formats and zero-pads them.
function toLocalInputValue(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C", yLt:"#F5E9D4",
  r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

const LESSON_TYPES = [
  { value:"video",      label:"Video",      icon:"🎬", desc:"YouTube link or direct video URL" },
  { value:"text",       label:"Text",       icon:"📄", desc:"Rich text / HTML content"         },
  { value:"assignment", label:"Assignment", icon:"📝", desc:"Students upload file submission"  },
  { value:"quiz",       label:"Quiz",       icon:"❓", desc:"Multiple choice quiz"             },
  { value:"resource",   label:"Resource",  icon:"📎", desc:"Download file or external link"   },
];

function LessonTypeIcon({ type, size=14 }) {
  if (type==="video")      return <Play      size={size} color={C.p} fill={C.p}/>;
  if (type==="text")       return <BookOpen  size={size} color={C.t2}/>;
  if (type==="assignment") return <FileText  size={size} color={C.y}/>;
  if (type==="quiz")       return <HelpCircle size={size} color={C.a}/>;
  if (type==="resource")   return <Download  size={size} color={C.g}/>;
  return <BookOpen size={size} color={C.t3}/>;
}

function Field({ label, value, onChange, type="text", placeholder="", rows, required, hint }) {
  const style={width:"100%",boxSizing:"border-box",padding:"9px 12px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:13,color:C.t1,outline:"none",fontFamily:"inherit",background:C.w};
  const focus=e=>e.target.style.borderColor=C.p;
  const blur=e=>e.target.style.borderColor=C.bd;
  return (
    <div style={{marginBottom:12}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:5}}>
        {label}{required&&<span style={{color:C.r}}> *</span>}
      </label>}
      {rows
        ? <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
            style={{...style,resize:"vertical"}} onFocus={focus} onBlur={blur}/>
        : <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
            style={style} onFocus={focus} onBlur={blur}/>
      }
      {hint&&<div style={{fontSize:11,color:C.t3,marginTop:4}}>{hint}</div>}
    </div>
  );
}

// ── VIDEO UPLOAD (Phase 3 item 7) ───────────────────────────────────────────
// Uploads straight from the browser to Bunny Stream via TUS (see
// BunnyStreamService for why) — this component only ever talks to two small
// JSON endpoints plus the TUS protocol, never proxies the file itself.
// Only usable once the lesson has been saved at least once (needs a real
// lessonId to attach the video to) — LessonForm only renders this when
// editing an existing lesson.
function VideoUploadField({ lessonId, apiPrefix, onUploaded }) {
  const [state, setState] = useState("idle"); // idle | uploading | processing | ready | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  function pollStatus() {
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`${apiPrefix}/lessons/${lessonId}/video/status`);
        if (!mountedRef.current) return;
        if (r.status === "ready") {
          clearInterval(pollRef.current);
          setState("ready");
          onUploaded(r.video_url);
        } else if (r.status === "error") {
          clearInterval(pollRef.current);
          setState("error");
          setError(r.message || "Bunny reported a processing error.");
        }
        // else still "processing" — keep polling
      } catch {
        // one failed status check is transient (network blip) — keep polling
        // rather than giving up, since the upload itself already succeeded
      }
    }, 4000);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be re-selected later if needed
    if (!file) return;

    setState("uploading");
    setProgress(0);
    setError(null);

    let creds;
    try {
      creds = await api.post(`${apiPrefix}/lessons/${lessonId}/video/init`, {});
    } catch (err) {
      setState("error");
      setError(err.message || "Could not start the upload.");
      return;
    }

    const upload = new TusUpload(file, {
      endpoint: creds.endpoint,
      // Matches Bunny's documented retry schedule — longer backoff spread
      // gives a flaky connection more room to recover before giving up.
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      headers: {
        AuthorizationSignature: creds.signature,
        AuthorizationExpire: String(creds.expire),
        VideoId: creds.video_guid,
        LibraryId: String(creds.library_id),
      },
      metadata: { filetype: file.type, title: file.name },
      onError: (err) => {
        if (!mountedRef.current) return;
        setState("error");
        setError("Upload failed: " + err.message);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        if (!mountedRef.current) return;
        setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => {
        if (!mountedRef.current) return;
        setState("processing");
        pollStatus();
      },
    });

    // TUS's actual point is resuming an interrupted upload instead of
    // restarting a possibly-huge file from byte zero — findPreviousUploads
    // checks the browser's local storage for a matching incomplete upload
    // of this exact file before starting a new one.
    const previous = await upload.findPreviousUploads();
    if (previous.length) {
      upload.resumeFromPreviousUpload(previous[0]);
    }
    upload.start();
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.t1, marginBottom:6 }}>
        Or upload a video file
      </label>
      <div style={{ border:`1.5px dashed ${C.bd}`, borderRadius:10, padding:"14px 16px", background:C.w }}>
        {state === "idle" && (
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12.5, color:C.p, fontWeight:600 }}>
            <UploadIcon size={15} />
            Choose a video file to upload
            <input type="file" accept="video/*" onChange={handleFile} style={{ display:"none" }} />
          </label>
        )}
        {state === "uploading" && (
          <div>
            <div style={{ fontSize:12.5, color:C.t2, marginBottom:6 }}>Uploading… {progress}%</div>
            <div style={{ height:6, background:C.bg, borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:C.p, transition:"width .2s" }} />
            </div>
          </div>
        )}
        {state === "processing" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:C.t2 }}>
            <RefreshCw size={14} className="spin" style={{ animation:"cm-spin 1s linear infinite" }} />
            Uploaded — Bunny is processing the video now. This can take a few minutes for longer videos; feel free to save the lesson and check back.
          </div>
        )}
        {state === "ready" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:C.g, fontWeight:600 }}>
            <CheckCircle2 size={15} /> Video ready — URL filled in below.
          </div>
        )}
        {state === "error" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:C.r, fontWeight:600, marginBottom:8 }}>
              <AlertCircle size={15} /> {error}
            </div>
            <label style={{ display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:C.p, fontWeight:600 }}>
              <UploadIcon size={13} /> Try again
              <input type="file" accept="video/*" onChange={handleFile} style={{ display:"none" }} />
            </label>
          </div>
        )}
      </div>
      <style>{`@keyframes cm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── LESSON EDIT FORM ──────────────────────────────────────────────────────────
function LessonForm({ initial, sectionId, onSaved, onCancel, apiPrefix }) {
  const editing = !!initial?.id;
  const [form, setForm] = useState({
    title: initial?.title||"",
    type: initial?.type||"video",
    video_url: initial?.video_url||"",
    content: initial?.content||"",
    duration_seconds: initial?.duration_seconds||"",
    is_preview: initial?.is_preview||false,
    // datetime-local inputs want "YYYY-MM-DDTHH:mm" in LOCAL time, not the
    // ISO/UTC string the API returns — slice off seconds+timezone after
    // converting, and convert back to ISO only when sending.
    available_at: initial?.available_at ? toLocalInputValue(initial.available_at) : "",
    sort_order: initial?.sort_order??0,
    // assignment fields
    assignment_title: initial?.assignment?.title||"",
    assignment_description: initial?.assignment?.description||"",
    assignment_instructions: initial?.assignment?.instructions||"",
    assignment_max_score: initial?.assignment?.max_score||100,
    assignment_file_types: initial?.assignment?.accepted_file_types||"pdf,doc,docx,zip",
    assignment_max_file_mb: initial?.assignment?.max_file_size_mb||10,
  });
  const [saving, setSaving] = useState(false);
  const [quizEditorId, setQuizEditorId] = useState(null);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Lesson title is required."); return; }
    if (form.type==="video"&&!form.video_url.trim()) { toast.error("Video URL is required for video lessons."); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        video_url: form.video_url||null,
        content: form.content||null,
        duration_seconds: form.duration_seconds?parseInt(form.duration_seconds):null,
        is_preview: form.is_preview?1:0,
        available_at: form.available_at ? new Date(form.available_at).toISOString() : null,
        sort_order: parseInt(form.sort_order)||0,
      };
      if (form.type==="assignment") {
        Object.assign(payload, {
          assignment_title: form.assignment_title||form.title,
          assignment_description: form.assignment_description||null,
          assignment_instructions: form.assignment_instructions||null,
          assignment_max_score: parseInt(form.assignment_max_score)||100,
          assignment_file_types: form.assignment_file_types||"pdf,doc,docx,zip",
          assignment_max_file_mb: parseInt(form.assignment_max_file_mb)||10,
        });
      }
      let result;
      if (editing) {
        result = await api.put(`${apiPrefix}/lessons/${initial.id}`, payload);
        toast.success("Lesson updated.");
      } else {
        result = await api.post(`${apiPrefix}/sections/${sectionId}/lessons`, payload);
        toast.success("Lesson added.");
      }
      onSaved(result.lesson);
    } catch(e) { toast.error(e.message||"Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <>
    <div style={{background:C.bg,borderRadius:12,padding:"16px 18px",border:`1.5px solid ${C.p}44`,marginTop:8}}>
      <div style={{fontSize:13,fontWeight:700,color:C.p,marginBottom:14}}>
        {editing?"Edit Lesson":"New Lesson"}
      </div>

      <Field label="Lesson Title" value={form.title} onChange={v=>set("title",v)} required placeholder="e.g. Introduction to React Hooks"/>

      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:C.t1,marginBottom:6}}>Lesson Type <span style={{color:C.r}}>*</span></label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:7}}>
          {LESSON_TYPES.map(t=>(
            <button key={t.value} onClick={()=>set("type",t.value)}
              style={{padding:"8px 10px",borderRadius:9,border:`1.5px solid ${form.type===t.value?C.p:C.bd}`,background:form.type===t.value?C.pLt:C.w,cursor:"pointer",textAlign:"left",transition:"all .12s"}}>
              <div style={{fontSize:15,marginBottom:2}}>{t.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:form.type===t.value?C.p:C.t2}}>{t.label}</div>
              <div style={{fontSize:10,color:C.t3,lineHeight:1.3}}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {form.type==="video"&&(
        <>
          {editing && (
            <VideoUploadField
              lessonId={initial.id}
              apiPrefix={apiPrefix}
              onUploaded={(url) => set("video_url", url)}
            />
          )}
          <Field label="Video URL" value={form.video_url} onChange={v=>set("video_url",v)} required
            placeholder="https://youtube.com/watch?v=… or https://…/video.mp4"
            hint={editing
              ? "Filled in automatically once your upload above finishes, or paste a YouTube/direct video link yourself"
              : "Paste a YouTube link or a direct video URL — save the lesson once, then you can upload a file directly instead"}/>
          <Field label="Duration (seconds)" value={form.duration_seconds} onChange={v=>set("duration_seconds",v)}
            type="number" placeholder="e.g. 1800 for 30 minutes"/>
        </>
      )}

      {(form.type==="text"||form.type==="resource")&&(
        <Field label={form.type==="text"?"Content (HTML or plain text)":"Resource URL or description"}
          value={form.content} onChange={v=>set("content",v)} rows={5}
          placeholder={form.type==="text"?"Write lesson content here…":"https://… or describe the resource"}/>
      )}

      {form.type==="assignment"&&(
        <div style={{background:C.yLt,borderRadius:10,padding:"14px 16px",border:`1px solid #EDE1D6`}}>
          <div style={{fontSize:12,fontWeight:700,color:C.y,marginBottom:12}}>📝 Assignment Settings</div>
          <Field label="Assignment Title" value={form.assignment_title||form.title} onChange={v=>set("assignment_title",v)}
            placeholder="Assignment title (defaults to lesson title)"/>
          <Field label="Description" value={form.assignment_description} onChange={v=>set("assignment_description",v)} rows={2}
            placeholder="Brief description of the assignment"/>
          <Field label="Instructions" value={form.assignment_instructions} onChange={v=>set("assignment_instructions",v)} rows={3}
            placeholder="Detailed instructions for students…"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <Field label="Max Score" value={form.assignment_max_score} onChange={v=>set("assignment_max_score",v)} type="number" placeholder="100"/>
            <Field label="Max File Size (MB)" value={form.assignment_max_file_mb} onChange={v=>set("assignment_max_file_mb",v)} type="number" placeholder="10"/>
            <Field label="Accepted File Types" value={form.assignment_file_types} onChange={v=>set("assignment_file_types",v)} placeholder="pdf,doc,docx,zip"/>
          </div>
        </div>
      )}

      {form.type==="quiz"&&(
        <div style={{background:C.aLt||"#F7E3DF",borderRadius:10,padding:"14px 16px",border:"1px solid #EBC9AB"}}>
          <div style={{fontSize:12,fontWeight:700,color:C.a,marginBottom:10}}>❓ Quiz</div>
          {editing && initial?.quiz_id ? (
            <>
              <p style={{fontSize:12,color:C.t2,margin:"0 0 12px",lineHeight:1.6}}>
                Add questions, set the passing score, and manage attempts for this quiz.
              </p>
              <button onClick={()=>setQuizEditorId(initial.quiz_id)}
                style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.a},#8C2A21)`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                <HelpCircle size={14}/> Manage Quiz Questions
              </button>
            </>
          ) : (
            <p style={{fontSize:12,color:C.t3,margin:0,lineHeight:1.6}}>
              Save this lesson first — then reopen it to add quiz questions.
            </p>
          )}
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,marginTop:4}}>
        <input type="checkbox" id={`prev-${sectionId}`} checked={!!form.is_preview} onChange={e=>set("is_preview",e.target.checked)} style={{accentColor:C.p}}/>
        <label htmlFor={`prev-${sectionId}`} style={{fontSize:13,color:C.t1,cursor:"pointer"}}>
          Free preview (non-enrolled students can access this lesson)
        </label>
      </div>

      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:C.t2,marginBottom:5}}>
          Available from <span style={{fontWeight:400,color:C.t3}}>(optional — leave blank to release immediately)</span>
        </label>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="datetime-local" value={form.available_at} onChange={e=>set("available_at",e.target.value)}
            style={{padding:"8px 10px",borderRadius:8,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,flex:1}}/>
          {form.available_at && (
            <button type="button" onClick={()=>set("available_at","")}
              style={{fontSize:12,color:C.t3,background:"none",border:"none",cursor:"pointer",textDecoration:"underline",whiteSpace:"nowrap"}}>
              Clear
            </button>
          )}
        </div>
        <p style={{fontSize:11,color:C.t3,margin:"5px 0 0"}}>
          Students (and non-owner instructors) can't open this lesson until this date. You can still see and edit it any time.
        </p>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        <button onClick={onCancel} style={{padding:"8px 16px",borderRadius:9,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving}
          style={{padding:"8px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:12,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1,display:"flex",alignItems:"center",gap:6}}>
          {saving?<><RefreshCw size={12} style={{animation:"spin .6s linear infinite"}}/> Saving…</>:<><Save size={12}/> {editing?"Save Changes":"Add Lesson"}</>}
        </button>
      </div>
    </div>

    {quizEditorId && (
      <QuizEditor quizId={quizEditorId} apiPrefix={apiPrefix} onClose={()=>setQuizEditorId(null)} />
    )}
    </>
  );
}

// ── SECTION ITEM ──────────────────────────────────────────────────────────────
function SectionItem({ section, onUpdate, onDelete, apiPrefix }) {
  const [exp, setExp]         = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle]     = useState(section.title);
  const [addLesson, setAddLesson] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [busyId, setBusyId]   = useState(null);

  const saveTitle = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.put(`${apiPrefix}/sections/${section.id}`, { title });
      onUpdate({ ...section, title });
      setEditTitle(false);
      toast.success("Section renamed.");
    } catch(e) { toast.error(e.message||"Failed."); }
    finally { setSaving(false); }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    setBusyId(lessonId);
    try {
      await api.delete(`${apiPrefix}/lessons/${lessonId}`);
      onUpdate({ ...section, lessons: section.lessons.filter(l=>l.id!==lessonId) });
      toast.success("Lesson deleted.");
    } catch(e) { toast.error(e.message||"Failed."); }
    finally { setBusyId(null); }
  };

  const onLessonSaved = (lesson, isNew) => {
    if (isNew || !editLesson) {
      onUpdate({ ...section, lessons: [...section.lessons, lesson] });
    } else {
      onUpdate({ ...section, lessons: section.lessons.map(l=>l.id===lesson.id?lesson:l) });
    }
    setAddLesson(false);
    setEditLesson(null);
  };

  return (
    <div style={{background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
      {/* Section header */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",background:C.bg,borderBottom:`1px solid ${C.bd}`}}>
        <button onClick={()=>setExp(!exp)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexShrink:0}}>
          {exp?<ChevronDown size={16} color={C.t3}/>:<ChevronRight size={16} color={C.t3}/>}
        </button>

        {editTitle
          ? <div style={{display:"flex",gap:8,flex:1,alignItems:"center"}}>
              <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
                style={{flex:1,padding:"6px 10px",border:`1.5px solid ${C.p}`,borderRadius:8,fontSize:13,fontWeight:700,color:C.t1,outline:"none"}}
                onKeyDown={e=>{if(e.key==="Enter")saveTitle();if(e.key==="Escape")setEditTitle(false);}}/>
              <button onClick={saveTitle} disabled={saving} style={{padding:"6px 12px",borderRadius:8,border:"none",background:C.p,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button>
              <button onClick={()=>{setEditTitle(false);setTitle(section.title);}} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,cursor:"pointer"}}>✕</button>
            </div>
          : <span style={{flex:1,fontSize:14,fontWeight:700,color:C.t1}}>{section.title}</span>
        }

        <span style={{fontSize:12,color:C.t3,flexShrink:0}}>{section.lessons.length} lesson{section.lessons.length!==1?"s":""}</span>

        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>setEditTitle(!editTitle)} title="Rename section"
            style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Edit size={12} color={C.p}/>
          </button>
          <button onClick={()=>onDelete(section.id)} title="Delete section"
            style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Trash2 size={12} color={C.r}/>
          </button>
        </div>
      </div>

      {/* Lessons list */}
      {exp&&(
        <div style={{padding:"8px 14px 14px"}}>
          {section.lessons.length===0&&!addLesson&&(
            <p style={{textAlign:"center",color:C.t3,fontSize:13,padding:"12px 0"}}>No lessons yet. Add your first lesson.</p>
          )}

          {section.lessons.map(l=>(
            <div key={l.id}>
              {editLesson?.id===l.id
                ? <LessonForm initial={l} sectionId={section.id} apiPrefix={apiPrefix}
                    onSaved={(lesson)=>onLessonSaved(lesson,false)}
                    onCancel={()=>setEditLesson(null)}/>
                : (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:`1px solid ${C.bd}`,marginTop:8}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <LessonTypeIcon type={l.type}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                      <div style={{fontSize:11,color:C.t3,marginTop:2,display:"flex",gap:8}}>
                        <span style={{textTransform:"capitalize"}}>{l.type}</span>
                        {l.duration&&l.type!=="assignment"&&<span>· {l.duration}</span>}
                        {l.is_preview&&<span style={{color:C.g,fontWeight:600}}>· Free preview</span>}
                        {l.available_at&&new Date(l.available_at)>new Date()&&<span style={{color:C.y,fontWeight:600}}>· Scheduled {new Date(l.available_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span>}
                        {l.type==="assignment"&&l.assignment&&<span>· Max {l.assignment.max_score} pts</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>setEditLesson(l)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={11} color={C.p}/></button>
                      <button onClick={()=>deleteLesson(l.id)} disabled={busyId===l.id} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:busyId===l.id?.5:1}}><Trash2 size={11} color={C.r}/></button>
                    </div>
                  </div>
                )
              }
            </div>
          ))}

          {addLesson
            ? <LessonForm sectionId={section.id} apiPrefix={apiPrefix}
                onSaved={(lesson)=>onLessonSaved(lesson,true)}
                onCancel={()=>setAddLesson(false)}/>
            : (
              <button onClick={()=>setAddLesson(true)}
                style={{display:"flex",alignItems:"center",gap:7,marginTop:10,padding:"8px 14px",border:`1.5px dashed ${C.bd}`,borderRadius:9,background:"transparent",color:C.t3,fontSize:12,cursor:"pointer",width:"100%",justifyContent:"center"}}>
                <Plus size={13}/> Add lesson
              </button>
            )
          }
        </div>
      )}
    </div>
  );
}

// ── MAIN MODAL ────────────────────────────────────────────────────────────────
export default function CurriculumModal({ courseId, courseTitle, onClose, isAdmin=false }) {
  const apiPrefix = isAdmin ? "/admin" : "/instructor";
  const [sections, setSections]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [addingSec, setAddingSec] = useState(false);
  const [newSecTitle, setNewSecTitle] = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(()=>{
    api.get(`${apiPrefix}/courses/${courseId}/curriculum`)
      .then(setSections).catch(()=>toast.error("Could not load curriculum."))
      .finally(()=>setLoading(false));
  },[courseId]);

  const addSection = async () => {
    if(!newSecTitle.trim()){ toast.error("Section title required."); return; }
    setSaving(true);
    try {
      const r = await api.post(`${apiPrefix}/courses/${courseId}/sections`,{ title:newSecTitle, sort_order:sections.length });
      setSections(p=>[...p,{...r.section,lessons:[]}]);
      setNewSecTitle(""); setAddingSec(false);
      toast.success("Section added.");
    } catch(e){ toast.error(e.message||"Failed."); }
    finally{ setSaving(false); }
  };

  const deleteSection = async (id) => {
    if(!window.confirm("Delete this section and all its lessons?")) return;
    try {
      await api.delete(`${apiPrefix}/sections/${id}`);
      setSections(p=>p.filter(s=>s.id!==id));
      toast.success("Section deleted.");
    } catch(e){ toast.error(e.message||"Failed."); }
  };

  const totalLessons = sections.reduce((a,s)=>a+s.lessons.length,0);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 12px",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.w,borderRadius:20,width:"100%",maxWidth:700,boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"sticky",top:0,background:C.w,borderRadius:"20px 20px 0 0",zIndex:2}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.p,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Curriculum Builder</div>
            <h3 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0,lineHeight:1.3}}>{courseTitle}</h3>
            <div style={{fontSize:12,color:C.t3,marginTop:4}}>{sections.length} section{sections.length!==1?"s":""} · {totalLessons} lesson{totalLessons!==1?"s":""}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.t3,padding:4,flexShrink:0}}>
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div style={{padding:"20px 24px 24px"}}>
          {loading&&<div style={{textAlign:"center",padding:40,color:C.t3}}>Loading curriculum…</div>}

          {!loading&&sections.length===0&&(
            <div style={{textAlign:"center",padding:"32px 0",color:C.t3}}>
              <div style={{fontSize:40,marginBottom:12}}>📚</div>
              <div style={{fontSize:14,fontWeight:600}}>No sections yet</div>
              <div style={{fontSize:13,marginTop:4}}>Add a section to start building your curriculum.</div>
            </div>
          )}

          {sections.map(s=>(
            <SectionItem key={s.id} section={s} apiPrefix={apiPrefix}
              onUpdate={(updated)=>setSections(p=>p.map(x=>x.id===updated.id?updated:x))}
              onDelete={deleteSection}/>
          ))}

          {/* Add section */}
          {addingSec
            ? <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center",padding:"12px 16px",background:C.pLt,borderRadius:12,border:`1.5px solid ${C.p}44`}}>
                <input autoFocus value={newSecTitle} onChange={e=>setNewSecTitle(e.target.value)}
                  placeholder="Section title, e.g. Getting Started"
                  style={{flex:1,padding:"9px 12px",border:`1.5px solid ${C.p}`,borderRadius:9,fontSize:13,color:C.t1,outline:"none"}}
                  onKeyDown={e=>{if(e.key==="Enter")addSection();if(e.key==="Escape")setAddingSec(false);}}/>
                <button onClick={addSection} disabled={saving} style={{padding:"9px 16px",borderRadius:9,border:"none",background:C.p,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  {saving?<RefreshCw size={12} style={{animation:"spin .6s linear infinite"}}/>:<><CheckCircle2 size={12}/> Add</>}
                </button>
                <button onClick={()=>setAddingSec(false)} style={{padding:"9px 12px",borderRadius:9,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,cursor:"pointer"}}>✕</button>
              </div>
            : <button onClick={()=>setAddingSec(true)}
                style={{display:"flex",alignItems:"center",gap:8,marginTop:12,padding:"11px 18px",border:`2px dashed ${C.bd}`,borderRadius:12,background:"transparent",color:C.t3,fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",justifyContent:"center"}}>
                <Plus size={15}/> Add Section
              </button>
          }
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── QUIZ EDITOR ────────────────────────────────────────────────────────────────
function QuizEditor({ quizId, apiPrefix, onClose }) {
  const [quiz,    setQuiz]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addingQ, setAddingQ] = useState(false);
  const [editingQ, setEditingQ] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`${apiPrefix}/quizzes/${quizId}`)
      .then(q => { setQuiz(q); setSettings({ pass_percentage:q.pass_percentage, attempts_allowed:q.attempts_allowed, time_limit_minutes:q.time_limit_minutes||"", show_answers:q.show_answers }); })
      .catch(()=>toast.error("Could not load quiz."))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[quizId]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put(`${apiPrefix}/quizzes/${quizId}`, {
        ...settings,
        time_limit_minutes: settings.time_limit_minutes || null,
      });
      toast.success("Quiz settings saved.");
    } catch(e){ toast.error(e.message||"Failed."); }
    finally { setSavingSettings(false); }
  };

  const deleteQuestion = async (id) => {
    if(!window.confirm("Delete this question?")) return;
    try { await api.delete(`${apiPrefix}/questions/${id}`); load(); toast.success("Question deleted."); }
    catch(e){ toast.error(e.message||"Failed."); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:400,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 12px",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.w,borderRadius:20,width:"100%",maxWidth:680,boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.w,borderRadius:"20px 20px 0 0",zIndex:2}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.a,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Quiz Editor</div>
            <h3 style={{fontSize:17,fontWeight:800,color:C.t1,margin:0}}>{quiz?.title||"Loading…"}</h3>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.t3,padding:4}}><X size={20}/></button>
        </div>

        <div style={{padding:"20px 24px 24px"}}>
          {loading && <div style={{textAlign:"center",padding:40,color:C.t3}}>Loading…</div>}

          {!loading && settings && (
            <>
              {/* Quiz settings */}
              <div style={{background:C.bg,borderRadius:12,padding:"16px 18px",marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:12}}>Quiz Settings</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                  <Field label="Pass %" value={settings.pass_percentage} onChange={v=>setSettings(p=>({...p,pass_percentage:v}))} type="number"/>
                  <Field label="Attempts Allowed" value={settings.attempts_allowed} onChange={v=>setSettings(p=>({...p,attempts_allowed:v}))} type="number"/>
                  <Field label="Time Limit (min)" value={settings.time_limit_minutes} onChange={v=>setSettings(p=>({...p,time_limit_minutes:v}))} type="number" placeholder="No limit"/>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.t1,cursor:"pointer",marginBottom:12}}>
                  <input type="checkbox" checked={!!settings.show_answers} onChange={e=>setSettings(p=>({...p,show_answers:e.target.checked}))} style={{accentColor:C.p}}/>
                  Show correct answers after submission
                </label>
                <button onClick={saveSettings} disabled={savingSettings}
                  style={{padding:"8px 16px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {savingSettings?"Saving…":"Save Settings"}
                </button>
              </div>

              {/* Questions list */}
              <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:12}}>
                Questions ({quiz.questions.length})
              </div>

              {quiz.questions.map(q => (
                editingQ?.id === q.id ? (
                  <QuestionForm key={q.id} quizId={quizId} apiPrefix={apiPrefix} initial={q}
                    onSaved={()=>{ setEditingQ(null); load(); }} onCancel={()=>setEditingQ(null)} />
                ) : (
                  <div key={q.id} style={{border:`1px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:8}}>{q.question_text}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          {q.options.map(o=>(
                            <div key={o.id} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:o.is_correct?C.g:C.t3}}>
                              {o.is_correct?<CheckCircle2 size={12} color={C.g}/>:<div style={{width:12,height:12,borderRadius:"50%",border:`1.5px solid ${C.bd}`}}/>}
                              {o.option_text}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>setEditingQ(q)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit size={11} color={C.p}/></button>
                        <button onClick={()=>deleteQuestion(q.id)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.rLt}`,background:C.rLt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={11} color={C.r}/></button>
                      </div>
                    </div>
                  </div>
                )
              ))}

              {addingQ ? (
                <QuestionForm quizId={quizId} apiPrefix={apiPrefix} onSaved={()=>{ setAddingQ(false); load(); }} onCancel={()=>setAddingQ(false)} />
              ) : (
                <button onClick={()=>setAddingQ(true)}
                  style={{display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"11px 18px",border:`2px dashed ${C.bd}`,borderRadius:12,background:"transparent",color:C.t3,fontSize:13,fontWeight:600,cursor:"pointer",width:"100%",justifyContent:"center"}}>
                  <Plus size={15}/> Add Question
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── QUESTION FORM (add/edit) ───────────────────────────────────────────────────
function QuestionForm({ quizId, apiPrefix, initial, onSaved, onCancel }) {
  const editing = !!initial?.id;
  const [text, setText] = useState(initial?.question_text || "");
  const [explanation, setExplanation] = useState(initial?.explanation || "");
  const [points, setPoints] = useState(initial?.points || 1);
  const [options, setOptions] = useState(
    initial?.options?.length ? initial.options.map(o=>({option_text:o.option_text, is_correct:o.is_correct}))
      : [{option_text:"",is_correct:true},{option_text:"",is_correct:false}]
  );
  const [saving, setSaving] = useState(false);

  const updateOption = (i, field, val) => setOptions(prev => prev.map((o,idx) => idx===i ? {...o,[field]:val} : o));
  const setCorrect = (i) => setOptions(prev => prev.map((o,idx) => ({...o, is_correct: idx===i})));
  const addOption = () => { if(options.length<6) setOptions(prev=>[...prev,{option_text:"",is_correct:false}]); };
  const removeOption = (i) => { if(options.length>2) setOptions(prev=>prev.filter((_,idx)=>idx!==i)); };

  const handleSave = async () => {
    if(!text.trim()){ toast.error("Question text is required."); return; }
    if(options.some(o=>!o.option_text.trim())){ toast.error("All options need text."); return; }
    setSaving(true);
    try {
      const payload = { question_text:text, explanation:explanation||null, points:parseInt(points)||1, options };
      if(editing) await api.put(`${apiPrefix}/questions/${initial.id}`, payload);
      else await api.post(`${apiPrefix}/quizzes/${quizId}/questions`, payload);
      toast.success(editing?"Question updated.":"Question added.");
      onSaved();
    } catch(e){ toast.error(e.message||"Failed to save question."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{background:C.pLt,border:`1.5px solid ${C.p}44`,borderRadius:12,padding:"16px 18px",marginBottom:10}}>
      <Field label="Question" value={text} onChange={setText} rows={2} placeholder="What is...?" required/>
      <div style={{fontSize:12,fontWeight:600,color:C.t1,marginBottom:8}}>Options (select the correct one)</div>
      {options.map((o,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <button onClick={()=>setCorrect(i)} title="Mark as correct" style={{background:"none",border:"none",cursor:"pointer",flexShrink:0}}>
            {o.is_correct ? <CheckCircle2 size={20} color={C.g}/> : <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${C.bd}`}}/>}
          </button>
          <input value={o.option_text} onChange={e=>updateOption(i,"option_text",e.target.value)} placeholder={`Option ${i+1}`}
            style={{flex:1,padding:"8px 12px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:13,outline:"none"}}/>
          {options.length>2 && (
            <button onClick={()=>removeOption(i)} style={{background:"none",border:"none",cursor:"pointer",color:C.r,flexShrink:0}}><Trash2 size={14}/></button>
          )}
        </div>
      ))}
      {options.length<6 && (
        <button onClick={addOption} style={{fontSize:12,color:C.p,fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:14}}>+ Add option</button>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 100px",gap:10,marginTop:10}}>
        <Field label="Explanation (shown after answer)" value={explanation} onChange={setExplanation} placeholder="Optional"/>
        <Field label="Points" value={points} onChange={setPoints} type="number"/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
        <button onClick={onCancel} style={{padding:"8px 16px",borderRadius:9,border:`1.5px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving}
          style={{padding:"8px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.p},#4B5390)`,color:"#fff",fontSize:12,fontWeight:700,cursor:saving?"wait":"pointer"}}>
          {saving?"Saving…":editing?"Save Changes":"Add Question"}
        </button>
      </div>
    </div>
  );
}
