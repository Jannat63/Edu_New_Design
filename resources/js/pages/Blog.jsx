import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import AuthNavActions from "@/components/AuthNavActions";
import {
  Clock, Eye, Share2, Facebook, Twitter, Linkedin, Link2,
  ChevronRight, BookOpen, Star, Users, Award, Tag,
  GraduationCap, ArrowUp, MessageSquare, ThumbsUp, Check,
} from "lucide-react";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

// ── FALLBACK DATA (used briefly while the real post loads, or if the fetch fails) ──
const FALLBACK_POST = {
  title:       "",
  slug:        "",
  category:    "",
  catColor:    C.p,
  excerpt:     "",
  author:      { name:"EduBD", av:"E", role:"Author", bio:"", website:"" },
  publishedAt: "",
  updatedAt:   "",
  readTime:    "5 min read",
  views:       0,
  likes:       0,
  tags:        [],
  metaTitle:   "",
  metaDesc:    "",
  canonical:   "",
  ogImage:     "",
};

const RELATED = [
  { title:"How to Prepare for IELTS from Bangladesh: Complete Guide", cat:"English & IELTS", catC:"#2D6B6B", readTime:"6 min", views:6800,  emoji:"📝" },
  { title:"Complete Guide to Freelancing from Bangladesh on Fiverr",  cat:"Career Tips",   catC:C.p,      readTime:"9 min", views:8100,  emoji:"💻" },
  { title:"bKash vs Nagad: Which is Better for Online Payments?",    cat:"Finance",       catC:"#C98A2C", readTime:"4 min", views:3200,  emoji:"💳" },
];

// ── NAVBAR ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{ position:"sticky", top:0, zIndex:100, background:C.w, borderBottom:`1px solid ${C.bd}` }}>
      <div style={{ display:"flex", alignItems:"center", height:64, gap:24, maxWidth:1280, margin:"0 auto", padding:"0 clamp(20px,4vw,40px)" }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", color:C.t1, fontWeight:600, fontSize:21, letterSpacing:"-0.3px" }}>Edu<span style={{ color:C.a, fontStyle:"italic", fontWeight:500 }}>BD</span></span>
        </Link>
        <div style={{ flex:1 }} />
        <Link to="/blog" style={{ color:C.t2, fontSize:14, fontWeight:500, textDecoration:"none", padding:"7px 13px" }}>← All articles</Link>
        <AuthNavActions />
      </div>
    </nav>
  );
}

// ── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
function TOCSidebar({ toc, activeId }) {
  if (toc.length === 0) return null;
  return (
    <div style={{ width:260, flexShrink:0 }}>
      <div style={{ position:"sticky", top:84 }}>
        <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"18px 18px", marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>Table of contents</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {toc.map(item => (
              <a key={item.id} href={`#${item.id}`} style={{ fontSize:13, color: activeId===item.id ? C.p : C.t2, fontWeight: activeId===item.id ? 700 : 400, padding:"6px 10px", borderRadius:8, textDecoration:"none", borderLeft:`2px solid ${activeId===item.id ? C.p : "transparent"}`, paddingLeft:10, transition:"all .15s", lineHeight:1.4 }}
                onMouseEnter={e => { if (activeId!==item.id) { e.currentTarget.style.background=C.bg; e.currentTarget.style.color=C.t1; }}}
                onMouseLeave={e => { if (activeId!==item.id) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.t2; }}}
              >{item.title}</a>
            ))}
          </div>
        </div>

        {/* CTA card */}
        <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, borderRadius:16, padding:"20px 18px", textAlign:"center" }}>
          <BookOpen size={28} color="#fff" style={{ marginBottom:10 }} />
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", marginBottom:6 }}>Start learning today</div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.65)", margin:"0 0 14px", lineHeight:1.6 }}>500+ courses. Pay with bKash or Nagad.</p>
          <Link to="/courses" style={{ display:"block", background:"#fff", color:C.p, borderRadius:10, padding:"9px", fontSize:13, fontWeight:700, textDecoration:"none" }}>Explore courses →</Link>
        </div>
      </div>
    </div>
  );
}

