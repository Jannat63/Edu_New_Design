import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Users, BookOpen, GraduationCap, Search } from "lucide-react";
import { api } from "@/lib/api";
import { usePageSeo } from "@/lib/usePageSeo";
import AuthNavActions from "@/components/AuthNavActions";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

// Fallback sample data — shown immediately, replaced by live API data once it loads
const SAMPLE_INSTRUCTORS = [
  { id:1, name:"Tanvir Ahmed",   bio:"Senior Full-Stack Developer & Lead Instructor. 10+ years building production apps with React & Node.js.", city:"Dhaka",      courses_count:12, total_students:22000, rating:4.9 },
  { id:2, name:"Nusrat Jahan",   bio:"UI/UX Designer and Design Systems specialist, ex-Google design contractor.",                              city:"Chattogram", courses_count:8,  total_students:14500, rating:4.8 },
  { id:3, name:"Rafiq Islam",    bio:"Digital Marketing strategist helping 50+ Bangladeshi brands grow online.",                                city:"Sylhet",     courses_count:6,  total_students:9800,  rating:4.7 },
];

function initials(name) {
  return (name || "").split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

export default function InstructorsPage() {
  const C = useThemeColors();
  usePageSeo({ fallbackTitle: "Our Instructors" });

  const [instructors, setInstructors] = useState(SAMPLE_INSTRUCTORS);
  const [loading,      setLoading]     = useState(true);
  const [search,       setSearch]      = useState("");

  useEffect(() => {
    api.get("/instructors")
      .then(res => { if (Array.isArray(res) && res.length) setInstructors(res); })
      .catch(() => { /* keep sample data on failure */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = instructors.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase())
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
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Link to="/courses" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Courses</Link>
          <Link to="/instructors" style={{ color:C.p, fontSize:14, fontWeight:700, padding:"7px 12px", borderRadius:8, textDecoration:"none", background:C.pLt }}>Instructors</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"56px 24px 70px", textAlign:"center" }}>
        <h1 style={{ color:"#fff", fontSize:"clamp(28px,4vw,40px)", fontWeight:900, margin:"0 0 12px", letterSpacing:"-1px" }}>
          Meet our instructors
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:560, margin:"0 auto" }}>
          Learn from industry experts who've built real products and led real teams across Bangladesh and beyond.
        </p>
      </div>

      {/* Search bar — overlaps hero */}
      <div style={{ maxWidth:560, margin:"-28px auto 0", padding:"0 24px", position:"relative", zIndex:2 }}>
        <div style={{ background:C.w, borderRadius:14, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", display:"flex", alignItems:"center", padding:"14px 18px", gap:10 }}>
          <Search size={18} color={C.t3} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search instructors by name..."
            style={{ border:"none", outline:"none", flex:1, fontSize:14, color:C.t1 }}
          />
        </div>
      </div>

      {/* Grid */}
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"48px 24px 80px" }}>
        {loading && (
          <p style={{ textAlign:"center", color:C.t3, fontSize:14 }}>Loading instructors…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <p style={{ color:C.t2, fontSize:15 }}>No instructors match "{search}"</p>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {filtered.map(ins => (
            <a key={ins.id} href={`/instructors/${ins.id}`} style={{
              background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18,
              padding:"26px 22px", textDecoration:"none", display:"flex",
              flexDirection:"column", alignItems:"center", textAlign:"center",
              transition:"transform .15s, box-shadow .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
            >
              {ins.avatar ? (
                <img src={ins.avatar} alt={ins.name} style={{ width:84, height:84, borderRadius:"50%", objectFit:"cover", marginBottom:14 }} />
              ) : (
                <div style={{ width:84, height:84, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:26, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                  {initials(ins.name)}
                </div>
              )}

              <h3 style={{ fontSize:17, fontWeight:800, color:C.t1, margin:"0 0 4px" }}>{ins.name}</h3>
              {ins.city && <p style={{ fontSize:12, color:C.t3, margin:"0 0 10px" }}>{ins.city}</p>}

              <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:"0 0 16px", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                {ins.bio || "Experienced instructor on EduBD."}
              </p>

              <div style={{ display:"flex", gap:14, paddingTop:14, borderTop:`1px solid ${C.bd}`, width:"100%", justifyContent:"center" }}>
                <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.t2, fontWeight:600 }}>
                  <Star size={13} color={C.y} fill={C.y} /> {Number(ins.rating || 0).toFixed(1)}
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.t2, fontWeight:600 }}>
                  <BookOpen size={13} color={C.p} /> {ins.courses_count ?? 0} courses
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.t2, fontWeight:600 }}>
                  <Users size={13} color={C.g} /> {(ins.total_students ?? 0).toLocaleString()}
                </span>
              </div>
            </a>
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
