import { useState, useEffect } from 'react';
import { GraduationCap, Users, BookOpen, Award, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import AuthNavActions from "@/components/AuthNavActions";
import { useSiteContent } from '@/lib/useSiteContent';
import { renderContentBlocks } from '@/lib/renderContentBlocks';
import { usePageSeo } from "@/lib/usePageSeo";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

const STATS = [
  { icon: Users,    label: "Students",    value: "45,000+" },
  { icon: BookOpen, label: "Courses",     value: "120+" },
  { icon: Award,    label: "Instructors", value: "35+" },
  { icon: MapPin,   label: "Districts reached", value: "64" },
];

export default function AboutPage() {
  const C = useThemeColors();
  usePageSeo({ fallbackTitle: "About Us" });
  const { data: cms } = useSiteContent('about');

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
          <Link to="/courses" style={{ color:C.t2, fontSize:14, fontWeight:500, padding:"7px 12px", borderRadius:8, textDecoration:"none" }}>Courses</Link>
          <DarkModeToggle size="sm" />
          <AuthNavActions />
        </div>
      </nav>

      <div style={{ background:`linear-gradient(135deg,${C.p},#4B5390)`, padding:"56px 24px 70px", textAlign:"center" }}>
        <h1 style={{ fontFamily:"'Fraunces',serif", color:"#fff", fontSize:"clamp(28px,4vw,38px)", fontWeight:600, margin:"0 0 12px", letterSpacing:"-0.5px" }}>
          Built in Bangladesh, for Bangladesh
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:16, maxWidth:600, margin:"0 auto" }}>
          We're on a mission to make world-class skills training accessible to every district in the country.
        </p>
      </div>

      <main style={{ maxWidth:840, margin:"0 auto", padding:"0 24px" }}>

        {/* Stats strip — overlaps hero */}
        <div style={{ marginTop:-32, marginBottom:48, background:C.w, borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:"28px 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:20, position:"relative", zIndex:2 }}>
          {STATS.map(({ icon:Icon, label, value }) => (
            <div key={label} style={{ textAlign:"center" }}>
              <Icon size={22} color={C.p} style={{ marginBottom:8 }} />
              <div style={{ fontSize:22, fontWeight:900, color:C.t1 }}>{value}</div>
              <div style={{ fontSize:12, color:C.t3, fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>

        <section style={{ marginBottom:40 }}>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:23, fontWeight:600, color:C.t1, marginBottom:14 }}>Our story</h2>
          {cms?.about_content ? renderContentBlocks(cms.about_content, { headingColor: C.t1, textColor: C.t2 }) : (
            <>
              <p style={{ fontSize:15, color:C.t2, lineHeight:1.8, marginBottom:14 }}>
                EduBD started with a simple observation: talented people across Bangladesh — from Dhaka to
                Rangpur, from Sylhet to Khulna — were being held back not by ability, but by access. The best
                courses were priced in dollars, taught in accents shaped for other markets, and built around
                assumptions that didn't always fit life here.
              </p>
              <p style={{ fontSize:15, color:C.t2, lineHeight:1.8, marginBottom:14 }}>
                So we built a platform from the ground up for Bangladeshi learners: courses priced in taka,
                payment through bKash and Nagad, instructors who've actually worked at companies hiring here,
                and a curriculum built around the skills local and remote employers are asking for right now.
              </p>
              <p style={{ fontSize:15, color:C.t2, lineHeight:1.8 }}>
                Since launch, tens of thousands of students have completed courses with us — many landing their
                first developer job, freelance client, or promotion within months of finishing.
              </p>
            </>
          )}
        </section>

        <section style={{ marginBottom:40 }}>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:23, fontWeight:600, color:C.t1, marginBottom:14 }}>What we believe</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
            {[
              ["🎯", "Outcomes over hours", "We measure success by jobs landed and skills used, not just videos watched."],
              ["🇧🇩", "Local first", "Built around Bangladeshi payment methods, pricing, and career paths from day one."],
              ["👥", "Real instructors", "Every instructor has shipped real work — not just taught theory."],
            ].map(([emoji, title, body]) => (
              <div key={title} style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:14, padding:20 }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{emoji}</div>
                <h3 style={{ fontSize:15, fontWeight:800, color:C.t1, margin:"0 0 6px" }}>{title}</h3>
                <p style={{ fontSize:13, color:C.t2, lineHeight:1.6, margin:0 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign:"center", padding:"36px 0 64px" }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.t1, marginBottom:10 }}>Want to learn more?</h2>
          <p style={{ fontSize:14, color:C.t2, marginBottom:20 }}>
            Read about our <Link to="/mission" style={{ color:C.p, fontWeight:700, textDecoration:"none" }}>mission</Link> or
            {" "}<Link to="/contact" style={{ color:C.p, fontWeight:700, textDecoration:"none" }}>get in touch</Link> with our team.
          </p>
          <Link to="/courses" style={{ display:"inline-block", padding:"13px 28px", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none" }}>
            Browse courses
          </Link>
        </section>
      </main>

      <footer style={{ background:C.t1, padding:"28px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>© {new Date().getFullYear()} EduBD. All rights reserved.</p>
      </footer>
    </div>
  );
}