// ── SHARE BAR ─────────────────────────────────────────────────────────────────
function ShareBar({ vertical = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const btns = [
    { icon:"📘", label:"Facebook",  color:"#1877F2", bg:"rgba(24,119,242,.1)" },
    { icon:"🐦", label:"Twitter",   color:"#1DA1F2", bg:"rgba(29,161,242,.1)" },
    { icon:"💼", label:"LinkedIn",  color:"#0A66C2", bg:"rgba(10,102,194,.1)" },
  ];
  return (
    <div style={{ display:"flex", flexDirection: vertical?"column":"row", alignItems:"center", gap:8 }}>
      {btns.map(b => (
        <button key={b.label} title={b.label} style={{ display:"flex", alignItems:"center", gap:6, background:b.bg, border:`1px solid ${b.color}25`, borderRadius:10, padding: vertical?"10px":"8px 14px", cursor:"pointer", fontSize:13, fontWeight:600, color:b.color, flexShrink:0, transition:"all .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = b.color+"25"}
          onMouseLeave={e => e.currentTarget.style.background = b.bg}
        >
          <span style={{ fontSize:16 }}>{b.icon}</span>
          {!vertical && <span>{b.label}</span>}
        </button>
      ))}
      <button onClick={copy} title="Copy link" style={{ display:"flex", alignItems:"center", gap:6, background: copied?C.gLt:C.bg, border:`1px solid ${copied?C.g:C.bd}`, borderRadius:10, padding: vertical?"10px":"8px 14px", cursor:"pointer", fontSize:13, fontWeight:600, color: copied?C.g:C.t2, transition:"all .2s" }}>
        {copied ? <><Check size={15} color={C.g} />{!vertical && "Copied!"}</> : <><Link2 size={15} />{!vertical && "Copy link"}</>}
      </button>
    </div>
  );
}

// ── ARTICLE BODY ──────────────────────────────────────────────────────────────
function ArticleBody({ sections, activeId, setActiveId }) {
  if (sections.length === 0) return null;
  return (
    <article style={{ flex:1, minWidth:0 }}>
      <style>{`
        .article-body-html p { margin: 0 0 18px; }
        .article-body-html h1, .article-body-html h2, .article-body-html h3,
        .article-body-html h4, .article-body-html h5, .article-body-html h6 {
          color: ${C.t1}; font-weight: 800; letter-spacing: -0.3px;
          margin: 28px 0 12px; line-height: 1.3;
        }
        .article-body-html h2 { font-size: 22px; }
        .article-body-html h3 { font-size: 19px; }
        .article-body-html ul, .article-body-html ol { margin: 0 0 18px; padding-left: 22px; }
        .article-body-html li { margin-bottom: 6px; }
        .article-body-html a { color: ${C.p}; text-decoration: underline; }
        .article-body-html strong, .article-body-html b { color: ${C.t1}; font-weight: 700; }
        .article-body-html blockquote {
          margin: 0 0 18px; padding: 4px 18px; border-left: 3px solid ${C.p};
          color: ${C.t2}; font-style: italic;
        }
        .article-body-html pre, .article-body-html code {
          background: ${C.bg}; border: 1px solid ${C.bd}; border-radius: 6px;
          font-family: ui-monospace, monospace; font-size: 14px;
        }
        .article-body-html code { padding: 2px 6px; }
        .article-body-html pre { padding: 14px; overflow-x: auto; margin: 0 0 18px; }
        .article-body-html pre code { border: none; padding: 0; }
        .article-body-html img { max-width: 100%; border-radius: 10px; margin: 8px 0 18px; }
        .article-body-html table { border-collapse: collapse; width: 100%; margin: 0 0 18px; }
        .article-body-html th, .article-body-html td {
          border: 1px solid ${C.bd}; padding: 8px 12px; text-align: left;
        }
        .article-body-html th { background: ${C.bg}; font-weight: 700; color: ${C.t1}; }
      `}</style>
      {sections.map((sec, idx) => (
        <div key={sec.id} id={sec.id} style={{ marginBottom:40, scrollMarginTop:96 }}>
          {sec.heading && (
            <h2 style={{ fontSize:"clamp(18px,2.5vw,24px)", fontWeight:800, color:C.t1, margin:"0 0 12px", letterSpacing:"-0.4px", lineHeight:1.3 }}>
              {sec.heading}
            </h2>
          )}

          {sec.tag && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.aLt, border:`1px solid rgba(249,115,22,.3)`, borderRadius:100, padding:"4px 12px", marginBottom:12, fontSize:12, fontWeight:700, color:C.a }}>
              {sec.tag}
            </div>
          )}

          {sec.stat && (
            <div style={{ background:C.pLt, border:`1.5px solid #B5BBE0`, borderRadius:14, padding:"16px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:48, height:48, borderRadius:13, background:C.p, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Star size={22} color="#fff" fill="#fff" />
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:C.p, letterSpacing:"-0.5px" }}>{sec.stat.value}</div>
                <div style={{ fontSize:13, color:C.t2, marginTop:2 }}>{sec.stat.label}</div>
              </div>
            </div>
          )}

          {sec.body && (
            <div
              className="article-body-html"
              style={{ fontSize:16, color:C.t2, lineHeight:1.82 }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(sec.body) }}
            />
          )}
        </div>
      ))}

      {/* Share section at bottom of article */}
      <div style={{ background:C.bg, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"22px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:36 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:C.t1, marginBottom:4 }}>Found this helpful? Share it!</div>
          <div style={{ fontSize:13, color:C.t3 }}>Help other students discover this article.</div>
        </div>
        <ShareBar />
      </div>
    </article>
  );
}

// ── AUTHOR CARD ───────────────────────────────────────────────────────────────
function AuthorCard({ author }) {
  if (!author?.name) return null;
  return (
    <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:20, padding:"28px 26px", marginBottom:36, display:"flex", gap:22, alignItems:"flex-start", flexWrap:"wrap" }}>
      <div style={{ width:76, height:76, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:"#fff", flexShrink:0 }}>
        {author.av}
      </div>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Written by</div>
        {author.website
          ? <a href={author.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:20, fontWeight:900, color:C.p, textDecoration:"none", display:"block", marginBottom:4 }}>{author.name}</a>
          : <div style={{ fontSize:20, fontWeight:900, color:C.p, marginBottom:4 }}>{author.name}</div>
        }
        <div style={{ fontSize:13, color:C.t3, marginBottom:12 }}>{author.role}</div>
        {author.bio && <p style={{ fontSize:14, color:C.t2, lineHeight:1.75, margin:"0 0 16px" }}>{author.bio}</p>}
        {author.website && (
          <a href={author.website} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.pLt, color:C.p, border:`1px solid #B5BBE0`, borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
            Visit portfolio ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ── SEO META PREVIEW ──────────────────────────────────────────────────────────
function SeoPreview({ post }) {
  const [open, setOpen] = useState(false);
  const metaTitle = post.metaTitle || post.title;
  const metaDesc  = post.metaDesc  || post.excerpt;
  return (
    <div style={{ marginBottom:36 }}>
      <button onClick={() => setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:8, background:C.bg, border:`1.5px solid ${C.bd}`, borderRadius:12, padding:"11px 18px", fontSize:13, fontWeight:600, color:C.t2, cursor:"pointer", width:"100%" }}>
        <span style={{ fontSize:16 }}>🔍</span>
        SEO meta preview (Google & social)
        <span style={{ marginLeft:"auto", fontSize:11, color:C.t3 }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div style={{ border:`1.5px solid ${C.bd}`, borderTop:"none", borderRadius:"0 0 12px 12px", padding:"20px 18px", background:C.w }}>
          {/* Google preview */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>Google search preview</div>
            <div style={{ border:`1px solid ${C.bd}`, borderRadius:12, padding:"16px 18px", background:C.bg }}>
              <div style={{ fontSize:12, color:"#1a0dab", marginBottom:2 }}>edubd.com › blog › {post.slug}</div>
              <div style={{ fontSize:17, color:"#1a0dab", fontWeight:400, marginBottom:5, lineHeight:1.3 }}>{metaTitle}</div>
              <div style={{ fontSize:14, color:"#4d5156", lineHeight:1.5 }}>{metaDesc}</div>
            </div>
          </div>
          {/* Character counts */}
          <div style={{ display:"flex", gap:12 }}>
            {[["Meta title", metaTitle.length, 30, 60],["Meta desc", metaDesc.length, 120, 160]].map(([l,n,min,max]) => (
              <div key={l} style={{ flex:1, background:C.bg, borderRadius:9, padding:"10px 12px" }}>
                <div style={{ fontSize:11, color:C.t3, marginBottom:4 }}>{l} length</div>
                <div style={{ height:5, background:C.bd, borderRadius:100, marginBottom:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:100, background: n >= min && n <= max ? C.g : C.a, width:`${Math.min((n/max)*100,100)}%` }} />
                </div>
                <div style={{ fontSize:12, fontWeight:700, color: n>=min&&n<=max ? C.g : C.a }}>{n} / {max} chars</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RELATED POSTS ─────────────────────────────────────────────────────────────
function RelatedPosts() {
  return (
    <div style={{ marginBottom:36 }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.t1, margin:"0 0 18px" }}>Related articles</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {RELATED.map(p => (
          <Link key={p.title} to="/blog" style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, overflow:"hidden", textDecoration:"none", display:"block", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 12px 30px ${p.catC}18`; e.currentTarget.style.borderColor=p.catC+"40"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; e.currentTarget.style.borderColor=C.bd; }}
          >
            <div style={{ background:`linear-gradient(135deg,${p.catC},${p.catC}bb)`, height:80, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>
              {p.emoji}
            </div>
            <div style={{ padding:"14px 16px" }}>
              <span style={{ fontSize:10, fontWeight:700, background:p.catC+"22", color:p.catC, padding:"2px 8px", borderRadius:100 }}>{p.cat}</span>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.t1, margin:"8px 0 8px", lineHeight:1.4 }}>{p.title}</h3>
              <div style={{ display:"flex", gap:12, fontSize:12, color:C.t3 }}>
                <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={11} /> {p.readTime}</span>
                <span style={{ display:"flex", alignItems:"center", gap:3 }}><Eye size={11} /> {p.views.toLocaleString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:"#1A2044", padding:"36px clamp(20px,4vw,40px) 24px" }}>
      <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={17} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:"#fff", fontWeight:900, fontSize:17 }}>Edu<span style={{ color:"#D98577" }}>BD</span></span>
        </div>
        <span style={{ color:"rgba(255,255,255,.2)", fontSize:13 }}>
          © 2025 EduBD · Designed &amp; Developed by{" "}
          <a href="https://ahsan-jannat.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color:"rgba(129,140,248,.85)", fontWeight:600, textDecoration:"none" }}>
            Ahsan Jannat
          </a>
        </span>
        <div style={{ display:"flex", gap:18 }}>
          {[["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]].map(([l,to]) => (
            <Link key={l} to={to} style={{ color:"rgba(255,255,255,.25)", fontSize:13, textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { slug } = useParams();

  // ── All hooks declared up-front, in a fixed order, before any effects ──────
  const [post,      setPost]      = useState(FALLBACK_POST);
  const [sections,  setSections]  = useState([]);
  const [toc,       setToc]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeId,  setActiveId]  = useState("");
  const [showTop,   setShowTop]   = useState(false);

  // Fetch the post whenever the slug changes
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    api.get('/blog/' + slug)
      .then(r => {
        if (!r) { setNotFound(true); return; }

        setPost({
          title:       r.title            || FALLBACK_POST.title,
          slug:        r.slug             || slug,
          category:    r.category?.name    || FALLBACK_POST.category,
          catColor:    C.p,
          excerpt:     r.excerpt          || FALLBACK_POST.excerpt,
          author: {
            name:    r.author?.name || r.author || FALLBACK_POST.author.name,
            av:      (r.author?.name || r.author || "E").split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
            role:    r.author?.role || FALLBACK_POST.author.role,
            bio:     r.author?.bio  || FALLBACK_POST.author.bio,
            website: r.author?.website || "",
          },
          publishedAt: r.published_at     || r.created_at || FALLBACK_POST.publishedAt,
          updatedAt:   r.updated_at       || FALLBACK_POST.updatedAt,
          readTime:    (r.read_time_minutes || 5) + ' min read',
          views:       r.view_count       || 0,
          likes:       r.likes            || 0,
          tags:        r.tags             || FALLBACK_POST.tags,
          metaTitle:   r.meta_title       || r.title || FALLBACK_POST.metaTitle,
          metaDesc:    r.meta_description || r.excerpt || FALLBACK_POST.metaDesc,
          canonical:   r.canonical        || `https://edubd.com/blog/${r.slug || slug}`,
          ogImage:     r.thumbnail_url    || "",
        });

        if (r.content) {
          setSections([{ id: 'content', heading: '', body: r.content }]);
          setToc([]); // API content is a single HTML blob — no per-section TOC
        } else {
          setSections([]);
          setToc([]);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Track scroll position for the "back to top" button
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E8E9F1", borderTopColor:C.p, animation:"spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:48 }}>📭</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.t1 }}>Post not found</h2>
        <Link to="/blog" style={{ color:C.p, fontWeight:600 }}>Back to Blog</Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color:C.t1, background:C.bg, minHeight:"100vh" }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background:`linear-gradient(155deg,${C.pDk},${C.p} 50%,#4B5390)`, padding:"52px clamp(20px,4vw,40px) 56px" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, marginBottom:20 }}>
            {[["Home","/"],["Blog","/blog"],[post.category,null]].map(([b,to], i, arr) => (
              <span key={b} style={{ display:"flex", alignItems:"center", gap:6 }}>
                {to ? (
                  <Link to={to} style={{ color: i===arr.length-1 ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.4)", textDecoration:"none" }}>{b}</Link>
                ) : (
                  <span style={{ color: i===arr.length-1 ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.4)" }}>{b}</span>
                )}
                {i < arr.length-1 && <ChevronRight size={13} color="rgba(255,255,255,.3)" />}
              </span>
            ))}
          </div>

          {post.category && (
            <span style={{ background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.8)", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:100, marginBottom:16, display:"inline-block" }}>
              {post.category}
            </span>
          )}

          <h1 style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontSize:"clamp(24px,4vw,42px)", fontWeight:600, margin:"12px 0 18px", letterSpacing:"-0.6px", lineHeight:1.18 }}>
            {post.title}
          </h1>
          {post.excerpt && <p style={{ color:"rgba(255,255,255,.65)", fontSize:16, lineHeight:1.72, margin:"0 0 24px", maxWidth:680 }}>{post.excerpt}</p>}

          {/* Meta row */}
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#fff" }}>
                {post.author.av}
              </div>
              <div>
                {post.author.website
                  ? <a href={post.author.website} target="_blank" rel="noopener noreferrer" style={{ color:"rgba(255,255,255,.85)", fontWeight:700, fontSize:14, textDecoration:"none" }}>{post.author.name}</a>
                  : <span style={{ color:"rgba(255,255,255,.85)", fontWeight:700, fontSize:14 }}>{post.author.name}</span>
                }
                <div style={{ fontSize:11, color:"rgba(255,255,255,.45)" }}>{post.author.role}</div>
              </div>
            </div>
            <div style={{ width:1, height:28, background:"rgba(255,255,255,.2)" }} />
            {[
              post.publishedAt && `📅 ${post.publishedAt}`,
              `⏱ ${post.readTime}`,
              `👁 ${post.views.toLocaleString()} views`,
            ].filter(Boolean).map(v => (
              <span key={v} style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>{v}</span>
            ))}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div style={{ display:"flex", gap:7, marginTop:18, flexWrap:"wrap" }}>
              {post.tags.map(t => (
                <span key={t} style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.18)", color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:500, padding:"4px 12px", borderRadius:100 }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"40px clamp(20px,4vw,40px)", display:"flex", gap:40, alignItems:"flex-start" }}>

        {/* Left: sticky vertical share bar */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, paddingTop:8, flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.t3, textTransform:"uppercase", letterSpacing:".08em", marginBottom:4 }}>Share</div>
          <ShareBar vertical />
          <button style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, background:C.bg, border:`1px solid ${C.bd}`, borderRadius:10, padding:"10px", cursor:"pointer", fontSize:12, fontWeight:600, color:C.t2, transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background=C.aLt; e.currentTarget.style.borderColor=C.a+"50"; e.currentTarget.style.color=C.a; }}
            onMouseLeave={e => { e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.bd; e.currentTarget.style.color=C.t2; }}
          >
            <ThumbsUp size={15} /> <span>{post.likes}</span>
          </button>
        </div>

        {/* Article */}
        <div style={{ flex:1, minWidth:0 }}>
          <SeoPreview post={post} />
          <ArticleBody sections={sections} activeId={activeId} setActiveId={setActiveId} />
          <AuthorCard author={post.author} />
          <RelatedPosts />
        </div>

        {/* TOC sidebar */}
        <TOCSidebar toc={toc} activeId={activeId} />
      </div>

      {/* Back to top */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}
          style={{ position:"fixed", bottom:28, right:28, width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${C.p}50`, zIndex:50 }}>
          <ArrowUp size={20} color="#fff" />
        </button>
      )}

      <Footer />
    </div>
  );
}
