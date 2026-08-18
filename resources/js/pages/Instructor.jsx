import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import AuthNavActions from "@/components/AuthNavActions";
import MegaMenu from "@/components/MegaMenu";
import Logo from "@/components/Logo";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";
import {
  Star, Users, BookOpen, Award, ChevronRight, Play, Check,
  GraduationCap, Globe, Youtube, Facebook, Linkedin,
  Clock, BarChart2, BadgeCheck, MessageSquare, Share2,
} from "lucide-react";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

// ── FALLBACK DATA (shown briefly while the real profile loads, or if the API call fails) ──
const FALLBACK_INSTRUCTOR = {
  name:       "Instructor",
  title:      "Instructor",
  avatar:     "IN",
  avatarImg:  null,
  avatarBg:   `linear-gradient(135deg,${C.p},#4B5390)`,
  badge:      "Instructor",
  bio:        "",
  location:   "Bangladesh",
  language:   "Bengali & English",
  website:    "",
  youtube:    "#",
  facebook:   "#",
  linkedin:   "#",
  rating:     0,
  reviews:    0,
  students:   0,
  courses:    0,
  experience: "",
  specialties:[],
};

const FALLBACK_REVIEWS = [
  { name:"Ahmed Karim",   av:"AK", city:"Dhaka",      rating:5, date:"Dec 2024", text:"Best instructor I've found anywhere. Concepts explained clearly and the real-world projects are excellent." },
  { name:"Sumaiya Islam", av:"SI", city:"Chittagong", rating:5, date:"Nov 2024", text:"I tried many courses before but none matched this quality. Highly recommend!" },
];

