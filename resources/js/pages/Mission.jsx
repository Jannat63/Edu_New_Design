import { useState, useEffect } from 'react';
import { GraduationCap, Target, TrendingUp, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { useSiteContent } from '@/lib/useSiteContent';
import { usePageTitle } from "@/lib/usePageTitle";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

export default function MissionPage() {
  const C = useThemeColors();
  usePageTitle("Our Mission");
  const { data: cms } = useSiteContent('mission');

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

      <nav style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", color:C.t1, fontWeight:600, fontSize:21, letterSpacing:"-0.3px" }}>Edu<span style={{ color:C.a, fontStyle:"italic", fontWeight:500 }}>BD</span></span>
        </Link>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Link to="/about" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>About</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"64px 24px 80px", textAlign:"center" }}>
        <Target size={40} color="#fff" style={{ marginBottom:16, opacity:0.9 }} />
        <h1 style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontSize:"clamp(28px,4vw,38px)", fontWeight:600, margin:"0 0 14px", letterSpacing:"-0.5px" }}>
          Our mission
        </h1>
        <p style={{ color:"rgba(255,255,255,0.9)", fontSize:18, maxWidth:640, margin:"0 auto", lineHeight:1.6, fontWeight:600 }}>
          "Every capable person in Bangladesh should have a real path to a better career —
          regardless of which district they were born in."
        </p>
      </div>

      <main style={{ maxWidth:780, margin:"-32px auto 0", padding:"0 24px 64px", position:"relative", zIndex:2 }}>

        <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"32px 28px", boxShadow:"0 8px 24px rgba(0,0,0,0.08)", marginBottom:32 }}>
          <p style={{ fontSize:15, color:C.t2, lineHeight:1.8, margin:0 }}>
            {cms?.mission_content || `Bangladesh has one of the youngest, most digitally connected populations in the world. The
            talent is here. What's often missing is a clear, affordable, locally-relevant path from
            "interested" to "employable." That gap is what we exist to close.`}
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:18, marginBottom:40 }}>
          {[
            { icon:TrendingUp, title:"Skills that pay",   body:"We only build courses around skills that are actually being hired for, validated against real job postings in Bangladesh and remote markets." },
            { icon:Globe2,     title:"Reach every district", body:"Low-bandwidth video, mobile-first design, and bKash/Nagad payments so geography and banking access are never the barrier." },
            { icon:Target,     title:"Outcomes we track",  body:"We measure ourselves by job placements, freelance income growth, and promotions — not just course completions." },
          ].map(({ icon:Icon, title, body }) => (
            <div key={title} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:14, padding:22 }}>
              <Icon size={22} color={C.p} style={{ marginBottom:10 }} />
              <h3 style={{ fontSize:15, fontWeight:800, color:C.t1, margin:"0 0 8px" }}>{title}</h3>
              <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:0 }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:C.t1, marginBottom:10 }}>Be part of it</h2>
          <p style={{ fontSize:14, color:C.t2, marginBottom:20 }}>
            Whether you're here to learn or to teach, you're helping close the gap.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/courses" style={{ padding:"12px 24px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none" }}>
              Start learning
            </Link>
            <Link to="/become-instructor" style={{ padding:"12px 24px", background:C.w, border:`1.5px solid ${C.bd}`, color:C.t1, borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none" }}>
              Become an instructor
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
