

// BUILD-MARKER: edubd-2026-07-12-payment-callback-method-fix — if this exact
// line is missing when you run `grep BUILD-MARKER resources/js/pages/Home.jsx`,
// you are looking at an OLD file. Stop, delete it, and re-extract the zip.

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useSiteContent } from "@/lib/useSiteContent";
import LiveSearch from "@/components/LiveSearch";
import MegaMenu from "@/components/MegaMenu";
import Logo from "@/components/Logo";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { usePageSeo } from "@/lib/usePageSeo";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";
import {
  Search, BookOpen, Award, Users, Star, ChevronRight, ChevronDown,
  Code, TrendingUp, Globe, Lightbulb, PenTool, BarChart2, Landmark,
  Clock, Zap, Check, Play, GraduationCap, BadgeCheck,
} from "lucide-react";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
// Grounded in Bangladeshi textile heritage (kantha embroidery, indigo dye,
// jamdani weaving) rather than a generic trend palette — see theme.js for
// the shared, documented version other pages import from.
const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

// ── COURSE & PAGE DATA ────────────────────────────────────────────────────────
const CATS = [
  { name:"Web Development",   icon:Code,      count:245, bg:"#E8E9F1", ic:"#28305E" },
  { name:"Data Science",      icon:BarChart2,  count:180, bg:"#E3EDE6", ic:"#3A6B4C" },
  { name:"Graphic Design",    icon:PenTool,    count:160, bg:"#F5E9D4", ic:"#C98A2C" },
  { name:"Digital Marketing", icon:TrendingUp, count:120, bg:"#EFE4EF", ic:"#6B4A6E" },
  { name:"English & IELTS",   icon:Globe,      count:95,  bg:"#DFEBEA", ic:"#2D6B6B" },
  { name:"Finance",           icon:Lightbulb,  count:85,  bg:"#EDE1D6", ic:"#8A5A3D" },
  { name:"Job Prep / BCS & Bank Jobs", icon:Landmark, count:70, bg:"#EFE0E3", ic:"#6B2C39" },
];
const DEFAULT_COURSES = [
  { id:1, title:"Complete React & Next.js Developer Bootcamp",   cat:"Web Dev",   catC:"#28305E", instructor:"Tanvir Ahmed",      av:"TA", rating:4.9, reviews:1240, price:1200, orig:2400, dur:"42h", students:"8.5K", level:"Intermediate", thumb:"linear-gradient(135deg,#232A54,#4B5390)", emoji:"⚛️" },
  { id:2, title:"Python for Data Science & Machine Learning",    cat:"Data",      catC:"#3A6B4C", instructor:"Dr. Nasrin Khatun", av:"NK", rating:4.8, reviews:980,  price:1500, orig:3000, dur:"56h", students:"6.2K", level:"Beginner",      thumb:"linear-gradient(135deg,#22432E,#4C8862)", emoji:"🐍" },
  { id:3, title:"IELTS Complete Preparation Course 2025",        cat:"English",   catC:"#2D6B6B", instructor:"Kabir Hossain",     av:"KH", rating:4.9, reviews:2100, price:1100, orig:2200, dur:"38h", students:"12K",  level:"All Levels",    thumb:"linear-gradient(135deg,#1C4444,#3F8A8A)", emoji:"📝" },
  { id:4, title:"UI/UX Design Masterclass — Figma to Prototype", cat:"Design",    catC:"#C98A2C", instructor:"Fatema Begum",      av:"FB", rating:4.7, reviews:750,  price:900,  orig:1800, dur:"31h", students:"4.1K", level:"Beginner",      thumb:"linear-gradient(135deg,#7A5620,#D9A13F)", emoji:"🎨" },
  { id:5, title:"Digital Marketing Complete Bootcamp 2025",      cat:"Marketing", catC:"#6B4A6E", instructor:"Sabbir Rahman",     av:"SR", rating:4.8, reviews:890,  price:800,  orig:1600, dur:"28h", students:"5.8K", level:"Beginner",      thumb:"linear-gradient(135deg,#442E46,#8A5F8D)", emoji:"📱" },
  { id:6, title:"Financial Accounting & Tally ERP Complete",     cat:"Finance",   catC:"#8A5A3D", instructor:"Mohammed Ali",      av:"MA", rating:4.6, reviews:620,  price:700,  orig:1400, dur:"24h", students:"3.4K", level:"Beginner",      thumb:"linear-gradient(135deg,#5C3B28,#A87A50)", emoji:"💰" },
];
const DEFAULT_INSTRUCTORS = [
  { name:"Tanvir Ahmed",      subject:"Web Development",   students:"8.5K", rating:4.9, av:"TA", courses:12, bg:"#28305E" },
  { name:"Dr. Nasrin Khatun", subject:"Data Science & ML", students:"6.2K", rating:4.8, av:"NK", courses:8,  bg:"#3A6B4C" },
  { name:"Kabir Hossain",     subject:"English & IELTS",   students:"12K",  rating:4.9, av:"KH", courses:6,  bg:"#2D6B6B" },
  { name:"Fatema Begum",      subject:"UI/UX Design",      students:"4.1K", rating:4.7, av:"FB", courses:9,  bg:"#C98A2C" },
];
const FEATURES = [
  { icon:GraduationCap, title:"Expert instructors",     desc:"Handpicked local & global experts with real-world industry experience.",      color:"#28305E" },
  { icon:BadgeCheck,    title:"Verified certificates",  desc:"Industry-recognised PDF certificates with unique shareable verify codes.",     color:"#3A6B4C" },
  { icon:Globe,         title:"Bengali & English",      desc:"All courses available in both Bengali and English — learn in your language.",   color:"#2D6B6B" },
  { icon:Zap,           title:"bKash & Nagad payments", desc:"Pay instantly with bKash, Nagad, or SSLCommerz. No international card needed.", color:"#6B4A6E" },
  { icon:Clock,         title:"Lifetime access",        desc:"Buy once, access forever. Study at your own pace, any time, any device.",      color:"#B23A2E" },
  { icon:BookOpen,      title:"500+ quality courses",   desc:"Covering Web Dev, Design, Marketing, Data Science, Finance, Language & more.",  color:"#C98A2C" },
];
const TESTIMONIALS = [
  { name:"Rafiqul Islam", role:"Frontend Dev @ DevCraft BD",   city:"Dhaka",      av:"RI", c:"#28305E", text:"EduBD helped me land my first developer job in just 6 months. The Next.js course was hands-on — I built 5 real projects while learning. Nothing comes close." },
  { name:"Fatima Akter",  role:"Freelance Digital Marketer",    city:"Chittagong", av:"FA", c:"#6B4A6E", text:"After the Digital Marketing course I started earning ৳30K/month on Fiverr within 3 months. This was the best career investment I ever made." },
  { name:"Karim Ahmed",   role:"Data Analyst @ Grameenphone",   city:"Sylhet",     av:"KA", c:"#3A6B4C", text:"Dr. Nasrin explains ML concepts in a way anyone can understand. The Python course completely changed my career path. I highly recommend EduBD." },
];