function Stars({ n, size = 14 }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[...Array(5)].map((_, i) => <Star key={i} size={size} fill={i < Math.floor(n) ? "#C98A2C" : "none"} color={i < Math.floor(n) ? "#C98A2C" : "#D9D0C0"} />)}
    </span>
  );
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────
function Navbar() {
  return <MegaMenu logo={<Logo />} actions={<><DarkModeToggle size="sm" /><AuthNavActions /></>} />;
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function InstructorHero({ instructor }) {
  return (
    <div style={{ background:`linear-gradient(155deg,#171432 0%,#232049 60%,#1A2044 100%)`, padding:"56px clamp(20px,4vw,40px) 64px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-60, right:-60, width:320, height:320, borderRadius:"50%", background:C.p, opacity:.07, pointerEvents:"none" }} />
      <div style={{ maxWidth:1280, margin:"0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, marginBottom:28 }}>
          {[["Home","/"],["Instructors","/instructors"],[instructor.name,null]].map(([b,to], i, arr) => (
            <span key={b} style={{ display:"flex", alignItems:"center", gap:6 }}>
              {to ? (
                <Link to={to} style={{ color: i === arr.length-1 ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.4)", textDecoration:"none", fontSize:13 }}>{b}</Link>
              ) : (
                <span style={{ color: i === arr.length-1 ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.4)", fontSize:13 }}>{b}</span>
              )}
              {i < arr.length-1 && <ChevronRight size={13} color="rgba(255,255,255,.3)" />}
            </span>
          ))}
        </div>

        <div style={{ display:"flex", gap:40, alignItems:"flex-start", flexWrap:"wrap" }}>
          {/* Avatar */}
          <div style={{ flexShrink:0 }}>
            <div style={{ width:120, height:120, borderRadius:"50%", background:instructor.avatarImg ? "transparent" : instructor.avatarBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:42, fontWeight:900, color:"#fff", boxShadow:`0 12px 40px ${C.p}50`, position:"relative", overflow:"hidden" }}>
              {instructor.avatarImg
                ? <img src={instructor.avatarImg} alt={instructor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : instructor.avatar
              }
              <div style={{ position:"absolute", bottom:4, right:4, width:28, height:28, borderRadius:"50%", background:C.g, border:`3px solid #171432`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Check size={14} color="#fff" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:260 }}>
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <span style={{ background:"rgba(245,158,11,.2)", color:C.y, fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:100, display:"inline-flex", alignItems:"center", gap:5 }}>
                <Award size={13} /> {instructor.badge}
              </span>
              {instructor.experience && (
                <span style={{ background:"rgba(129,140,196,.25)", color:"#C7CBE8", fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:100 }}>
                  {instructor.experience} experience
                </span>
              )}
            </div>
            <h1 style={{ color:"#fff", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, margin:"0 0 10px", letterSpacing:"-0.8px" }}>{instructor.name}</h1>
            <p style={{ color:"rgba(255,255,255,.6)", fontSize:16, margin:"0 0 20px" }}>{instructor.title}</p>

            {/* Stats row */}
            <div style={{ display:"flex", gap:24, flexWrap:"wrap", marginBottom:22 }}>
              {[
                { icon:Star,     v:`${instructor.rating} rating`,     c:C.y       },
                { icon:Users,    v:`${(instructor.students/1000).toFixed(0)}K students`,c:C.pMd  },
                { icon:BookOpen, v:`${instructor.courses} courses`,   c:C.g       },
                { icon:MessageSquare, v:`${(instructor.reviews/1000).toFixed(1)}K reviews`, c:C.a },
              ].map(({ icon:Icon, v, c }) => (
                <div key={v} style={{ display:"flex", alignItems:"center", gap:7, fontSize:14, color:"rgba(255,255,255,.65)" }}>
                  <Icon size={15} color={c} /> {v}
                </div>
              ))}
            </div>

            {/* Meta */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:22 }}>
              {[
                `📍 ${instructor.location}`,
                `🗣️ ${instructor.language}`,
              ].map(label => (
                <span key={label} style={{ fontSize:13, color:"rgba(255,255,255,.45)" }}>{label}</span>
              ))}
            </div>

            {/* Socials */}
            <div style={{ display:"flex", gap:10 }}>
              {[
                { href:instructor.youtube,  label:"YouTube",  emoji:"▶️" },
                { href:instructor.facebook, label:"Facebook", emoji:"📘" },
                { href:instructor.linkedin, label:"LinkedIn", emoji:"💼" },
                { href:instructor.website,  label:"Website",  emoji:"🌐" },
              ].filter(s => s.href && s.href !== "#").map(s => (
                <a key={s.label} href={s.href} title={s.label} target="_blank" rel="noopener noreferrer" style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, textDecoration:"none", transition:"background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
                >{s.emoji}</a>
              ))}
              <button style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"0 16px", fontSize:13, fontWeight:600, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RATING BREAKDOWN ──────────────────────────────────────────────────────────
function RatingBreakdown({ instructor }) {
  const bars = [[5,82],[4,13],[3,3],[2,1],[1,1]];
  return (
    <div style={{ background:C.pLt, border:`1.5px solid #B5BBE0`, borderRadius:18, padding:"24px 24px", marginBottom:28 }}>
      <div style={{ display:"flex", gap:28, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:56, fontWeight:900, color:C.p, lineHeight:1, letterSpacing:"-2px" }}>{instructor.rating}</div>
          <Stars n={instructor.rating} size={18} />
          <p style={{ fontSize:12, color:C.t3, margin:"6px 0 0" }}>Instructor rating</p>
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          {bars.map(([s, pct]) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
              <div style={{ flex:1, background:"#E8E9F1", borderRadius:100, height:8, overflow:"hidden" }}>
                <div style={{ background:`linear-gradient(90deg,${C.y},${C.a})`, width:`${pct}%`, height:"100%", borderRadius:100 }} />
              </div>
              <span style={{ fontSize:12, color:C.t2, fontWeight:600, width:18, textAlign:"right" }}>{s}★</span>
              <span style={{ fontSize:12, color:C.t3, width:34 }}>{pct}%</span>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, flexShrink:0 }}>
          {[
            { icon:Users,    v:`${(instructor.students/1000).toFixed(0)}K`, l:"Total students", c:C.p },
            { icon:BookOpen, v:instructor.courses,                          l:"Courses",         c:C.g },
            { icon:MessageSquare, v:`${(instructor.reviews/1000).toFixed(1)}K`, l:"Reviews",    c:C.a },
            { icon:Award,    v:instructor.experience || "—",                l:"Experience",      c:C.y },
          ].map(({ icon:Icon, v, l, c }) => (
            <div key={l} style={{ background:C.w, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
              <Icon size={18} color={c} style={{ marginBottom:4 }} />
              <div style={{ fontSize:18, fontWeight:900, color:C.t1, letterSpacing:"-0.5px" }}>{v}</div>
              <div style={{ fontSize:11, color:C.t3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function AboutSection({ instructor }) {
  const [expanded, setExpanded] = useState(false);
  const paras = (instructor.bio || "").split("\n\n").filter(Boolean);
  if (paras.length === 0) return null;

  return (
    <div style={{ marginBottom:36 }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.t1, margin:"0 0 16px" }}>About {instructor.name}</h2>
      <div style={{ fontSize:15, color:C.t2, lineHeight:1.78 }}>
        {(expanded ? paras : paras.slice(0, 1)).map((p, i) => (
          <p key={i} style={{ margin:"0 0 14px" }}>{p}</p>
        ))}
      </div>
      {paras.length > 1 && (
        <button onClick={() => setExpanded(!expanded)} style={{ background:"none", border:`1.5px solid ${C.p}`, color:C.p, borderRadius:10, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:8 }}>
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}

      {instructor.specialties?.length > 0 && (
        <div style={{ marginTop:22 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:10 }}>Areas of expertise</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {instructor.specialties.map(s => (
              <span key={s} style={{ background:C.pLt, color:C.p, border:`1px solid #B5BBE0`, borderRadius:100, padding:"5px 14px", fontSize:13, fontWeight:600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COURSES ───────────────────────────────────────────────────────────────────
function CoursesSection({ instructor, courses, loading }) {
  return (
    <div style={{ marginBottom:36 }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.t1, margin:"0 0 18px" }}>Courses by {instructor.name}</h2>

      {loading && <p style={{ color:C.t3, fontSize:14 }}>Loading courses…</p>}
      {!loading && courses.length === 0 && <p style={{ color:C.t3, fontSize:14 }}>This instructor hasn't published any courses yet.</p>}

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {courses.map(c => {
          const disc = c.orig > 0 ? Math.round((1 - c.price / c.orig) * 100) : 0;
          return (
            <Link key={c.id} to={c.slug ? `/course/${c.slug}` : "#"} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, overflow:"hidden", display:"flex", transition:"all .2s", textDecoration:"none" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${c.catC}18`; e.currentTarget.style.borderColor = c.catC+"45"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = C.bd; }}
            >
              {/* Thumb */}
              <div style={{ background:c.thumb, width:150, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, minHeight:110, backgroundSize:"cover", backgroundPosition:"center" }}>
                {!c.thumb?.startsWith("url(") && c.emoji}
              </div>
              {/* Body */}
              <div style={{ flex:1, padding:"16px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:10, fontWeight:700, background:c.catC+"22", color:c.catC, padding:"2px 8px", borderRadius:100 }}>{c.cat}</span>
                  <h3 style={{ fontSize:14, fontWeight:700, color:C.t1, margin:"7px 0 6px", lineHeight:1.4 }}>{c.title}</h3>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <Stars n={c.rating} size={12} />
                    <span style={{ fontSize:12, fontWeight:700, color:"#7A5620" }}>{c.rating}</span>
                    <span style={{ fontSize:12, color:C.t3 }}>({(c.reviews||0).toLocaleString()} reviews)</span>
                  </div>
                  <div style={{ display:"flex", gap:12, fontSize:12, color:C.t3, flexWrap:"wrap" }}>
                    {c.dur && <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={11} /> {c.dur}</span>}
                    <span style={{ display:"flex", alignItems:"center", gap:3 }}><Users size={11} /> {c.students} students</span>
                    <span style={{ background:C.pLt, color:C.p, padding:"2px 8px", borderRadius:100, fontWeight:600, fontSize:11 }}>{c.level}</span>
                  </div>
                </div>
                {/* Price */}
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:C.t1 }}>৳{(c.price||0).toLocaleString()}</div>
                  {c.orig > c.price && <div style={{ fontSize:12, color:C.t3, textDecoration:"line-through" }}>৳{c.orig.toLocaleString()}</div>}
                  {disc > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.g, background:C.gLt, padding:"2px 9px", borderRadius:100, marginTop:5, display:"inline-block" }}>{disc}% OFF</div>}
                  <div style={{ marginTop:10 }}>
                    <span style={{ background:`linear-gradient(135deg,${c.catC},${c.catC}cc)`, color:"#fff", border:"none", borderRadius:9, padding:"8px 16px", fontSize:12, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
                      <Play size={11} fill="#fff" /> View course
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
function ReviewsSection({ reviews }) {
  if (reviews.length === 0) return null;
  return (
    <div style={{ marginBottom:36 }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.t1, margin:"0 0 18px" }}>Student reviews</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
        {reviews.map(r => (
          <div key={r.name} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"22px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0 }}>{r.av}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.t1 }}>{r.name}</div>
                <div style={{ fontSize:12, color:C.t3 }}>📍 {r.city} · {r.date}</div>
              </div>
              <Stars n={r.rating} size={13} />
            </div>
            <p style={{ fontSize:14, color:C.t2, lineHeight:1.75, margin:0 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ instructor }) {
  return (
    <div style={{ width:290, flexShrink:0 }}>
      <div style={{ position:"sticky", top:80 }}>
        {/* Quick contact card */}
        <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"22px 20px", marginBottom:16 }}>
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:instructor.avatarImg ? "transparent" : instructor.avatarBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, fontWeight:900, color:"#fff", margin:"0 auto 12px", overflow:"hidden" }}>
              {instructor.avatarImg
                ? <img src={instructor.avatarImg} alt={instructor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : instructor.avatar
              }
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:C.t1 }}>{instructor.name}</div>
            <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>{instructor.location}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:8 }}>
              <Stars n={instructor.rating} />
              <span style={{ fontSize:12, fontWeight:700, color:"#7A5620" }}>{instructor.rating}</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
            {[
              { icon:Users,    label:"Total students", v:`${(instructor.students/1000).toFixed(0)}K+` },
              { icon:BookOpen, label:"Total courses",  v:instructor.courses },
              { icon:MessageSquare, label:"Reviews",   v:`${(instructor.reviews/1000).toFixed(1)}K` },
              { icon:Award,    label:"Experience",     v:instructor.experience || "—" },
            ].map(({ icon:Icon, label, v }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 }}>
                <span style={{ display:"flex", alignItems:"center", gap:7, color:C.t2 }}><Icon size={14} color={C.t3} />{label}</span>
                <strong style={{ color:C.t1 }}>{v}</strong>
              </div>
            ))}
          </div>
          <button onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior:'smooth' })}
            style={{ width:"100%", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:`0 6px 18px ${C.p}35` }}>
            View all courses →
          </button>
        </div>

        {/* Specialties */}
        {instructor.specialties?.length > 0 && (
          <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:12 }}>Specialties</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {instructor.specialties.map(s => (
                <span key={s} style={{ background:C.pLt, color:C.p, borderRadius:100, padding:"4px 12px", fontSize:12, fontWeight:600 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:"#1A2044", padding:"36px clamp(20px,4vw,40px) 24px", marginTop:48 }}>
      <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={17} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:"#fff", fontWeight:900, fontSize:17 }}>Edu<span style={{ color:"#565E96" }}>BD</span></span>
        </div>
        <span style={{ color:"rgba(255,255,255,.2)", fontSize:13 }}>
          © 2025 EduBD · Designed &amp; Developed by{" "}
          <a href="https://ahsan-jannat.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color:"rgba(129,140,248,.85)", fontWeight:600, textDecoration:"none" }}>Ahsan Jannat</a>
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
  const C = useThemeColors();
  const { id } = useParams();

  const [instructor, setInstructor] = useState(FALLBACK_INSTRUCTOR);
  const [courses,     setCourses]   = useState([]);
  const [reviews,     setReviews]   = useState(FALLBACK_REVIEWS); // replaced with real API data once loaded
  const [loading,      setLoading]  = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get('/instructors/' + id),
      api.get('/instructors/' + id + '/courses').catch(() => []),
    ]).then(([r, crs]) => {
      if (r) {
        setInstructor({
          name:       r.name              || FALLBACK_INSTRUCTOR.name,
          title:      r.role              || FALLBACK_INSTRUCTOR.title,
          avatar:     r.name ? r.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : FALLBACK_INSTRUCTOR.avatar,
          avatarImg:  r.avatar            || null,
          avatarBg:   FALLBACK_INSTRUCTOR.avatarBg,
          badge:      FALLBACK_INSTRUCTOR.badge, // API doesn't return a badge — keep the generic default
          bio:        r.bio               || FALLBACK_INSTRUCTOR.bio,
          location:   r.city              || FALLBACK_INSTRUCTOR.location,
          language:   FALLBACK_INSTRUCTOR.language,
          website:    FALLBACK_INSTRUCTOR.website,
          youtube:    FALLBACK_INSTRUCTOR.youtube,
          facebook:   FALLBACK_INSTRUCTOR.facebook,
          linkedin:   FALLBACK_INSTRUCTOR.linkedin,
          rating:     r.stats?.rating         ?? FALLBACK_INSTRUCTOR.rating,
          reviews:    r.stats?.total_reviews  ?? FALLBACK_INSTRUCTOR.reviews,
          students:   r.stats?.total_students ?? FALLBACK_INSTRUCTOR.students,
          courses:    r.stats?.total_courses  ?? FALLBACK_INSTRUCTOR.courses,
          experience: FALLBACK_INSTRUCTOR.experience,
          specialties:FALLBACK_INSTRUCTOR.specialties,
        });
      }

      // Real reviews come back from the same /instructors/{id} call
      if (Array.isArray(r?.reviews) && r.reviews.length > 0) {
        setReviews(r.reviews.map(rv => ({
          name:   rv.user?.name || 'Student',
          av:     (rv.user?.name || 'ST').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          city:   rv.user?.city || '',
          rating: rv.rating || 0,
          date:   rv.created_at || '',
          text:   rv.body || '',
        })));
      }

      const courseList = Array.isArray(crs) ? crs : (crs?.data || []);
      setCourses(courseList.map(c => ({
        id: c.id, title: c.title, slug: c.slug,
        cat: c.category || 'General', catC: C.p, emoji: '📚',
        rating:   c.average_rating || 0, reviews: c.total_reviews || 0,
        students: (c.total_students || 0) >= 1000
          ? ((c.total_students||0)/1000).toFixed(1) + 'K'
          : String(c.total_students || 0),
        price: c.price || 0,
        orig:     c.original_price || (c.price||0)*2,
        level:    c.level || 'All Levels', dur: c.duration || '',
        thumb:    c.thumbnail_url ? `url(${c.thumbnail_url}) center/cover` : 'linear-gradient(135deg,#232A54,#4B5390)',
      })));
    }).catch(() => {
      // Keep fallback instructor/empty courses on error — no crash, just shows defaults
    }).finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color:C.t1, background:C.bg, minHeight:"100vh" }}>
      <Navbar />
      <InstructorHero instructor={instructor} />
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px clamp(20px,4vw,40px)", display:"flex", gap:36, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:280 }}>
          <RatingBreakdown instructor={instructor} />
          <AboutSection instructor={instructor} />
          <div id="courses-section">
            <CoursesSection instructor={instructor} courses={courses} loading={loading} />
          </div>
          <ReviewsSection reviews={reviews} />
        </div>
        <Sidebar instructor={instructor} />
      </div>
      <Footer />
    </div>
  );
}
