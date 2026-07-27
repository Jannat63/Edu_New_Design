import { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, Pin, CheckCircle2, Plus, ChevronDown,
         Trash2, Send, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

const C = {
  p:"#28305E", pLt:"#E8E9F1", g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C", r:"#B23A2E", rLt:"#F7E3DF",
  w:"#fff", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

function Avatar({ name, url, size = 32 }) {
  if (url) return <img src={url} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />;
  const init = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`,
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.35, fontWeight:800,
      color:"#fff", flexShrink:0 }}>
      {init}
    </div>
  );
}

function DiscussionItem({ d, courseId, onDelete, currentUser, isAdmin }) {
  const [showReply, setShowReply]   = useState(false);
  const [replyText, setReplyText]   = useState("");
  const [posting, setPosting]       = useState(false);
  const [replies, setReplies]       = useState(d.replies || []);
  const [showReplies, setShowReplies] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/courses/${courseId}/discussions`, {
        body: replyText, parent_id: d.id,
      });
      setReplies(p => [...p, r.discussion]);
      setReplyText(""); setShowReply(false); setShowReplies(true);
      toast.success("Reply posted.");
    } catch(e) { toast.error(e.message || "Failed."); }
    finally { setPosting(false); }
  };

  const handleUpvote = async () => {
    try { await api.post(`/discussions/${d.id}/upvote`, {}); }
    catch(e) { toast.error("Failed."); }
  };

  const isMine = currentUser?.id === d.user?.id;

  return (
    <div style={{ display:"flex", gap:12, marginBottom:18 }}>
      <Avatar name={d.user?.name} url={d.user?.avatar} />
      <div style={{ flex:1 }}>
        <div style={{ background:C.w, border:`1.5px solid ${d.is_pinned?C.p:C.bd}`, borderRadius:14, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>{d.user?.name}</span>
              {d.is_pinned && <span style={{ marginLeft:8, fontSize:10, fontWeight:700, background:C.pLt, color:C.p, padding:"2px 7px", borderRadius:100 }}>📌 Pinned</span>}
              {d.is_solved && <span style={{ marginLeft:8, fontSize:10, fontWeight:700, background:C.gLt, color:C.g, padding:"2px 7px", borderRadius:100 }}>✅ Solved</span>}
              <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{d.created_at}</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {(isMine || isAdmin) && (
                <button onClick={() => onDelete(d.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.t3, display:"flex" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize:14, color:C.t2, lineHeight:1.7, margin:0 }}>{d.body}</p>
        </div>

        <div style={{ display:"flex", gap:12, marginTop:8, paddingLeft:4 }}>
          <button onClick={handleUpvote} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.t3, fontWeight:600 }}>
            <ThumbsUp size={12} /> {d.upvotes > 0 ? d.upvotes : ""} Helpful
          </button>
          <button onClick={() => setShowReply(!showReply)} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.p, fontWeight:600 }}>
            <Send size={12} /> Reply
          </button>
          {replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)} style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.t3, fontWeight:600 }}>
              <ChevronDown size={12} style={{ transform:showReplies?"rotate(180deg)":"", transition:"transform .2s" }} />
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {showReply && (
          <div style={{ display:"flex", gap:10, marginTop:10, alignItems:"flex-end" }}>
            <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write a reply…" rows={2}
              style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${C.bd}`, borderRadius:10, fontSize:13, color:C.t1, outline:"none", resize:"vertical", fontFamily:"inherit" }}/>
            <button onClick={handleReply} disabled={posting||!replyText.trim()}
              style={{ padding:"9px 16px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:12, fontWeight:700, cursor:posting?"wait":"pointer", flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>
              {posting ? <RefreshCw size={12} style={{ animation:"spin .6s linear infinite" }}/> : <Send size={12}/>}
              {posting ? "" : "Post"}
            </button>
          </div>
        )}

        {showReplies && replies.length > 0 && (
          <div style={{ marginTop:12, paddingLeft:16, borderLeft:`2px solid ${C.pLt}` }}>
            {replies.map(r => <DiscussionItem key={r.id} d={r} courseId={courseId} onDelete={onDelete} currentUser={currentUser} isAdmin={isAdmin}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscussionBoard({ courseId, lessonId }) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [newPost, setNewPost]         = useState("");
  const [posting, setPosting]         = useState(false);
  const [showForm, setShowForm]       = useState(false);

  const load = () => {
    if (!courseId) return;
    setLoading(true);
    const url = lessonId ? `/courses/${courseId}/discussions?lesson_id=${lessonId}` : `/courses/${courseId}/discussions`;
    api.get(url)
      .then(r => setDiscussions(r?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId, lessonId]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/courses/${courseId}/discussions`, {
        body: newPost, lesson_id: lessonId || null,
      });
      setDiscussions(p => [r.discussion, ...p]);
      setNewPost(""); setShowForm(false);
      toast.success("Question posted!");
    } catch(e) { toast.error(e.message || "Post failed."); }
    finally { setPosting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/discussions/${id}`);
      setDiscussions(p => p.filter(d => d.id !== id && d.replies?.every(r => r.id !== id)));
      toast.success("Deleted.");
    } catch(e) { toast.error(e.message || "Failed."); }
  };

  return (
    <div style={{ padding:"28px 32px", background:C.bg, borderTop:`1px solid ${C.bd}` }}>
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <MessageSquare size={20} color={C.p} />
            <h3 style={{ fontSize:16, fontWeight:800, color:C.t1, margin:0 }}>
              Discussion{discussions.length > 0 ? ` (${discussions.length})` : ""}
            </h3>
          </div>
          {user && (
            <button onClick={() => setShowForm(!showForm)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:10, border:"none",
                background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              <Plus size={13} /> Ask a question
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ background:C.w, border:`1.5px solid ${C.p}44`, borderRadius:14, padding:"16px", marginBottom:20 }}>
            <div style={{ display:"flex", gap:12 }}>
              <Avatar name={user?.name} url={user?.avatar} />
              <div style={{ flex:1 }}>
                <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} rows={3}
                  placeholder="Ask a question or start a discussion about this lesson…"
                  style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px", border:`1.5px solid ${C.bd}`, borderRadius:10,
                    fontSize:13, color:C.t1, outline:"none", resize:"vertical", fontFamily:"inherit" }}/>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
                  <button onClick={() => { setShowForm(false); setNewPost(""); }}
                    style={{ padding:"8px 16px", borderRadius:9, border:`1.5px solid ${C.bd}`, background:C.w, color:C.t2, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handlePost} disabled={posting || !newPost.trim()}
                    style={{ padding:"8px 18px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`,
                      color:"#fff", fontSize:12, fontWeight:700, cursor:posting?"wait":"pointer", opacity:!newPost.trim()?.5:1,
                      display:"flex", alignItems:"center", gap:6 }}>
                    {posting ? <><RefreshCw size={12} style={{ animation:"spin .6s linear infinite"}}/> Posting…</> : <><Send size={12}/> Post</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <p style={{ textAlign:"center", color:C.t3, padding:20 }}>Loading discussions…</p>}
        {!loading && discussions.length === 0 && !showForm && (
          <div style={{ textAlign:"center", padding:"32px 0", color:C.t3 }}>
            <MessageSquare size={36} color={C.bd} style={{ marginBottom:10 }} />
            <div style={{ fontSize:14, fontWeight:600 }}>No discussions yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Be the first to ask a question!</div>
          </div>
        )}
        {discussions.map(d => (
          <DiscussionItem key={d.id} d={d} courseId={courseId} onDelete={handleDelete}
            currentUser={user} isAdmin={user?.is_admin} />
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
