import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, FileText, User, X, Loader } from "lucide-react";
import { api } from "@/lib/api";

export default function LiveSearch({ placeholder = "Search courses, blogs, instructors…", style = {} }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const timerRef = useRef(null);
  const wrapRef  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) { setResults(null); setOpen(false); return; }

    timerRef.current = setTimeout(() => {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(query)}`)
        .then(r => { setResults(r); setOpen(true); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 320);
  }, [query]);

  const total = results ? (results.courses?.length || 0) + (results.posts?.length || 0) + (results.instructors?.length || 0) : 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", ...style }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, background:"#fff", border:"1.5px solid #E4DBC8",
        borderRadius:12, padding:"10px 14px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
        {loading ? <Loader size={16} color="#8A8275" style={{ animation:"spin .6s linear infinite", flexShrink:0 }} />
                 : <Search size={16} color="#8A8275" style={{ flexShrink:0 }} />}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results && setOpen(true)}
          placeholder={placeholder}
          style={{ border:"none", outline:"none", fontSize:14, color:"#211D1A", background:"transparent", flex:1, minWidth:180 }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }}
            style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:"#8A8275", padding:0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && results && total > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, right:0, background:"#fff",
          border:"1px solid #E4DBC8", borderRadius:16, boxShadow:"0 16px 40px rgba(0,0,0,.12)",
          zIndex:500, overflow:"hidden", minWidth:320 }}>

          {results.courses?.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#8A8275", textTransform:"uppercase",
                letterSpacing:".07em", padding:"10px 16px 4px" }}>Courses</div>
              {results.courses.map(c => (
                <Link key={c.id} to={`/course/${c.slug}`} onClick={() => { setOpen(false); setQuery(""); }}
                  style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 16px",
                    textDecoration:"none", transition:"background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FBF6EE"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#28305E,#4B5390)",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <BookOpen size={14} color="#fff" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#211D1A", overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                    <div style={{ fontSize:12, color:"#8A8275" }}>৳{(c.price||0).toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.posts?.length > 0 && (
            <div style={{ borderTop:"1px solid #F3ECDE" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8A8275", textTransform:"uppercase",
                letterSpacing:".07em", padding:"10px 16px 4px" }}>Blog Posts</div>
              {results.posts.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} onClick={() => { setOpen(false); setQuery(""); }}
                  style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 16px", textDecoration:"none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FBF6EE"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <FileText size={14} color="#28305E" style={{ flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:500, color:"#211D1A" }}>{p.title}</span>
                </Link>
              ))}
            </div>
          )}

          {results.instructors?.length > 0 && (
            <div style={{ borderTop:"1px solid #F3ECDE" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8A8275", textTransform:"uppercase",
                letterSpacing:".07em", padding:"10px 16px 4px" }}>Instructors</div>
              {results.instructors.map(i => (
                <Link key={i.id} to={`/instructors/${i.id}`} onClick={() => { setOpen(false); setQuery(""); }}
                  style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 16px", textDecoration:"none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FBF6EE"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {i.avatar_url
                    ? <img src={i.avatar_url} style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} alt="" />
                    : <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#28305E,#4B5390)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>
                        {i.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                  }
                  <span style={{ fontSize:13, fontWeight:500, color:"#211D1A" }}>{i.name}</span>
                </Link>
              ))}
            </div>
          )}

          <div style={{ padding:"8px 16px", borderTop:"1px solid #F3ECDE", background:"#FBF6EE" }}>
            <Link to={`/courses?q=${encodeURIComponent(query)}`} onClick={() => { setOpen(false); setQuery(""); }}
              style={{ fontSize:12, fontWeight:600, color:"#28305E", textDecoration:"none" }}>
              See all results for "{query}" →
            </Link>
          </div>
        </div>
      )}

      {open && results && total === 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, right:0, background:"#fff",
          border:"1px solid #E4DBC8", borderRadius:14, boxShadow:"0 12px 32px rgba(0,0,0,.1)",
          zIndex:500, padding:"20px 16px", textAlign:"center", color:"#8A8275", fontSize:13 }}>
          No results for "{query}"
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
