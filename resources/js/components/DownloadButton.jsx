import { useState, useEffect } from "react";
import { Download, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { offlineStore } from "@/lib/offlineStore";
import { useThemeColors } from "@/lib/darkMode";

// Mirrors Learn.jsx's own isYouTube/isBunnyEmbed checks (not imported from
// there — those are private helpers in a page file, not a shared module;
// duplicating two one-line checks here is simpler and safer than exporting
// across that boundary for something this small).
function isDownloadableVideoUrl(url) {
  if (!url) return false;
  if (/youtube\.com|youtu\.be/.test(url)) return false;
  if (/iframe\.mediadelivery\.net\/embed\//.test(url)) return false;
  return true;
}

/**
 * Phase 3 item 8. Only rendered for lesson types that can actually be
 * reliably saved offline — see offlineStore.js for the full reasoning.
 * Text lessons always work; video lessons only work when video_url is a
 * direct file, and even then only if the host's CORS policy allows it,
 * which this button finds out by trying rather than promising upfront.
 */
export default function DownloadButton({ lesson, courseTitle }) {
  const C = useThemeColors();
  const [state, setState] = useState("checking"); // checking | unavailable | idle | downloading | done | error
  const [error, setError] = useState(null);

  const downloadable = lesson.type === "text"
    ? !!lesson.content
    : lesson.type === "video" && isDownloadableVideoUrl(lesson.video_url);

  useEffect(() => {
    if (!offlineStore.isSupported() || !downloadable) {
      setState("unavailable");
      return;
    }
    let cancelled = false;
    offlineStore.get(lesson.id).then(existing => {
      if (!cancelled) setState(existing ? "done" : "idle");
    }).catch(() => { if (!cancelled) setState("idle"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  async function download() {
    setState("downloading");
    setError(null);
    try {
      if (lesson.type === "text") {
        await offlineStore.saveText({ lessonId: lesson.id, courseTitle, title: lesson.title, content: lesson.content });
      } else {
        await offlineStore.saveVideo({ lessonId: lesson.id, courseTitle, title: lesson.title, videoUrl: lesson.video_url });
      }
      setState("done");
    } catch (err) {
      setState("error");
      setError(
        lesson.type === "video"
          ? "Couldn't download this video — its host may not allow offline saving."
          : "Couldn't save this lesson for offline use."
      );
    }
  }

  async function remove() {
    await offlineStore.remove(lesson.id);
    setState("idle");
  }

  if (state === "checking" || state === "unavailable") return null;

  if (state === "done") {
    return (
      <button onClick={remove} title="Remove offline copy"
        style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, border:`1px solid ${C.bd}`, background:C.gLt, color:"#1F5B36", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
        <Check size={13} /> Saved offline <X size={12} style={{ marginLeft:2 }} />
      </button>
    );
  }

  return (
    <div>
      <button onClick={download} disabled={state==="downloading"}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, border:`1px solid ${C.bd}`, background:C.w, color:C.t2, fontSize:12.5, fontWeight:600, cursor: state==="downloading" ? "default" : "pointer" }}>
        {state === "downloading" ? <Loader2 size={13} style={{ animation:"dl-spin 0.8s linear infinite" }} /> : <Download size={13} />}
        {state === "downloading" ? "Saving…" : "Save offline"}
      </button>
      {state === "error" && (
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, color:C.a, marginTop:5 }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}
      <style>{`@keyframes dl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
