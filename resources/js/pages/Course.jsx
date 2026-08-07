import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import AuthNavActions from "@/components/AuthNavActions";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";
import {
  Star, Users, Clock, Award, Check, ChevronRight, ChevronDown,
  Play, FileText, HelpCircle, Repeat, Smartphone, GraduationCap,
  Globe, Shield, Share2, BadgeCheck, PlayCircle, BookOpen, BarChart2,
  Heart, Tag, RefreshCw, CheckCircle2,
} from "lucide-react";

// ── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C",
  r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
  hero:"#1A2044",
};

// ── FALLBACK DATA (shown briefly while the real course loads, or if it fails to fetch specific fields) ──
const FALLBACK_LEARN = [
  "Build full-stack apps with real-world projects",
  "Master the core concepts step by step",
  "Hands-on exercises after every lesson",
  "Downloadable resources and source code",
];
const FALLBACK_REQUIREMENTS = [
  "No prior experience needed — we start from the basics",
  "A computer with an internet connection",
  "Willingness to learn and practice",
];
const INCLUDES = [
  { icon:PlayCircle, label:"On-demand video lessons" },
  { icon:FileText,   label:"Downloadable resources" },
  { icon:HelpCircle, label:"Graded quizzes" },
  { icon:Smartphone, label:"Access on mobile & desktop" },
  { icon:Repeat,     label:"Full lifetime access" },
  { icon:Award,      label:"Certificate of completion" },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
function Stars({ n, size=14 }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[...Array(5)].map((_,i)=>(<Star key={i} size={size} fill={i<Math.floor(n)?"#C98A2C":"none"} color={i<Math.floor(n)?"#C98A2C":"#8A8275"} />))}
    </span>
  );
}

// ── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const C = useThemeColors();
  return (
    <nav style={{ position:"sticky", top:0, zIndex:100, background:C.w, borderBottom:`1px solid ${C.bd}` }}>
      <div style={{ display:"flex", alignItems:"center", height:64, gap:28, maxWidth:1280, margin:"0 auto", padding:"0 clamp(20px,4vw,40px)" }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.t1, fontWeight:900, fontSize:20, letterSpacing:"-0.5px" }}>Edu<span style={{ color:C.p }}>BD</span></span>
        </Link>
        <div style={{ display:"flex", gap:2, flex:1 }}>
          {[["Home","/"],["Courses","/courses"],["Bundles","/bundles"],["Blog","/blog"],["About","/about"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 13px", borderRadius:8, textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </div>
    </nav>
  );
}

// ── ENROLL CARD ───────────────────────────────────────────────────────────────
function EnrollCard({ course, isEnrolled, enrolling, onEnroll, wishlisted, onWishlist,
  couponCode, setCouponCode, couponData, couponErr, couponLoading, onApplyCoupon }) {

  const finalPrice = couponData?.final_price ?? course.price;
  const disc = course.orig > 0 ? Math.round((1 - course.price / course.orig) * 100) : 0;

  return (
    <div style={{ background:C.w, borderRadius:20, border:`1.5px solid ${C.bd}`, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.12)" }}>
      {/* Thumbnail */}
      <div style={{ background:course.thumbImg ? `url(${course.thumbImg}) center/cover` : course.thumb, height:170, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, position:"relative", cursor:"pointer" }}>
        {!course.thumbImg && course.emoji}
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,.9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Play size={22} color={C.p} fill={C.p} />
          </div>
        </div>
        <button onClick={onWishlist} title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{ position:"absolute", top:10, right:10, width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.9)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Heart size={16} color={wishlisted ? C.r : C.t3} fill={wishlisted ? C.r : "none"} />
        </button>
      </div>

      <div style={{ padding:"20px 20px 24px" }}>
        {/* Price */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
          <span style={{ fontSize:28, fontWeight:900, color:C.t1, letterSpacing:"-1px" }}>৳{finalPrice.toLocaleString()}</span>
          {course.orig > course.price && <span style={{ fontSize:16, color:C.t3, textDecoration:"line-through" }}>৳{course.orig.toLocaleString()}</span>}
          {disc > 0 && <span style={{ background:"#F5E9D4", color:"#7A5620", fontSize:12, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>{disc}% OFF</span>}
        </div>
        {couponData && (
          <p style={{ fontSize:12, color:C.g, fontWeight:700, margin:"4px 0 12px" }}>✅ Coupon "{couponData.code}" applied — you save ৳{couponData.discount_amount}</p>
        )}

        {/* Enroll CTA */}
        {isEnrolled ? (
          <Link to={`/learn/${course.slug}`} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", boxSizing:"border-box", background:`linear-gradient(135deg,${C.g},#4C8862)`, color:"#fff", border:"none", borderRadius:13, padding:"14px", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:14, textDecoration:"none" }}>
            <CheckCircle2 size={18} /> Continue Learning
          </Link>
        ) : (
          <button onClick={onEnroll} disabled={enrolling}
            style={{ width:"100%", background: enrolling ? "#D9D0C0" : `linear-gradient(135deg,${C.a},#D9A13F)`, color:C.w, border:"none", borderRadius:13, padding:"14px", fontSize:16, fontWeight:800, cursor: enrolling ? "not-allowed" : "pointer", marginBottom:14, boxShadow: enrolling ? "none" : `0 6px 20px ${C.a}40`, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {enrolling ? <><RefreshCw size={16} style={{ animation:"spin .6s linear infinite" }}/> Processing…</> : <>Enroll Now →</>}
          </button>
        )}

        {/* Coupon */}
        {!isEnrolled && (
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:7, border:`1.5px solid ${C.bd}`, borderRadius:10, padding:"9px 12px" }}>
                <Tag size={14} color={C.t3} />
                <input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code"
                  style={{ border:"none", outline:"none", fontSize:13, flex:1, color:C.t1 }}/>
              </div>
              <button onClick={onApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                style={{ padding:"9px 16px", borderRadius:10, border:`1.5px solid ${C.p}`, background:C.pLt, color:C.p, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {couponLoading ? "…" : "Apply"}
              </button>
            </div>
            {couponErr && <p style={{ fontSize:12, color:C.r, margin:"6px 0 0" }}>{couponErr}</p>}
          </div>
        )}

        {/* Includes */}
        <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:12 }}>This course includes:</div>
        <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:18 }}>
          {INCLUDES.map(({icon:Icon, label})=>(
            <div key={label} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:C.t2 }}>
              <Icon size={15} color={C.p} />
              {label}
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div style={{ display:"flex", alignItems:"center", gap:9, background:C.gLt, borderRadius:10, padding:"11px 14px" }}>
          <Shield size={18} color={C.g} />
          <span style={{ fontSize:12, color:"#22432E", fontWeight:600 }}>30-day money-back guarantee</span>
        </div>

        {/* Share */}
        <div style={{ display:"flex", justifyContent:"center", marginTop:14 }}>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}
            style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.t3, fontSize:12, cursor:"pointer", fontWeight:500 }}>
            <Share2 size={13} /> Share this course
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function CourseHero({ course, enrollProps }) {
  return (
    <div style={{ background:`linear-gradient(155deg,${C.hero} 0%,#28305E 100%)`, padding:"48px clamp(20px,4vw,40px) 56px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, right:0, width:400, height:400, borderRadius:"50%", background:C.p, opacity:.06, transform:"translate(100px,-100px)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1280, margin:"0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, marginBottom:20 }}>
          {[["Home","/"],["Courses","/courses"],[course.category || "Course",null]].map(([b,to],i,arr)=>(
            <span key={b} style={{ display:"flex", alignItems:"center", gap:6 }}>
              {to ? (
                <Link to={to} style={{ color:"rgba(255,255,255,.5)", textDecoration:"none" }}>{b}</Link>
              ) : (
                <span style={{ color:"rgba(255,255,255,.5)" }}>{b}</span>
              )}
              {i < arr.length-1 && <ChevronRight size={13} color="rgba(255,255,255,.3)" />}
            </span>
          ))}
        </div>

        <div style={{ display:"flex", gap:48, alignItems:"flex-start", flexWrap:"wrap" }}>
          {/* LEFT — course info */}
          <div style={{ flex:"1 1 500px", minWidth:280 }}>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {course.category && <span style={{ background:C.p+"44", color:"#9098C4", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:100 }}>{course.category}</span>}
              <span style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:100 }}>{course.level}</span>
            </div>

            <h1 style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontSize:"clamp(24px,3.5vw,38px)", fontWeight:600, lineHeight:1.22, margin:"0 0 16px", letterSpacing:"-0.5px" }}>
              {course.title}
            </h1>
            {course.subtitle && (
              <p style={{ color:"rgba(255,255,255,.65)", fontSize:16, lineHeight:1.7, margin:"0 0 24px", maxWidth:620 }}>
                {course.subtitle}
              </p>
            )}

            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:20 }}>
              {course.rating > 0 && (
                <>
                  <span style={{ fontSize:15, fontWeight:800, color:C.y }}>{course.rating}</span>
                  <Stars n={course.rating} size={14} />
                </>
              )}
              <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>({course.reviews.toLocaleString()} ratings)</span>
              <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>·</span>
              <span style={{ fontSize:13, color:"rgba(255,255,255,.6)", display:"flex", alignItems:"center", gap:4 }}><Users size={13} /> {course.students} students</span>
            </div>

            {course.instructor.name && (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                {course.instructor.avatar
                  ? <img src={course.instructor.avatar} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} alt=""/>
                  : <div style={{ width:36, height:36, borderRadius:"50%", background:course.instructor.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff" }}>
                      {course.instructor.av}
                    </div>
                }
                <div>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>Created by </span>
                  <Link to="/instructors" style={{ color:"#9098C4", fontSize:13, fontWeight:600, textDecoration:"none" }}>{course.instructor.name}</Link>
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {[
                { icon:Globe,  label:`Language: ${course.lang}` },
                course.updated && { icon:Clock,  label:`Last updated: ${course.updated}` },
                { icon:BadgeCheck, label:"Certificate included" },
              ].filter(Boolean).map(({ icon:Icon, label })=>(
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"rgba(255,255,255,.55)" }}>
                  <Icon size={14} color="rgba(255,255,255,.4)" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — enroll card (desktop) */}
          <div style={{ flexShrink:0, width:320 }}>
            <EnrollCard course={course} {...enrollProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SECTION HEADING ───────────────────────────────────────────────────────────
function SH({ children }) {
  return <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:21, fontWeight:600, color:C.t1, margin:"0 0 20px", letterSpacing:"-0.3px" }}>{children}</h2>;
}

// ── WHAT YOU'LL LEARN ─────────────────────────────────────────────────────────
function WhatYouLearn({ learn }) {
  if (!learn.length) return null;
  return (
    <div style={{ background:C.pLt, border:`1.5px solid #B5BBE0`, borderRadius:18, padding:"28px 28px 26px", marginBottom:28 }}>
      <SH>What you'll learn</SH>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"10px 24px" }}>
        {learn.map(l=>(
          <div key={l} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:20, height:20, borderRadius:"50%", background:C.p+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
              <Check size={12} color={C.p} strokeWidth={3} />
            </div>
            <span style={{ fontSize:14, color:C.t2, lineHeight:1.5 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REQUIREMENTS ─────────────────────────────────────────────────────────────
function Requirements({ requirements }) {
  if (!requirements.length) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <SH>Requirements</SH>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {requirements.map(r=>(
          <div key={r} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.t2, flexShrink:0, marginTop:7 }} />
            <span style={{ fontSize:14, color:C.t2, lineHeight:1.6 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CURRICULUM ────────────────────────────────────────────────────────────────
function LessonTypeIcon({ type }) {
  if (type==="video")      return <Play size={13} color={C.p} fill={C.p} />;
  if (type==="quiz")       return <HelpCircle size={13} color={C.a} />;
  if (type==="resource")   return <FileText size={13} color={C.g} />;
  if (type==="assignment") return <FileText size={13} color={C.y} />;
  return <BookOpen size={13} color={C.t3} />;
}

function CourseCurriculum({ curriculum, courseDuration }) {
  const [openSecs, setOpenSecs] = useState(new Set([0]));
  const [allOpen,  setAllOpen]  = useState(false);

  const toggleSec = i => setOpenSecs(prev => { const n = new Set(prev); n.has(i)?n.delete(i):n.add(i); return n; });
  const toggleAll = () => {
    if (allOpen) { setOpenSecs(new Set()); setAllOpen(false); }
    else          { setOpenSecs(new Set(curriculum.map((_,i)=>i))); setAllOpen(true); }
  };

  const totalLessons = curriculum.reduce((a,s)=>a+s.lessons.length, 0);

  if (curriculum.length === 0) {
    return (
      <div style={{ marginBottom:28 }}>
        <SH>Course curriculum</SH>
        <p style={{ fontSize:14, color:C.t3 }}>Curriculum will be published soon.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <SH>Course curriculum</SH>
        <button onClick={toggleAll} style={{ fontSize:13, color:C.p, fontWeight:600, background:"none", border:"none", cursor:"pointer", padding:0 }}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <p style={{ fontSize:13, color:C.t3, marginBottom:16 }}>
        <strong style={{ color:C.t2 }}>{curriculum.length} sections</strong> · <strong style={{ color:C.t2 }}>{totalLessons} lessons</strong>
        {courseDuration && <> · <strong style={{ color:C.t2 }}>{courseDuration}</strong> total length</>}
      </p>

      <div style={{ border:`1.5px solid ${C.bd}`, borderRadius:16, overflow:"hidden" }}>
        {curriculum.map((sec,i)=>(
          <div key={i} style={{ borderBottom: i<curriculum.length-1 ? `1px solid ${C.bd}` : "none" }}>
            <button onClick={()=>toggleSec(i)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"16px 20px", background: openSecs.has(i) ? C.bg : C.w, border:"none", cursor:"pointer", textAlign:"left", transition:"background .15s" }}>
              <ChevronDown size={16} color={C.t3} style={{ flexShrink:0, transform:openSecs.has(i)?"":"rotate(-90deg)", transition:"transform .2s" }} />
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:C.t1 }}>{sec.title}</span>
              <span style={{ fontSize:12, color:C.t3, whiteSpace:"nowrap" }}>{sec.lessons.length} lessons</span>
            </button>

            {openSecs.has(i) && (
              <div style={{ background:C.w }}>
                {sec.lessons.map((les,j)=>(
                  <div key={j} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 20px 11px 52px", borderTop:`1px solid ${C.bg}`, transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background=C.w}
                  >
                    <LessonTypeIcon type={les.type} />
                    <span style={{ flex:1, fontSize:13, color:C.t2 }}>{les.t}</span>
                    {les.free && <span style={{ fontSize:11, fontWeight:700, color:C.g, background:C.gLt, padding:"2px 8px", borderRadius:100 }}>Free preview</span>}
                    <span style={{ fontSize:12, color:C.t3, whiteSpace:"nowrap" }}>
                      {les.dur || (les.type === "quiz" ? "Quiz" : les.type === "assignment" ? "Assignment" : "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── INSTRUCTOR ────────────────────────────────────────────────────────────────
function InstructorSection({ instructor }) {
  if (!instructor.name) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <SH>About the instructor</SH>
      <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div style={{ flexShrink:0 }}>
          {instructor.avatar
            ? <img src={instructor.avatar} style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover" }} alt=""/>
            : <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${instructor.color},${instructor.color}bb)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:"#fff", boxShadow:`0 8px 24px ${instructor.color}40` }}>
                {instructor.av}
              </div>
          }
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <Link to="/instructors" style={{ fontSize:17, fontWeight:800, color:C.p, textDecoration:"none", display:"block", marginBottom:3 }}>{instructor.name}</Link>
          <p style={{ fontSize:13, color:C.t3, margin:"0 0 14px" }}>{instructor.title}</p>
          {instructor.bio && <p style={{ fontSize:14, color:C.t2, lineHeight:1.75, margin:"0 0 12px" }}>{instructor.bio}</p>}
          <Link to="/instructors" style={{ fontSize:13, color:C.p, fontWeight:600, textDecoration:"none" }}>View full instructor profile →</Link>
        </div>
      </div>
    </div>
  );
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
function ReviewsSection({ course, reviews, breakdown, isEnrolled, currentUserId, onReviewSubmitted }) {
  const [myRating, setMyRating]   = useState(0);
  const [myBody,   setMyBody]     = useState("");
  const [hoverStar, setHoverStar] = useState(0);
  const [saving,   setSaving]     = useState(false);
  const [showForm, setShowForm]   = useState(false);

  const myExistingReview = reviews.find(r => r.user?.id === currentUserId);

  // Fall back to a client-computed breakdown only if the API didn't provide one
  const stars = breakdown
    ? [5,4,3,2,1].map(s => ({ stars:s, pct: breakdown[s]?.pct || 0 }))
    : [5,4,3,2,1].map(s => {
        const count = reviews.filter(r => Math.round(r.rating) === s).length;
        return { stars:s, pct: reviews.length ? Math.round((count/reviews.length)*100) : 0 };
      });

  const handleSubmitReview = async () => {
    if (!myRating) { toast.error("Please select a star rating."); return; }
    setSaving(true);
    try {
      const method = myExistingReview ? 'put' : 'post';
      const r = await api[method](`/courses/${course.slug}/review`, { rating: myRating, body: myBody || null });
      toast.success(r.message || "Review submitted!");
      setShowForm(false);
      onReviewSubmitted?.();
    } catch(e) { toast.error(e.message || "Failed to submit review."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ marginBottom:28 }}>
      <SH>Student reviews</SH>

      {reviews.length > 0 && (
        <div style={{ display:"flex", gap:32, alignItems:"center", background:C.pLt, borderRadius:18, padding:"24px 28px", marginBottom:28, flexWrap:"wrap" }}>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <div style={{ fontSize:56, fontWeight:900, color:C.p, lineHeight:1, letterSpacing:"-2px" }}>{course.rating}</div>
            <Stars n={course.rating} size={18} />
            <p style={{ fontSize:12, color:C.t3, margin:"6px 0 0" }}>Course rating</p>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            {stars.map(({stars:s,pct})=>(
              <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
                <div style={{ flex:1, background:"#E8E9F1", borderRadius:100, height:9, overflow:"hidden" }}>
                  <div style={{ background:`linear-gradient(90deg,${C.y},${C.a})`, width:`${pct}%`, height:"100%", borderRadius:100 }} />
                </div>
                <span style={{ fontSize:12, color:C.t2, fontWeight:600, width:18, textAlign:"right" }}>{s}★</span>
                <span style={{ fontSize:12, color:C.t3, width:30 }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <p style={{ fontSize:14, color:C.t3, marginBottom:20 }}>No reviews yet — be the first to leave one!</p>
      )}

      {/* Leave / edit a review — only for enrolled students */}
      {isEnrolled && (
        <div style={{ marginBottom:24 }}>
          {!showForm ? (
            <button onClick={() => { setShowForm(true); if (myExistingReview) { setMyRating(myExistingReview.rating); setMyBody(myExistingReview.body||""); } }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:11, border:`1.5px solid ${C.p}`, background:C.pLt, color:C.p, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              <Star size={15}/> {myExistingReview ? "Edit your review" : "Leave a review"}
            </button>
          ) : (
            <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"22px" }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.t1, marginBottom:14 }}>
                {myExistingReview ? "Update your review" : "Rate this course"}
              </div>
              <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setMyRating(s)}
                    onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
                    <Star size={28} fill={s <= (hoverStar||myRating) ? "#C98A2C" : "none"} color={s <= (hoverStar||myRating) ? "#C98A2C" : "#D9D0C0"} />
                  </button>
                ))}
              </div>
              <textarea value={myBody} onChange={e=>setMyBody(e.target.value)} rows={3}
                placeholder="Share your experience with this course (optional)…"
                style={{ width:"100%", boxSizing:"border-box", padding:"11px 13px", border:`1.5px solid ${C.bd}`, borderRadius:10, fontSize:13, color:C.t1, outline:"none", resize:"vertical", fontFamily:"inherit", marginBottom:14 }}/>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setShowForm(false)} style={{ padding:"9px 18px", borderRadius:10, border:`1.5px solid ${C.bd}`, background:C.w, color:C.t2, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button onClick={handleSubmitReview} disabled={saving}
                  style={{ padding:"9px 20px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:13, fontWeight:700, cursor:saving?"wait":"pointer", opacity:saving?.7:1 }}>
                  {saving ? "Saving…" : "Submit Review"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {reviews.map(r=>(
          <div key={r.id} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"22px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              {r.user?.avatar
                ? <img src={r.user.avatar} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt=""/>
                : <div style={{ width:42, height:42, borderRadius:"50%", background:C.p, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff", flexShrink:0 }}>
                    {(r.user?.name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
              }
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:C.t1 }}>{r.user?.name || "Student"}</div>
                <div style={{ fontSize:12, color:C.t3 }}>{r.created_at}</div>
              </div>
              <div style={{ marginLeft:"auto" }}><Stars n={r.rating} size={13} /></div>
            </div>
            {r.body && <p style={{ fontSize:14, color:C.t2, lineHeight:1.75, margin:0 }}>{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:"#1A2044", padding:"40px clamp(20px,4vw,40px) 24px", marginTop:40 }}>
      <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={18} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color:C.w, fontWeight:900, fontSize:18 }}>Edu<span style={{ color:C.pMd }}>BD</span></span>
        </div>
        <span style={{ color:"rgba(255,255,255,.25)", fontSize:13 }}>© 2025 EduBD · Bangladesh's #1 Learning Platform</span>
        <div style={{ display:"flex", gap:20 }}>
          {[["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:"rgba(255,255,255,.3)", fontSize:13, textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const C = useThemeColors();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course,     setCourse]     = useState(null);
  const [sections,   setSections]   = useState([]);
  const [reviews,    setReviews]    = useState([]);
  const [reviewBreakdown, setReviewBreakdown] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [enrolling,  setEnrolling]  = useState(false);
  const [error,      setError]      = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponErr,  setCouponErr]  = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [initiatingGateway, setInitiatingGateway] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/courses/${slug}`),
      api.get(`/courses/${slug}/lessons`).catch(() => ({ sections: [] })),
      api.get(`/courses/${slug}/reviews`).catch(() => null),
    ]).then(([c, curr, revs]) => {
      setCourse(c);
      setSections(curr.sections || []);
      setIsEnrolled(curr.is_enrolled || false);
      // The reviews endpoint returns { average_rating, total_reviews, breakdown, reviews: { data: [...] } }
      // — a paginated list nested under 'reviews', not a bare array.
      setReviews(revs?.reviews?.data || []);
      setReviewBreakdown(revs?.breakdown || null);
    }).catch(() => setError('Course not found.'))
    .finally(() => setLoading(false));
  }, [slug]);

  // Check wishlist status separately once we know who's logged in (avoids racing the main load)
  useEffect(() => {
    if (!user || !slug) return;
    api.get(`/wishlist/courses/${slug}/check`)
      .then(r => setWishlisted(r?.wishlisted || false))
      .catch(() => {});
  }, [user, slug]);

  const reloadReviews = () => {
    api.get(`/courses/${slug}/reviews`)
      .then(revs => {
        setReviews(revs?.reviews?.data || []);
        setReviewBreakdown(revs?.breakdown || null);
      })
      .catch(() => {});
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const r = await api.post(`/wishlist/courses/${course?.id}`, {});
      setWishlisted(r?.wishlisted);
      toast.success(r?.message || "Updated wishlist.");
    } catch(e) { toast.error(e.message || "Failed."); }
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponErr("");
    try {
      // Use the effective price (discount_price if set, else price) — this
      // must match what PaymentController::initiateCourse() actually
      // charges. Sending course.price (the full list price) here would show
      // a coupon preview that disagrees with the real checkout amount for
      // any course that already has an active discount_price.
      const effectivePrice = course?.discount_price || course?.price;
      const r = await api.post('/coupons/apply', { code: couponCode, course_id: course?.id, price: effectivePrice });
      setCouponData(r);
      toast.success(r.message);
    } catch(e) { setCouponErr(e.message || "Invalid coupon."); setCouponData(null); }
    finally { setCouponLoading(false); }
  };

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setEnrolling(true);
    try {
      const payload = couponData?.code ? { coupon_code: couponData.code } : {};
      const r = await api.post(`/courses/${slug}/enroll`, payload);
      // Free course, or already enrolled — no payment needed.
      setIsEnrolled(true);
      toast.success(r.message || 'Enrolled! Redirecting to your course...');
      setTimeout(() => navigate(`/learn/${slug}`), 1200);
    } catch(e) {
      // 402 = this course requires payment — show the payment method picker
      // instead of just displaying an error with no way forward.
      if (e.status === 402) {
        setShowPaymentModal(true);
      } else {
        toast.error(e.message || 'Enrollment failed.');
      }
    } finally { setEnrolling(false); }
  };

  const handleSelectGateway = async (gateway) => {
    setInitiatingGateway(gateway);
    try {
      const r = await api.post('/payments/initiate', {
        course_id: COURSE.id,
        gateway,
        ...(couponData?.code ? { coupon_code: couponData.code } : {}),
      });
      if (r.free) {
        // Coupon brought the price to zero — already enrolled by the backend.
        toast.success(r.message || 'Enrolled for free!');
        setShowPaymentModal(false);
        setIsEnrolled(true);
        setTimeout(() => navigate(`/learn/${slug}`), 1000);
        return;
      }
      if (r.redirect_url) {
        window.location.href = r.redirect_url;
        return;
      }
      toast.error('Could not start payment. Please try again.');
    } catch(e) {
      toast.error(e.message || 'Could not start payment.');
    } finally {
      setInitiatingGateway(null);
    }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FBF6EE' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #E8E9F1', borderTopColor:'#28305E', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error || !course) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>😕</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:'#1A2044' }}>Course not found</h2>
      <Link to="/courses" style={{ color:'#28305E', fontWeight:600 }}>Browse all courses</Link>
    </div>
  );

  // ── Single source of truth: map the raw API response into the shape every sub-component expects ──
  const COURSE = {
    id:          course.id,
    title:       course.title        || '',
    subtitle:    course.subtitle     || '',
    slug:        course.slug         || slug,
    category:    course.category?.name || '',
    level:       course.level        || 'All Levels',
    lang:        course.language     || 'Bengali & English',
    updated:     '', // not returned by the API — omit rather than show blank/wrong date
    rating:      course.rating         || 0,
    reviews:     course.total_reviews  || 0,
    studentsN:   course.total_students || 0,
    students:    (course.total_students || 0).toLocaleString(),
    price:       course.discount_price || course.price || 0,
    orig:        course.discount_price ? course.price : 0, // only show strike-through price when an actual discount exists
    dur:         course.total_duration_minutes ? `${Math.round(course.total_duration_minutes/60)}h` : '',
    lessons:     sections.reduce((a, s) => a + (s.lessons?.length || 0), 0),
    sections:    sections.length,
    thumb:       `linear-gradient(135deg,#232A54,#4B5390)`,
    thumbImg:    course.thumbnail      || null,
    emoji:       '📚',
    instructor: {
      name:     course.instructor?.name || '',
      title:    'Instructor', // API doesn't return a specific title — use a sensible default
      av:       (course.instructor?.name || 'IN').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(),
      color:    C.p,
      // The course show() endpoint doesn't include instructor-wide stats (those
      // live on /instructors/{id}) — default to 0 rather than inventing numbers.
      rating:   0,
      reviews:  0,
      students: 0,
      courses:  0,
      bio:      course.instructor?.bio    || '',
      avatar:   course.instructor?.avatar || null,
    },
  };

  const LEARN        = course.what_you_learn || FALLBACK_LEARN;
  const REQUIREMENTS = course.requirements   || FALLBACK_REQUIREMENTS;
  const CURRICULUM   = sections.map(s => ({
    title:   s.title,
    lessons: (s.lessons || []).map(l => ({
      t:    l.title,
      type: l.type,
      dur:  l.duration || '',
      free: l.is_preview,
    })),
  }));

  const enrollProps = {
    isEnrolled, enrolling, onEnroll: handleEnroll,
    wishlisted, onWishlist: handleWishlist,
    couponCode, setCouponCode, couponData, couponErr, couponLoading, onApplyCoupon: handleCoupon,
  };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color:C.t1, background:C.bg, minHeight:"100vh" }}>
      <Navbar />
      <CourseHero course={COURSE} enrollProps={enrollProps} />

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px clamp(20px,4vw,40px)", display:"flex", gap:40, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 500px", minWidth:280 }}>
          <WhatYouLearn learn={LEARN} />
          <Requirements requirements={REQUIREMENTS} />
          <CourseCurriculum curriculum={CURRICULUM} courseDuration={COURSE.dur} />
          <InstructorSection instructor={COURSE.instructor} />
          <ReviewsSection course={COURSE} reviews={reviews} breakdown={reviewBreakdown} isEnrolled={isEnrolled} currentUserId={user?.id} onReviewSubmitted={reloadReviews} />
        </div>

        <div style={{ width:320, flexShrink:0 }}>
          <div style={{ position:"sticky", top:80 }}>
            <EnrollCard course={COURSE} {...enrollProps} />
            <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"18px 20px", marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:13 }}>Course overview</div>
              {[
                COURSE.dur && { icon:Clock,    label:`${COURSE.dur} of content` },
                { icon:BookOpen, label:`${COURSE.lessons} lessons` },
                { icon:BarChart2,label:COURSE.level },
                { icon:Globe,    label:COURSE.lang },
              ].filter(Boolean).map(({ icon:Icon, label })=>(
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, fontSize:13, color:C.t2 }}>
                  <Icon size={15} color={C.t3} /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showPaymentModal && (
        <PaymentMethodModal
          amount={couponData?.final_price ?? COURSE.price}
          onClose={() => setShowPaymentModal(false)}
          onSelect={handleSelectGateway}
          loadingGateway={initiatingGateway}
        />
      )}
    </div>
  );
}