// ── SHARED HELPERS ────────────────────────────────────────────────────────────
function Stars({ n = 5, size = 13 }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={size} fill={i < Math.floor(n) ? "#C98A2C" : "none"} color={i < Math.floor(n) ? "#C98A2C" : "#D9D0C0"} />
      ))}
    </span>
  );
}
function Av({ initials, size = 38, bg = C.p }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size * .34, fontWeight:800, color:"#fff", flexShrink:0 }}>
      {initials}
    </div>
  );
}
function Tag({ label, color = C.p }) {
  return <span style={{ display:"inline-block", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:100, background:color+"22", color }}>{label}</span>;
}
function SH({ eyebrow, title, center = false }) {
  return (
    <div style={{ marginBottom:36, textAlign:center ? "center" : "left" }}>
      <p style={{ color:C.a, fontWeight:700, fontSize:12, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:".1em" }}>{eyebrow}</p>
      <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(24px,3.5vw,38px)", fontWeight:600, color:C.t1, margin:0, letterSpacing:"-0.8px", lineHeight:1.15 }}>{title}</h2>
    </div>
  );
}

// ── NAVBAR — MEGA MENU ────────────────────────────────────────────────────────
function Navbar() {
  // Was a bespoke hover-triggered mega-dropdown (categories + a "most
  // popular courses" live preview + a stats panel) — richer than every other
  // page's navbar, but hover-only, so none of it was ever reachable on
  // mobile either way. Swapped for the same shared, mobile-responsive
  // MegaMenu every other page now uses, for one consistent nav instead of a
  // patchwork where one page is prettier on desktop and every page is still
  // broken on the device most visitors are actually using (see
  // UPGRADE_PLAN.md Phase 5 item 15 — 71% of Bangladesh's web traffic is
  // mobile). "Instructors" and About's four sub-pages, previously reachable
  // only from this page's own dropdowns, are preserved as real menu_items so
  // they don't lose their nav entry point.
  return <MegaMenu logo={<Logo />} actions={<><DarkModeToggle size="sm" /><AuthNavActions /></>} />;
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ query, setQuery, cms = {} }) {
  return (
    <section style={{ background:C.pLt, padding:"88px clamp(20px,5vw,48px)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-120, right:-80, width:500, height:500, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},#4B5390)`, opacity:.09, pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-80, left:-40, width:320, height:320, borderRadius:"50%", background:C.a, opacity:.07, pointerEvents:"none" }} />

      <div style={{ display:"flex", gap:64, alignItems:"center", maxWidth:1200, margin:"0 auto", flexWrap:"wrap" }}>
        {/* Left */}
        <div style={{ flex:"1 1 460px", minWidth:280 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:C.aLt, border:`1.5px solid rgba(249,115,22,.28)`, borderRadius:100, padding:"6px 14px", marginBottom:26 }}>
            <BadgeCheck size={15} color={C.a} />
            <span style={{ fontSize:13, color:C.a, fontWeight:700 }}>#1 Online Learning Platform in Bangladesh</span>
          </div>

          <h1 style={{ fontFamily:"'Fraunces',serif", color:C.t1, fontSize:"clamp(34px,5.5vw,60px)", fontWeight:600, lineHeight:1.08, margin:"0 0 22px", letterSpacing:"-1.5px" }}>
            {cms.hero_title ? cms.hero_title : (
              <>Master new skills,<br />
                <span style={{ background:`linear-gradient(135deg,${C.p} 20%,#4B5390 60%,${C.a} 100%)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  earn real certificates.
                </span>
              </>
            )}
          </h1>

          <p style={{ color:C.t2, fontSize:17, lineHeight:1.75, margin:"0 0 32px", maxWidth:500 }}>
            {cms.hero_subtitle || "Learn from Bangladesh's top experts. 500+ courses in Bengali & English. Pay with bKash or Nagad and start in minutes."}
          </p>

          {/* Search */}
          <div style={{ display:"flex", gap:8, marginBottom:18, maxWidth:520, background:C.w, borderRadius:14, padding:"5px 5px 5px 16px", boxShadow:`0 4px 28px ${C.p}22` }}>
            <Search size={18} color={C.t3} style={{ flexShrink:0, alignSelf:"center" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="What do you want to learn today?"
              style={{ flex:1, border:"none", outline:"none", fontSize:14, color:C.t1, padding:"12px 0", background:"transparent" }} />
            <button style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, color:C.w, border:"none", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Search</button>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:36 }}>
            <span style={{ fontSize:13, color:C.t3, fontWeight:500 }}>Trending:</span>
            {["React.js","Python","IELTS","Figma","Digital Marketing"].map(t => (
              <button key={t} onClick={() => setQuery(t)} style={{ background:C.w, border:`1px solid ${C.bd}`, color:C.t2, borderRadius:100, padding:"5px 13px", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.p; e.currentTarget.style.color = C.p; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bd; e.currentTarget.style.color = C.t2; }}
              >{t}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
            <Link to="/courses" style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, color:C.w, padding:"14px 28px", borderRadius:12, fontWeight:700, fontSize:15, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8, boxShadow:`0 8px 24px ${C.p}40` }}>
              <Play size={16} fill="#fff" color="#fff" /> Explore courses
            </Link>
            <Link to="/how-it-works" style={{ background:C.w, color:C.t1, padding:"14px 28px", borderRadius:12, fontWeight:700, fontSize:15, textDecoration:"none", border:`1.5px solid ${C.bd}`, display:"inline-flex", alignItems:"center", gap:8 }}>
              How it works <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display:"flex", gap:32, flexWrap:"wrap", paddingTop:24, borderTop:`1px solid ${C.bd}` }}>
            {[["50K+","Active students"],["500+","Courses"],["4.9★","Average rating"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize:24, fontWeight:900, color:C.t1, letterSpacing:"-0.5px", lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:12, color:C.t3, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — floating card */}
        <div style={{ position:"relative", width:300, height:390, flexShrink:0 }}>
          <div style={{ position:"absolute", inset:-20, borderRadius:"50%", background:`linear-gradient(145deg,${C.p},#4B5390)`, opacity:.11, pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:10, left:0, right:0, background:C.w, borderRadius:22, padding:20, boxShadow:`0 20px 64px ${C.p}28`, zIndex:2 }}>
            <div style={{ background:"linear-gradient(135deg,#232A54,#4B5390)", borderRadius:14, height:108, display:"flex", alignItems:"center", justifyContent:"center", fontSize:42, marginBottom:14 }}>⚛️</div>
            <Tag label="WEB DEVELOPMENT" color={C.p} />
            <p style={{ fontSize:13, fontWeight:700, color:C.t1, margin:"8px 0", lineHeight:1.4 }}>Complete React & Next.js Bootcamp</p>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:11 }}><Stars n={4.9} /><span style={{ fontSize:11, color:C.t3 }}>4.9 · 1,240 reviews</span></div>
            <div style={{ background:"#F3ECDE", borderRadius:100, height:6, marginBottom:5 }}>
              <div style={{ background:`linear-gradient(90deg,${C.p},${C.pMd})`, width:"72%", height:"100%", borderRadius:100 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.t3 }}><span>72% complete</span><span>৳1,200</span></div>
          </div>
          <div style={{ position:"absolute", bottom:72, left:-32, background:C.w, borderRadius:14, padding:"10px 14px", boxShadow:"0 8px 28px rgba(0,0,0,.12)", display:"flex", alignItems:"center", gap:10, zIndex:3 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:C.gLt, display:"flex", alignItems:"center", justifyContent:"center" }}><Users size={16} color={C.g} /></div>
            <div><div style={{ fontSize:14, fontWeight:800, color:C.t1 }}>8,500+</div><div style={{ fontSize:10, color:C.t3 }}>Students enrolled</div></div>
          </div>
          <div style={{ position:"absolute", bottom:4, right:-16, background:C.w, borderRadius:14, padding:"10px 14px", boxShadow:"0 8px 28px rgba(0,0,0,.12)", display:"flex", alignItems:"center", gap:10, zIndex:3 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:C.aLt, display:"flex", alignItems:"center", justifyContent:"center" }}><Award size={16} color={C.a} /></div>
            <div><div style={{ fontSize:13, fontWeight:800, color:C.t1 }}>Certificate</div><div style={{ fontSize:10, color:C.g, fontWeight:700 }}>✓ Verified</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { v:"50,000+", l:"Active students",    icon:Users,    c:C.p },
    { v:"500+",    l:"Quality courses",    icon:BookOpen, c:C.g },
    { v:"120+",    l:"Expert instructors", icon:Award,    c:C.a },
    { v:"4.9 / 5", l:"Average rating",     icon:Star,     c:"#C98A2C" },
  ];
  return (
    <div style={{ background:C.w, borderBottom:`1px solid ${C.bd}` }}>
      <div style={{ display:"flex", gap:24, flexWrap:"wrap", justifyContent:"space-around", maxWidth:1200, margin:"0 auto", padding:"28px clamp(20px,5vw,40px)" }}>
        {stats.map(s => (
          <div key={s.v} style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:15, background:s.c+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <s.icon size={24} color={s.c} />
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:C.t1, letterSpacing:"-0.5px", lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:13, color:C.t3, marginTop:3 }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WHY SECTION ───────────────────────────────────────────────────────────────
function WhySection() {
  return (
    <section style={{ background:C.w, padding:"88px clamp(20px,5vw,40px)" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:72, alignItems:"center", maxWidth:1200, margin:"0 auto" }}>
        <div>
          <SH eyebrow="Why EduBD" title={<>Everything you need<br />to grow your career</>} />
          <p style={{ color:C.t2, fontSize:15, lineHeight:1.78, margin:"0 0 28px" }}>
            EduBD is built specifically for Bangladesh — local payment methods, local content, and instructors who understand your goals.
          </p>
          {["Expert-vetted local instructors","Verifiable PDF certificates","Pay with bKash, Nagad, or card","Bengali & English course content","Lifetime access to all materials","Support in Bengali & English"].map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:C.gLt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Check size={13} color={C.g} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize:14, color:C.t1, fontWeight:500 }}>{f}</span>
            </div>
          ))}
          <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:28, background:`linear-gradient(135deg,${C.p},#4B5390)`, color:C.w, padding:"13px 28px", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none", boxShadow:`0 8px 20px ${C.p}35` }}>
            Start learning free <ChevronRight size={16} />
          </Link>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:C.bg, borderRadius:18, padding:"20px 17px", border:`1.5px solid ${C.bd}`, cursor:"pointer", transition:"all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = f.color+"0E"; e.currentTarget.style.borderColor = f.color+"50"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${f.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.bd; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ width:44, height:44, borderRadius:13, background:f.color+"18", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:13 }}>
                <f.icon size={21} color={f.color} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:5 }}>{f.title}</div>
              <div style={{ fontSize:12, color:C.t3, lineHeight:1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
function CategoriesSection() {
  return (
    <section style={{ background:C.bg, padding:"80px clamp(20px,5vw,40px)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36, flexWrap:"wrap", gap:16 }}>
          <SH eyebrow="Explore" title="Browse top categories" />
          <Link to="/courses" style={{ color:C.p, fontSize:14, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
            All categories <ChevronRight size={16} />
          </Link>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:14 }}>
          {CATS.map(c => (
            <div key={c.name} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"24px 18px", cursor:"pointer", transition:"all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${c.ic}25`; e.currentTarget.style.borderColor = c.ic+"60"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = C.bd; }}
            >
              <div style={{ width:52, height:52, borderRadius:14, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                <c.icon size={25} color={c.ic} />
              </div>
              <div style={{ fontWeight:700, fontSize:14, color:C.t1, marginBottom:5 }}>{c.name}</div>
              <div style={{ fontSize:12, color:C.t3 }}>{c.count} courses</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── COURSE CARD ───────────────────────────────────────────────────────────────
function CourseCard({ c }) {
  const disc = c.orig > 0 ? Math.round((1 - c.price / c.orig) * 100) : 0;
  return (
    <Link to={`/course/${c.slug}`} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:22, overflow:"hidden", cursor:"pointer", transition:"all .2s", textDecoration:"none", display:"block" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-7px)"; e.currentTarget.style.boxShadow = `0 22px 50px ${c.catC}20`; e.currentTarget.style.borderColor = c.catC+"40"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = C.bd; }}
    >
      <div style={{ background:c.thumb, height:154, display:"flex", alignItems:"center", justifyContent:"center", fontSize:46, position:"relative" }}>
        {c.emoji}
        <div style={{ position:"absolute", top:12, left:12 }}><Tag label={c.cat} color={c.catC} /></div>
        {disc > 0 && <div style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,.4)", backdropFilter:"blur(6px)", borderRadius:8, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#fff" }}>{disc}% OFF</div>}
      </div>
      <div style={{ padding:"17px 18px 20px" }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:C.t1, margin:"0 0 11px", lineHeight:1.42 }}>{c.title}</h3>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <Av initials={c.av} size={26} bg={c.catC} />
          <span style={{ fontSize:12, color:C.t2, fontWeight:500 }}>{c.instructor}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:11 }}>
          <Stars n={c.rating} />
          <span style={{ fontSize:12, fontWeight:700, color:"#7A5620" }}>{c.rating}</span>
          <span style={{ fontSize:12, color:C.t3 }}>({c.reviews.toLocaleString()})</span>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:15, fontSize:12, color:C.t3, flexWrap:"wrap" }}>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={11} /> {c.dur}</span>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><Users size={11} /> {c.students}</span>
          <span style={{ background:C.pLt, color:C.p, padding:"2px 8px", borderRadius:100, fontWeight:600, fontSize:11 }}>{c.level}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:13, borderTop:`1px solid ${C.bd}` }}>
          <div>
            <span style={{ fontSize:20, fontWeight:900, color:C.t1, letterSpacing:"-0.5px" }}>৳{c.price.toLocaleString()}</span>
            {c.orig > c.price && <span style={{ fontSize:12, color:C.t3, textDecoration:"line-through", marginLeft:8 }}>৳{c.orig.toLocaleString()}</span>}
          </div>
          {c.orig > c.price && <span style={{ fontSize:11, fontWeight:700, color:C.g, background:C.gLt, padding:"4px 10px", borderRadius:100 }}>Save ৳{(c.orig - c.price).toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── COURSES SECTION ───────────────────────────────────────────────────────────
function CoursesSection({ tab, setTab, courses = DEFAULT_COURSES }) {
  const tabs = ["All","Web Dev","Data","Design","Marketing","Finance","English"];
  const list = tab === "All" ? courses : courses.filter(c => c.cat === tab);
  return (
    <section style={{ background:C.w, padding:"80px clamp(20px,5vw,40px)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28, flexWrap:"wrap", gap:16 }}>
          <SH eyebrow="Popular" title="Top-rated courses" />
          <Link to="/courses" style={{ color:C.p, fontSize:14, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
            All courses <ChevronRight size={16} />
          </Link>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:30, flexWrap:"wrap" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"8px 18px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer", border:"1.5px solid", transition:"all .15s",
              background:  tab === t ? `linear-gradient(135deg,${C.p},#4B5390)` : "transparent",
              borderColor: tab === t ? "transparent" : C.bd,
              color:       tab === t ? C.w : C.t2,
              boxShadow:   tab === t ? `0 4px 14px ${C.p}35` : "none",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:22 }}>
          {list.map(c => <CourseCard key={c.id} c={c} />)}
        </div>
      </div>
    </section>
  );
}

// ── INSTRUCTORS ───────────────────────────────────────────────────────────────
function InstructorsSection({ instructors = DEFAULT_INSTRUCTORS }) {
  return (
    <section style={{ background:C.pLt, padding:"80px clamp(20px,5vw,40px)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36, flexWrap:"wrap", gap:16 }}>
          <SH eyebrow="Meet the experts" title="Learn from the best instructors" />
          <Link to="/instructors" style={{ color:C.p, fontSize:14, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
            All instructors <ChevronRight size={16} />
          </Link>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:20 }}>
          {instructors.map(ins => (
            <div key={ins.name} style={{ background:C.w, borderRadius:22, padding:"30px 22px", textAlign:"center", border:`1.5px solid ${C.bd}`, transition:"all .2s", cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 16px 42px ${ins.bg}22`; e.currentTarget.style.borderColor = ins.bg+"50"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = C.bd; }}
            >
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <div style={{ position:"relative" }}>
                  <div style={{ width:78, height:78, borderRadius:"50%", background:`linear-gradient(135deg,${ins.bg},${ins.bg}bb)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:"#fff" }}>{ins.av}</div>
                  <div style={{ position:"absolute", bottom:2, right:2, width:18, height:18, borderRadius:"50%", background:C.g, border:`2px solid ${C.w}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Check size={9} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:16, color:C.t1, marginBottom:4 }}>{ins.name}</div>
              <div style={{ fontSize:12, color:C.t3, marginBottom:12 }}>{ins.subject}</div>
              <div style={{ display:"flex", justifyContent:"center", gap:5, alignItems:"center", marginBottom:16 }}>
                <Stars n={ins.rating} /><span style={{ fontSize:12, fontWeight:700, color:"#7A5620" }}>{ins.rating}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"center", gap:22, paddingTop:16, borderTop:`1px solid ${C.bd}` }}>
                <div><div style={{ fontSize:16, fontWeight:900, color:C.t1 }}>{ins.students}</div><div style={{ fontSize:11, color:C.t3, marginTop:2 }}>Students</div></div>
                <div style={{ width:1, background:C.bd }} />
                <div><div style={{ fontSize:16, fontWeight:900, color:C.t1 }}>{ins.courses}</div><div style={{ fontSize:11, color:C.t3, marginTop:2 }}>Courses</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section style={{ background:C.w, padding:"80px clamp(20px,5vw,40px)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <SH eyebrow="Success stories" title="What our students say" center />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:22, marginTop:36 }}>
          {TESTIMONIALS.map(tm => (
            <div key={tm.name} style={{ background:C.bg, borderRadius:22, padding:"28px 24px", border:`1.5px solid ${C.bd}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${tm.c},${tm.c}aa)` }} />
              <div style={{ position:"absolute", top:14, right:18, fontSize:72, fontWeight:900, color:tm.c+"12", lineHeight:1, pointerEvents:"none" }}>"</div>
              <div style={{ display:"flex", gap:3, marginBottom:16 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#C98A2C" color="#C98A2C" />)}
              </div>
              <p style={{ fontSize:14, color:C.t2, lineHeight:1.8, margin:"0 0 22px", fontStyle:"italic", position:"relative" }}>"{tm.text}"</p>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${tm.c},${tm.c}bb)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff", flexShrink:0 }}>{tm.av}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:C.t1 }}>{tm.name}</div>
                  <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>{tm.role}</div>
                  <div style={{ fontSize:11, color:C.t3, marginTop:1 }}>📍 {tm.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ background:`linear-gradient(135deg,${C.pDk} 0%,${C.p} 45%,#4B5390 80%,#3D4578 100%)`, padding:"88px clamp(20px,5vw,40px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,.05)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-60, left:-50, width:240, height:240, borderRadius:"50%", background:`rgba(249,115,22,.08)`, pointerEvents:"none" }} />
      <div style={{ maxWidth:580, margin:"0 auto", position:"relative" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)", borderRadius:100, padding:"6px 16px", marginBottom:24 }}>
          <Zap size={14} color={C.y} fill={C.y} />
          <span style={{ fontSize:13, color:"rgba(255,255,255,.85)", fontWeight:600 }}>Start learning in minutes</span>
        </div>
        <h2 style={{ fontFamily:"'Fraunces',serif", color:C.w, fontSize:"clamp(28px,4.5vw,46px)", fontWeight:600, margin:"0 0 18px", letterSpacing:"-1px", lineHeight:1.1 }}>
          Ready to start your learning journey?
        </h2>
        <p style={{ color:"rgba(255,255,255,.6)", fontSize:16, margin:"0 0 36px", lineHeight:1.72 }}>
          Join 50,000+ students building new skills every day. Pay easily with bKash or Nagad — no international card required.
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:14, flexWrap:"wrap", marginBottom:28 }}>
          <Link to="/courses" style={{ background:C.w, color:C.p, padding:"15px 32px", borderRadius:13, fontWeight:800, fontSize:15, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8, boxShadow:"0 8px 24px rgba(0,0,0,.2)" }}>
            <Zap size={18} color={C.p} fill={C.p} /> Explore courses free
          </Link>
          <Link to="/courses" style={{ background:"rgba(255,255,255,.1)", color:C.w, border:"1.5px solid rgba(255,255,255,.25)", padding:"15px 32px", borderRadius:13, fontWeight:700, fontSize:15, textDecoration:"none" }}>
            Browse all courses
          </Link>
        </div>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Pay securely with:</span>
          {["bKash","Nagad","SSLCommerz","Visa / Mastercard"].map(p => (
            <span key={p} style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.14)", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.65)" }}>{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  const COLS = [
    { title:"Courses",  links:[["Web Development","/courses?cat=web"],["Data Science","/courses?cat=data"],["Graphic Design","/courses?cat=design"],["Digital Marketing","/courses?cat=marketing"],["English & IELTS","/courses?cat=english"],["Finance","/courses?cat=finance"]] },
    { title:"Company",  links:[["About EduBD","/about"],["Blog","/blog"],["Careers","/careers"],["Press","/press"],["Contact us","/contact"]] },
    { title:"Support",  links:[["Help centre","/help"],["Terms of service","/terms"],["Privacy policy","/privacy"],["Refund policy","/refund"],["Verify certificate","/verify"]] },
    { title:"Payment",  links:[["bKash","/pay/bkash"],["Nagad","/pay/nagad"],["SSLCommerz","/pay/ssl"],["Visa & Mastercard","/pay/card"],["Rocket","/pay/rocket"]] },
  ];
  const SOCIALS = [
    { href:"https://facebook.com/edubd",  label:"Facebook",  emoji:"📘" },
    { href:"https://youtube.com/edubd",   label:"YouTube",   emoji:"▶️" },
    { href:"https://instagram.com/edubd", label:"Instagram", emoji:"📸" },
    { href:"https://linkedin.com/company/edubd", label:"LinkedIn", emoji:"💼" },
  ];
  return (
    <footer style={{ background:"#1A2044", padding:"60px clamp(20px,4vw,40px) 0" }}>
      <div style={{ maxWidth:1280, margin:"0 auto" }}>

        {/* Newsletter strip */}
        <div style={{ background:"rgba(79,70,229,.15)", border:"1px solid rgba(79,70,229,.28)", borderRadius:16, padding:"24px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, marginBottom:52, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>📬 Get new courses in your inbox</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.45)" }}>Weekly updates on new courses, offers and learning tips.</div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <input placeholder="Your email address" style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"10px 16px", fontSize:13, color:"#fff", outline:"none", minWidth:220 }} />
            <button style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>Subscribe →</button>
          </div>
        </div>

        {/* 5-column grid */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:32, marginBottom:48 }}>
          {/* Brand */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <GraduationCap size={21} color="#fff" strokeWidth={2} />
              </div>
              <span style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontWeight:600, fontSize:22, letterSpacing:"-0.3px" }}>Edu<span style={{ color:"#D98577", fontStyle:"italic", fontWeight:500 }}>BD</span></span>
            </div>
            <p style={{ color:"rgba(255,255,255,.38)", fontSize:13, lineHeight:1.8, maxWidth:220, margin:"0 0 20px" }}>
              Bangladesh's leading online learning platform. 500+ courses, expert instructors, and verified certificates.
            </p>
            {/* Social icons */}
            <div style={{ display:"flex", gap:8, marginBottom:22 }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} title={s.label} target="_blank" rel="noopener noreferrer"
                  style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.09)", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:15, transition:"background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
                >{s.emoji}</a>
              ))}
            </div>
            {/* Payment badges */}
            <div style={{ fontSize:11, color:"rgba(255,255,255,.25)", marginBottom:8 }}>Accepted payments</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["bKash","Nagad","SSLCommerz","Visa"].map(p => (
                <span key={p} style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,.5)" }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.title}>
              <div style={{ color:"#fff", fontWeight:700, fontSize:12, marginBottom:16, textTransform:"uppercase", letterSpacing:".07em" }}>{col.title}</div>
              {col.links.map(([label, href]) => (
                <Link key={label} to={href} style={{ display:"block", color:"rgba(255,255,255,.38)", fontSize:13, lineHeight:2.4, textDecoration:"none", transition:"color .15s" }}
                  onMouseEnter={e => e.target.style.color = "rgba(255,255,255,.75)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.38)"}
                >{label}</Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", padding:"20px 0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <span style={{ color:"rgba(255,255,255,.22)", fontSize:13 }}>
            © 2025 EduBD. All rights reserved. Made with ❤️ in 🇧🇩 Bangladesh.
          </span>
          <span style={{ color:"rgba(255,255,255,.2)", fontSize:13 }}>
            Designed &amp; Developed by{" "}
            <a href="https://ahsan-jannat.netlify.app/" target="_blank" rel="noopener noreferrer"
              style={{ color:"rgba(129,140,248,.85)", fontWeight:600, textDecoration:"none", transition:"color .15s" }}
              onMouseEnter={e => e.target.style.color = "#B5BBE0"}
              onMouseLeave={e => e.target.style.color = "rgba(129,140,248,.85)"}
            >Ahsan Jannat</a>
          </span>
          <div style={{ display:"flex", gap:20 }}>
            {[["Terms","/terms"],["Privacy","/privacy"],["Cookies","/privacy"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color:"rgba(255,255,255,.22)", fontSize:13, textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e => e.target.style.color = "rgba(255,255,255,.55)"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.22)"}
              >{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const C = useThemeColors();
  usePageSeo({ fallbackTitle: "Home" });
  const [query, setQuery] = useState("");
  const [tab,   setTab]   = useState("All");
  const { data: cms }     = useSiteContent("hero");

  // ── Load featured courses + instructors from API ──────────────────────────
  const [featuredCourses,     setFeaturedCourses]     = useState([]);
  const [featuredInstructors, setFeaturedInstructors] = useState([]);

  useEffect(() => {
    api.get("/courses?per_page=6&sort=popular")
      .then(r => setFeaturedCourses(r?.data || []))
      .catch(() => {});
    api.get("/instructors?per_page=4")
      .then(r => setFeaturedInstructors(r?.data || []))
      .catch(() => {});
  }, []);

  // Map API data to shape used by sub-components (fall back to defaults)
  const COURSES = featuredCourses.length > 0
    ? featuredCourses.map(c => ({
        id: c.id, title: c.title, slug: c.slug,
        cat: c.category?.name || "General", catC: c.category?.color || "#28305E",
        instructor: c.instructor?.name || "", emoji: "📚",
        av: (c.instructor?.name || "IN").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        rating: c.rating || 0, reviews: c.total_reviews || 0,
        price: c.discount_price || c.price || 0, orig: c.price || 0,
        dur: c.duration || "", level: c.level || "All Levels",
        students: (c.total_students || 0) >= 1000
          ? ((c.total_students || 0) / 1000).toFixed(1) + "K"
          : String(c.total_students || 0),
        studentsN: c.total_students || 0,
        thumb: c.thumbnail ? `url(${c.thumbnail})` : "linear-gradient(135deg,#232A54,#4B5390)",
      }))
    : DEFAULT_COURSES;

  const INSTRUCTORS = featuredInstructors.length > 0
    ? featuredInstructors.map(i => ({
        id: i.id, name: i.name, subject: "Instructor",
        av: (i.name || "IN").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        students: (i.total_students || 0) >= 1000
          ? ((i.total_students || 0) / 1000).toFixed(1) + "K"
          : String(i.total_students || 0),
        rating: i.rating || 0, courses: i.courses_count || 0,
        bg: "#28305E",
      }))
    : DEFAULT_INSTRUCTORS;

  return (
    <div style={{ color:C.t1 }}>
      <Navbar />
      <Hero query={query} setQuery={setQuery} cms={cms} />
      <StatsBar />
      <WhySection />
      <CategoriesSection />
      <CoursesSection tab={tab} setTab={setTab} courses={COURSES} />
      <InstructorsSection instructors={INSTRUCTORS} />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
