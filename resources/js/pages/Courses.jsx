

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Search, BookOpen, Award, Users, Star, ChevronRight, ChevronDown,
  Code, TrendingUp, Globe, Lightbulb, PenTool, BarChart2, Clock,
  LayoutGrid, List, SlidersHorizontal, X, GraduationCap, Check, ArrowUpDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

// ── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

// ── COURSE DATA ──────────────────────────────────────────────────────────────
const ALL_COURSES = [
  { id:1,  title:"Complete React & Next.js Developer Bootcamp",      cat:"Web Development",   catC:"#28305E", instructor:"Tanvir Ahmed",      av:"TA", rating:4.9, reviews:1240, price:1200, orig:2400, durH:42, dur:"42h", studentsN:8500,  students:"8.5K", level:"Intermediate", thumb:"linear-gradient(135deg,#232A54,#4B5390)", emoji:"⚛️", lang:"Bengali & English" },
  { id:2,  title:"Python for Data Science & Machine Learning",        cat:"Data Science",      catC:"#3A6B4C", instructor:"Dr. Nasrin Khatun", av:"NK", rating:4.8, reviews:980,  price:1500, orig:3000, durH:56, dur:"56h", studentsN:6200,  students:"6.2K", level:"Beginner",      thumb:"linear-gradient(135deg,#22432E,#4C8862)", emoji:"🐍", lang:"Bengali & English" },
  { id:3,  title:"IELTS Complete Preparation Course 2025",            cat:"English & IELTS",   catC:"#2D6B6B", instructor:"Kabir Hossain",     av:"KH", rating:4.9, reviews:2100, price:1100, orig:2200, durH:38, dur:"38h", studentsN:12000, students:"12K",  level:"All Levels",    thumb:"linear-gradient(135deg,#1C4444,#3F8A8A)", emoji:"📝", lang:"Bengali & English" },
  { id:4,  title:"UI/UX Design Masterclass — Figma to Prototype",     cat:"Graphic Design",    catC:"#C98A2C", instructor:"Fatema Begum",      av:"FB", rating:4.7, reviews:750,  price:900,  orig:1800, durH:31, dur:"31h", studentsN:4100,  students:"4.1K", level:"Beginner",      thumb:"linear-gradient(135deg,#7A5620,#D9A13F)", emoji:"🎨", lang:"Bengali & English" },
  { id:5,  title:"Digital Marketing Complete Bootcamp 2025",          cat:"Digital Marketing", catC:"#6B4A6E", instructor:"Sabbir Rahman",     av:"SR", rating:4.8, reviews:890,  price:800,  orig:1600, durH:28, dur:"28h", studentsN:5800,  students:"5.8K", level:"Beginner",      thumb:"linear-gradient(135deg,#442E46,#8A5F8D)", emoji:"📱", lang:"Bengali & English" },
  { id:6,  title:"Financial Accounting & Tally ERP Complete",         cat:"Finance",           catC:"#C98A2C", instructor:"Mohammed Ali",      av:"MA", rating:4.6, reviews:620,  price:700,  orig:1400, durH:24, dur:"24h", studentsN:3400,  students:"3.4K", level:"Beginner",      thumb:"linear-gradient(135deg,#5C3B28,#A87A50)", emoji:"💰", lang:"Bengali & English" },
  { id:7,  title:"Vue.js & Nuxt.js — The Complete Guide",             cat:"Web Development",   catC:"#28305E", instructor:"Arif Hossain",      av:"AH", rating:4.6, reviews:420,  price:1000, orig:2000, durH:32, dur:"32h", studentsN:3200,  students:"3.2K", level:"Intermediate",  thumb:"linear-gradient(135deg,#22432E,#4C8862)", emoji:"💚", lang:"Bengali" },
  { id:8,  title:"Machine Learning with TensorFlow & PyTorch",        cat:"Data Science",      catC:"#3A6B4C", instructor:"Dr. Nasrin Khatun", av:"NK", rating:4.7, reviews:350,  price:1800, orig:3600, durH:48, dur:"48h", studentsN:2800,  students:"2.8K", level:"Advanced",      thumb:"linear-gradient(135deg,#232A54,#4B5390)", emoji:"🤖", lang:"English" },
  { id:9,  title:"English Grammar & Communication Mastery",           cat:"English & IELTS",   catC:"#2D6B6B", instructor:"Kabir Hossain",     av:"KH", rating:4.7, reviews:680,  price:600,  orig:1200, durH:24, dur:"24h", studentsN:4500,  students:"4.5K", level:"Beginner",      thumb:"linear-gradient(135deg,#1C4444,#3F8A8A)", emoji:"🗣️", lang:"Bengali" },
  { id:10, title:"Adobe Photoshop & Illustrator Complete Course",     cat:"Graphic Design",    catC:"#C98A2C", instructor:"Rina Parvin",       av:"RP", rating:4.5, reviews:520,  price:850,  orig:1700, durH:28, dur:"28h", studentsN:3800,  students:"3.8K", level:"Beginner",      thumb:"linear-gradient(135deg,#7A5620,#D9A13F)", emoji:"🖌️", lang:"Bengali" },
  { id:11, title:"SEO & Content Marketing Strategy 2025",             cat:"Digital Marketing", catC:"#6B4A6E", instructor:"Sabbir Rahman",     av:"SR", rating:4.6, reviews:410,  price:700,  orig:1400, durH:22, dur:"22h", studentsN:3100,  students:"3.1K", level:"Beginner",      thumb:"linear-gradient(135deg,#442E46,#8A5F8D)", emoji:"🔍", lang:"Bengali" },
  { id:12, title:"Excel for Business & Data Analysis Masterclass",    cat:"Finance",           catC:"#C98A2C", instructor:"Mohammed Ali",      av:"MA", rating:4.5, reviews:380,  price:500,  orig:1000, durH:18, dur:"18h", studentsN:4200,  students:"4.2K", level:"Beginner",      thumb:"linear-gradient(135deg,#5C3B28,#A87A50)", emoji:"📊", lang:"Bengali" },
];

