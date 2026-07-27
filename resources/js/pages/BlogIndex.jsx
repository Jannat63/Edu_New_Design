import { useState, useEffect } from "react";
import { Search, Clock, Eye, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/usePageTitle";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

const SAMPLE_POSTS = [
  { id:1, title:"Top 10 Programming Skills to Learn in Bangladesh in 2025", slug:"top-10-programming-skills-bangladesh-2025", excerpt:"From React to cloud computing — here's what employers in Dhaka and Chattogram are actually hiring for this year.", category:{name:"Career"}, author:{name:"Tanvir Ahmed"}, read_time:6, views:1240 },
  { id:2, title:"How to Land Your First Remote Job as a Bangladeshi Developer", slug:"first-remote-job-bangladesh-developer", excerpt:"A practical roadmap for breaking into international remote work, from portfolio to first paycheck.", category:{name:"Career"}, author:{name:"Nusrat Jahan"}, read_time:8, views:980 },
  { id:3, title:"Why UI/UX Design is Bangladesh's Fastest-Growing Tech Field", slug:"ui-ux-design-bangladesh-growth", excerpt:"Local agencies and startups can't hire designers fast enough. Here's why — and how to get started.", category:{name:"Design"}, author:{name:"Rafiq Islam"}, read_time:5, views:760 },
];

export default function BlogIndexPage() {
  usePageTitle("Blog");

  const [posts,   setPosts]   = useState(SAMPLE_POSTS);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    api.get("/blog")
      .then(res => { if (res?.data?.length) setPosts(res.data); })
      .catch(() => { /* keep sample posts */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>
            Edu<span style={{ color:C.p }}>BD</span>
          </span>
        </Link>
        <div style={{ display:"flex", gap:6 }}>
          <Link to="/courses" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Courses</Link>
          <Link to="/blog" style={{ color:C.p, fontSize:14, fontWeight:700, padding:"7px 12px", borderRadius:8, textDecoration:"none", background:C.pLt }}>Blog</Link>
          <AuthNavActions />
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"56px 24px 70px", textAlign:"center" }}>
        <h1 style={{ color:"#fff", fontSize:"clamp(28px,4vw,40px)", fontWeight:900, margin:"0 0 12px", letterSpacing:"-1px" }}>
          The EduBD Blog
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:560, margin:"0 auto" }}>
          Career advice, learning guides, and industry insights for Bangladesh's tech community.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ maxWidth:560, margin:"-28px auto 0", padding:"0 24px", position:"relative", zIndex:2 }}>
        <div style={{ background:C.w, borderRadius:14, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", display:"flex", alignItems:"center", padding:"14px 18px", gap:10 }}>
          <Search size={18} color={C.t3} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            style={{ border:"none", outline:"none", flex:1, fontSize:14, color:C.t1 }}
          />
        </div>
      </div>

      {/* Posts grid */}
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"48px 24px 80px" }}>
        {loading && (
          <p style={{ textAlign:"center", color:C.t3, fontSize:14 }}>Loading articles…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <p style={{ color:C.t2, fontSize:15 }}>No articles match "{search}"</p>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
          {filtered.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} style={{
              background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16,
              padding:"24px", textDecoration:"none", display:"flex", flexDirection:"column",
              transition:"transform .15s, box-shadow .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
            >
              {post.category?.name && (
                <span style={{ display:"inline-block", background:C.pLt, color:C.p, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, marginBottom:12, width:"fit-content" }}>
                  {post.category.name}
                </span>
              )}
              <h3 style={{ fontSize:17, fontWeight:800, color:C.t1, margin:"0 0 10px", lineHeight:1.4 }}>
                {post.title}
              </h3>
              <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:"0 0 16px", flex:1, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                {post.excerpt}
              </p>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, borderTop:`1px solid ${C.bd}` }}>
                <span style={{ fontSize:12, color:C.t3, fontWeight:600 }}>{post.author?.name || "EduBD Team"}</span>
                <div style={{ display:"flex", gap:10 }}>
                  {post.read_time && (
                    <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:C.t3 }}>
                      <Clock size={11} /> {post.read_time} min
                    </span>
                  )}
                  {post.views != null && (
                    <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:C.t3 }}>
                      <Eye size={11} /> {post.views}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>
          © {new Date().getFullYear()} EduBD. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