const CAT_OPTS   = ["Web Development","Data Science","Graphic Design","Digital Marketing","English & IELTS","Finance","Job Prep / BCS & Bank Jobs"];
const LEVEL_OPTS = ["Beginner","Intermediate","Advanced","All Levels"];
const LANG_OPTS  = ["Bengali","English","Bengali & English"];
const SORT_OPTS  = [
  { value:"popular", label:"Most Popular" },
  { value:"rating",  label:"Highest Rated" },
  { value:"newest",  label:"Newest" },
  { value:"priceLo", label:"Price: Low to High" },
  { value:"priceHi", label:"Price: High to Low" },
];
const catCounts = ALL_COURSES.reduce((acc,c)=>{ acc[c.cat]=(acc[c.cat]||0)+1; return acc; }, {});

// ── HELPERS ──────────────────────────────────────────────────────────────────
function Stars({ n }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[...Array(5)].map((_,i)=>(<Star key={i} size={12} fill={i<Math.floor(n)?"#C98A2C":"none"} color={i<Math.floor(n)?"#C98A2C":"#D9D0C0"} />))}
    </span>
  );
}
function Avatar({ initials, size=28, bg=C.p }) {
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.34,fontWeight:800,color:"#fff",flexShrink:0 }}>
      {initials}
    </div>
  );
}
function Tag({ label, color=C.p }) {
  return <span style={{ display:"inline-block",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100,background:color+"22",color,whiteSpace:"nowrap" }}>{label}</span>;
}
function Checkbox({ checked, onChange, label, count }) {
  return (
    <label style={{ display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"5px 0",userSelect:"none" }} onClick={onChange}>
      <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${checked?C.p:C.bd}`,background:checked?C.p:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s" }}>
        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>
      <span style={{ fontSize:13,color:C.t2,flex:1,lineHeight:1.4 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize:11,color:C.t3 }}>({count})</span>}
    </label>
  );
}

// ── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const C = useThemeColors();
  return (
    <nav style={{ position:"sticky",top:0,zIndex:100,background:C.w,borderBottom:`1px solid ${C.bd}` }}>
      <div style={{ display:"flex",alignItems:"center",height:64,gap:28,maxWidth:1280,margin:"0 auto",padding:"0 clamp(20px,4vw,40px)" }}>
        <Link to="/" style={{ display:"flex",alignItems:"center",gap:9,textDecoration:"none",flexShrink:0 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.t1,fontWeight:900,fontSize:20,letterSpacing:"-0.5px" }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </Link>
        <div style={{ display:"flex",gap:2,flex:1 }}>
          {[["Home","/"],["Courses","/courses"],["Bundles","/bundles"],["Blog","/blog"],["About","/about"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:l==="Courses"?C.p:C.t2,fontSize:14,fontWeight:l==="Courses"?700:500,padding:"7px 13px",borderRadius:8,textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </div>
    </nav>
  );
}

// ── PAGE HEADER ───────────────────────────────────────────────────────────────
function PageHeader({ total }) {
  return (
    <div style={{ background:C.pLt, borderBottom:`1px solid ${C.bd}`, padding:"28px clamp(20px,4vw,40px)" }}>
      <div style={{ maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.t3,marginBottom:10 }}>
          <Link to="/" style={{ color:C.t3,textDecoration:"none" }}>Home</Link>
          <ChevronRight size={14} />
          <span style={{ color:C.p,fontWeight:600 }}>All Courses</span>
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(22px,3vw,32px)",fontWeight:600,color:C.t1,margin:"0 0 4px",letterSpacing:"-0.5px" }}>Explore All Courses</h1>
            <p style={{ color:C.t2,fontSize:14,margin:0 }}><strong style={{ color:C.p }}>{total}</strong> courses available · Find your perfect learning path</p>
          </div>
          <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
            {[["500+","Courses"],["120+","Instructors"],["50K+","Students"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:18,fontWeight:900,color:C.t1 }}>{v}</div>
                <div style={{ fontSize:11,color:C.t3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FILTER SIDEBAR ────────────────────────────────────────────────────────────
function FilterSidebar({ cats, levels, langs, minRating, price, onCat, onLevel, onLang, onRating, onPrice, onClear, totalActive }) {
  const [open, setOpen] = useState({ cat:true, level:true, rating:true, price:true, lang:false });
  const tog = k => setOpen(p=>({ ...p, [k]:!p[k] }));

  const Section = ({ id, title, children }) => (
    <div style={{ borderBottom:`1px solid ${C.bd}`, paddingBottom:16, marginBottom:16 }}>
      <button onClick={()=>tog(id)} style={{ width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:"0 0 10px",fontSize:13,fontWeight:700,color:C.t1 }}>
        {title}
        <ChevronDown size={15} color={C.t3} style={{ transform:open[id]?"rotate(180deg)":"", transition:"transform .2s" }} />
      </button>
      {open[id] && <div>{children}</div>}
    </div>
  );

  return (
    <div style={{ width:260, flexShrink:0 }}>
      <div style={{ background:C.w, border:`1px solid ${C.bd}`, borderRadius:18, padding:"20px 18px", position:"sticky", top:80 }}>
        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,fontSize:15,fontWeight:800,color:C.t1 }}>
            <SlidersHorizontal size={16} color={C.p} /> Filters
            {totalActive>0 && <span style={{ background:C.p,color:C.w,fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:100 }}>{totalActive}</span>}
          </div>
          {totalActive>0 && (
            <button onClick={onClear} style={{ fontSize:12,color:C.a,fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0 }}>Clear all</button>
          )}
        </div>

        {/* Category */}
        <Section id="cat" title="Category">
          {CAT_OPTS.map(c=>(
            <Checkbox key={c} checked={cats.includes(c)} onChange={()=>onCat(c)} label={c} count={catCounts[c]||0} />
          ))}
        </Section>

        {/* Skill Level */}
        <Section id="level" title="Skill Level">
          {LEVEL_OPTS.map(l=>(
            <Checkbox key={l} checked={levels.includes(l)} onChange={()=>onLevel(l)} label={l} />
          ))}
        </Section>

        {/* Rating */}
        <Section id="rating" title="Minimum Rating">
          {[4.5,4.0,3.5].map(r=>(
            <Checkbox key={r} checked={minRating===r} onChange={()=>onRating(minRating===r?0:r)} label={`${r}★ & above`} />
          ))}
        </Section>

        {/* Price */}
        <Section id="price" title="Price Range">
          {[
            { v:"all",  l:"All prices" },
            { v:"u1k",  l:"Under ৳1,000" },
            { v:"1k2k", l:"৳1,000 – ৳2,000" },
            { v:"a2k",  l:"Above ৳2,000" },
          ].map(p=>(
            <Checkbox key={p.v} checked={price===p.v} onChange={()=>onPrice(p.v)} label={p.l} />
          ))}
        </Section>

        {/* Language */}
        <Section id="lang" title="Language">
          {LANG_OPTS.map(l=>(
            <Checkbox key={l} checked={langs.includes(l)} onChange={()=>onLang(l)} label={l} />
          ))}
        </Section>
      </div>
    </div>
  );
}

// ── COURSE CARD (GRID) ────────────────────────────────────────────────────────
function CourseCardGrid({ c }) {
  const disc = c.orig > 0 ? Math.round((1-c.price/c.orig)*100) : 0;
  return (
    <Link to={`/course/${c.slug}`} style={{ background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:18,overflow:"hidden",cursor:"pointer",transition:"all .2s",textDecoration:"none",display:"block" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow=`0 16px 40px ${c.catC}20`;e.currentTarget.style.borderColor=c.catC+"50";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=C.bd;}}
    >
      <div style={{ background:c.thumb,height:140,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,position:"relative" }}>
        {c.emoji}
        <div style={{ position:"absolute",top:10,left:10 }}><Tag label={c.cat.split(" ")[0]} color={c.catC} /></div>
        {disc > 0 && <div style={{ position:"absolute",top:10,right:10,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",borderRadius:7,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff" }}>{disc}% OFF</div>}
      </div>
      <div style={{ padding:"14px 16px 17px" }}>
        <h3 style={{ fontSize:13,fontWeight:700,color:C.t1,margin:"0 0 9px",lineHeight:1.4 }}>{c.title}</h3>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
          <Avatar initials={c.av} size={22} bg={c.catC} />
          <span style={{ fontSize:11,color:C.t2 }}>{c.instructor}</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:9 }}>
          <Stars n={c.rating} />
          <span style={{ fontSize:11,fontWeight:700,color:"#7A5620" }}>{c.rating}</span>
          <span style={{ fontSize:11,color:C.t3 }}>({c.reviews.toLocaleString()})</span>
        </div>
        <div style={{ display:"flex",gap:10,marginBottom:12,fontSize:11,color:C.t3,flexWrap:"wrap" }}>
          <span style={{ display:"flex",alignItems:"center",gap:2 }}><Clock size={10} /> {c.dur}</span>
          <span style={{ display:"flex",alignItems:"center",gap:2 }}><Users size={10} /> {c.students}</span>
          <span style={{ background:C.pLt,color:C.p,padding:"1px 7px",borderRadius:100,fontWeight:600,fontSize:10 }}>{c.level}</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:11,borderTop:`1px solid ${C.bd}` }}>
          <div>
            <span style={{ fontSize:17,fontWeight:900,color:C.t1 }}>৳{c.price.toLocaleString()}</span>
            {c.orig > c.price && <span style={{ fontSize:11,color:C.t3,textDecoration:"line-through",marginLeft:6 }}>৳{c.orig.toLocaleString()}</span>}
          </div>
          {c.orig > c.price && <span style={{ fontSize:10,fontWeight:700,color:C.g,background:C.gLt,padding:"3px 8px",borderRadius:100 }}>Save ৳{(c.orig-c.price).toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── COURSE CARD (LIST) ────────────────────────────────────────────────────────
function CourseCardList({ c }) {
  const disc = c.orig > 0 ? Math.round((1-c.price/c.orig)*100) : 0;
  return (
    <Link to={`/course/${c.slug}`} style={{ background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:16,display:"flex",gap:0,overflow:"hidden",cursor:"pointer",transition:"all .2s",textDecoration:"none" }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 8px 24px ${c.catC}18`;e.currentTarget.style.borderColor=c.catC+"40";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=C.bd;}}
    >
      {/* Thumb */}
      <div style={{ background:c.thumb,width:160,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40 }}>
        {c.emoji}
      </div>
      {/* Body */}
      <div style={{ padding:"16px 18px",flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ marginBottom:6 }}><Tag label={c.cat} color={c.catC} /></div>
            <h3 style={{ fontSize:14,fontWeight:700,color:C.t1,margin:"0 0 8px",lineHeight:1.4 }}>{c.title}</h3>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
              <Avatar initials={c.av} size={22} bg={c.catC} />
              <span style={{ fontSize:12,color:C.t2 }}>{c.instructor}</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
              <Stars n={c.rating} />
              <span style={{ fontSize:12,fontWeight:700,color:"#7A5620" }}>{c.rating}</span>
              <span style={{ fontSize:12,color:C.t3 }}>({c.reviews.toLocaleString()} reviews)</span>
            </div>
            <div style={{ display:"flex",gap:12,fontSize:12,color:C.t3 }}>
              <span style={{ display:"flex",alignItems:"center",gap:3 }}><Clock size={11} /> {c.dur}</span>
              <span style={{ display:"flex",alignItems:"center",gap:3 }}><Users size={11} /> {c.students} students</span>
              <span style={{ background:C.pLt,color:C.p,padding:"2px 8px",borderRadius:100,fontWeight:600,fontSize:11 }}>{c.level}</span>
            </div>
          </div>
          {/* Price */}
          <div style={{ textAlign:"right",flexShrink:0 }}>
            <div style={{ fontSize:20,fontWeight:900,color:C.t1,letterSpacing:"-0.5px" }}>৳{c.price.toLocaleString()}</div>
            {c.orig > c.price && <div style={{ fontSize:12,color:C.t3,textDecoration:"line-through" }}>৳{c.orig.toLocaleString()}</div>}
            {disc > 0 && <div style={{ fontSize:11,fontWeight:700,color:C.g,background:C.gLt,padding:"3px 9px",borderRadius:100,marginTop:5,display:"inline-block" }}>{disc}% OFF</div>}
            <div style={{ marginTop:10 }}>
              <span style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`,color:C.w,border:"none",borderRadius:9,padding:"8px 18px",fontSize:13,fontWeight:700,whiteSpace:"nowrap",display:"inline-block" }}>
                View course
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:"#1A2044", padding:"48px clamp(20px,4vw,40px) 24px", marginTop:"auto" }}>
      <div style={{ maxWidth:1280,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:9 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${C.p},#4B5390)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <GraduationCap size={18} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.w,fontWeight:900,fontSize:18 }}>Edu<span style={{ color:C.pMd }}>BD</span></span>
        </div>
        <span style={{ color:"rgba(255,255,255,.25)",fontSize:13 }}>© 2025 EduBD · Bangladesh's #1 Learning Platform</span>
        <div style={{ display:"flex",gap:20 }}>
          {[["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:"rgba(255,255,255,.3)",fontSize:13,textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const C = useThemeColors();
  usePageTitle("All Courses");
  const [courses,   setCourses]   = useState(ALL_COURSES); // starts with sample data
  const [cats,      setCats]      = useState([]);
  const [levels,    setLevels]    = useState([]);
  const [langs,     setLangs]     = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [price,     setPrice]     = useState("all");
  const [sort,      setSort]      = useState("popular");
  const [view,      setView]      = useState("grid");
  const [search,    setSearch]    = useState("");
  const [showSort,  setShowSort]  = useState(false);

  // Fetch real courses from API on mount — fall back to sample data silently
  useEffect(() => {
    api.get("/courses?per_page=50")
      .then(res => {
        if (res?.data?.length) {
          const mapped = res.data.map(c => ({
            id: c.id, title: c.title, slug: c.slug,
            cat:  c.category?.name?.split(" ")[0] || "Other",
            catC: c.category?.color || "#28305E",
            instructor: c.instructor?.name || "",
            av:   (c.instructor?.name || "??").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase(),
            rating:   c.rating || 0,
            reviews:  c.total_reviews || 0,
            price:    c.discount_price || c.price || 0,
            orig:     c.price || 0,
            dur:      c.total_duration_minutes ? `${Math.round(c.total_duration_minutes/60)}h` : "—",
            students: c.total_students >= 1000 ? `${(c.total_students/1000).toFixed(1)}K` : String(c.total_students),
            studentsN: c.total_students || 0,
            level:    c.level || "Beginner",
            lang:     c.language || "Bengali & English",
            thumb:    `linear-gradient(135deg,${c.category?.color || "#28305E"},${c.category?.color || "#4B5390"}cc)`,
            emoji:    "📚",
          }));
          setCourses(mapped);
        }
      })
      .catch(() => { /* stay on sample data silently */ });
  }, []);

  // Dynamic category counts from loaded courses
  const catCounts = courses.reduce((acc, c) => { acc[c.cat] = (acc[c.cat] || 0) + 1; return acc; }, {});

  const toggle = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);

  const clearAll = () => { setCats([]); setLevels([]); setLangs([]); setMinRating(0); setPrice("all"); };

  const totalActive = cats.length + levels.length + langs.length + (minRating>0?1:0) + (price!=="all"?1:0);

  const filtered = useMemo(()=>{
    let r = courses.filter(c=>{
      if (cats.length   && !cats.includes(c.cat))         return false;
      if (levels.length && !levels.includes(c.level))     return false;
      if (langs.length  && !langs.includes(c.lang))       return false;
      if (minRating>0   && c.rating < minRating)          return false;
      if (price==="u1k"  && c.price >= 1000)              return false;
      if (price==="1k2k" && (c.price<1000||c.price>2000)) return false;
      if (price==="a2k"  && c.price <= 2000)              return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !(c.instructor||"").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sort==="popular") r.sort((a,b)=>b.studentsN-a.studentsN);
    if (sort==="rating")  r.sort((a,b)=>b.rating-a.rating);
    if (sort==="newest")  r.sort((a,b)=>b.id-a.id);
    if (sort==="priceLo") r.sort((a,b)=>a.price-b.price);
    if (sort==="priceHi") r.sort((a,b)=>b.price-a.price);
    return r;
  }, [courses, cats, levels, langs, minRating, price, sort, search]);

  const activeSortLabel = SORT_OPTS.find(s=>s.value===sort)?.label || "Sort";

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",color:C.t1,background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column" }}>
      <Navbar />
      <PageHeader total={courses.length} />

      <div style={{ flex:1, maxWidth:1280, margin:"0 auto", width:"100%", padding:"28px clamp(20px,4vw,40px)", display:"flex", gap:28, alignItems:"flex-start" }}>

        {/* Sidebar */}
        <FilterSidebar
          cats={cats} levels={levels} langs={langs} minRating={minRating} price={price}
          onCat={v=>toggle(cats,setCats,v)}
          onLevel={v=>toggle(levels,setLevels,v)}
          onLang={v=>toggle(langs,setLangs,v)}
          onRating={setMinRating}
          onPrice={setPrice}
          onClear={clearAll}
          totalActive={totalActive}
        />

        {/* Main content */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Search + controls bar */}
          <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            {/* Search */}
            <div style={{ flex:"1 1 240px", display:"flex", alignItems:"center", gap:10, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:12, padding:"0 14px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
              <Search size={16} color={C.t3} />
              <input
                value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search courses or instructors..."
                style={{ flex:1, border:"none", outline:"none", fontSize:14, color:C.t1, padding:"11px 0", background:"transparent" }}
              />
              {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",padding:2,display:"flex" }}><X size={14} color={C.t3} /></button>}
            </div>

            {/* Sort dropdown */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>setShowSort(!showSort)} style={{ display:"flex",alignItems:"center",gap:7,background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:12,padding:"11px 16px",fontSize:13,fontWeight:600,color:C.t1,cursor:"pointer",whiteSpace:"nowrap" }}>
                <ArrowUpDown size={14} color={C.t3} /> {activeSortLabel} <ChevronDown size={13} color={C.t3} />
              </button>
              {showSort && (
                <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,padding:6,zIndex:50,minWidth:190,boxShadow:"0 8px 24px rgba(0,0,0,.1)" }}>
                  {SORT_OPTS.map(s=>(
                    <button key={s.value} onClick={()=>{setSort(s.value);setShowSort(false);}} style={{ display:"block",width:"100%",textAlign:"left",padding:"9px 14px",borderRadius:9,border:"none",background:sort===s.value?C.pLt:"transparent",color:sort===s.value?C.p:C.t2,fontSize:13,fontWeight:sort===s.value?700:400,cursor:"pointer" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div style={{ display:"flex",background:C.w,border:`1.5px solid ${C.bd}`,borderRadius:12,overflow:"hidden" }}>
              {[{v:"grid",I:LayoutGrid},{v:"list",I:List}].map(({v,I})=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:"10px 14px",border:"none",background:view===v?C.pLt:"transparent",color:view===v?C.p:C.t3,cursor:"pointer",display:"flex",alignItems:"center" }}>
                  <I size={17} />
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {(totalActive > 0 || search) && (
            <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center" }}>
              <span style={{ fontSize:12,color:C.t3 }}>Active:</span>
              {cats.map(c=>(
                <span key={c} style={{ display:"inline-flex",alignItems:"center",gap:5,background:C.p+"18",color:C.p,border:`1px solid ${C.p}40`,borderRadius:100,padding:"4px 10px",fontSize:12,fontWeight:600 }}>
                  {c} <X size={11} style={{ cursor:"pointer" }} onClick={()=>toggle(cats,setCats,c)} />
                </span>
              ))}
              {levels.map(l=>(
                <span key={l} style={{ display:"inline-flex",alignItems:"center",gap:5,background:C.g+"18",color:C.g,border:`1px solid ${C.g}40`,borderRadius:100,padding:"4px 10px",fontSize:12,fontWeight:600 }}>
                  {l} <X size={11} style={{ cursor:"pointer" }} onClick={()=>toggle(levels,setLevels,l)} />
                </span>
              ))}
              {minRating>0 && (
                <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:C.y+"18",color:"#7A5620",border:`1px solid ${C.y}50`,borderRadius:100,padding:"4px 10px",fontSize:12,fontWeight:600 }}>
                  {minRating}★+ <X size={11} style={{ cursor:"pointer" }} onClick={()=>setMinRating(0)} />
                </span>
              )}
              {price!=="all" && (
                <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:C.a+"18",color:C.a,border:`1px solid ${C.a}40`,borderRadius:100,padding:"4px 10px",fontSize:12,fontWeight:600 }}>
                  Price filter <X size={11} style={{ cursor:"pointer" }} onClick={()=>setPrice("all")} />
                </span>
              )}
              <button onClick={()=>{clearAll();setSearch("");}} style={{ fontSize:12,color:C.a,fontWeight:600,background:"none",border:"none",cursor:"pointer",textDecoration:"underline" }}>Clear all</button>
            </div>
          )}

          {/* Result count */}
          <div style={{ fontSize:13,color:C.t3,marginBottom:18,fontWeight:500 }}>
            Showing <strong style={{ color:C.t1 }}>{filtered.length}</strong> of {ALL_COURSES.length} courses
          </div>

          {/* Course grid or list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 20px", background:C.w, borderRadius:18, border:`1px solid ${C.bd}` }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.t1, margin:"0 0 8px" }}>No courses found</h3>
              <p style={{ color:C.t3, fontSize:14 }}>Try adjusting your filters or search term.</p>
              <button onClick={()=>{clearAll();setSearch("");}} style={{ marginTop:16, background:C.p, color:C.w, border:"none", borderRadius:10, padding:"10px 22px", fontWeight:700, fontSize:14, cursor:"pointer" }}>Clear filters</button>
            </div>
          ) : view === "grid" ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:18 }}>
              {filtered.map(c=><CourseCardGrid key={c.id} c={c} />)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {filtered.map(c=><CourseCardList key={c.id} c={c} />)}
            </div>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginTop:36, paddingTop:24, borderTop:`1px solid ${C.bd}` }}>
              <button style={{ width:38,height:38,borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t3 }}>
                <ChevronRight size={16} style={{ transform:"rotate(180deg)" }} />
              </button>
              {[1,2,3,4,5].map(n=>(
                <button key={n} style={{ width:38,height:38,borderRadius:10,border:`1.5px solid ${n===1?C.p:C.bd}`,background:n===1?C.p:C.w,color:n===1?C.w:C.t2,fontSize:14,fontWeight:n===1?700:400,cursor:"pointer" }}>{n}</button>
              ))}
              <span style={{ color:C.t3, fontSize:14 }}>...</span>
              <button style={{ width:38,height:38,borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t3 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
