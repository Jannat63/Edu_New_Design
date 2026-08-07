import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";
import {
  HelpCircle, CheckCircle2, XCircle, Clock, GraduationCap,
  ChevronLeft, ChevronRight, Award, RefreshCw, AlertCircle,
} from "lucide-react";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1", pMd:"#565E96",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  y:"#C98A2C", yLt:"#F5E9D4",
  r:"#B23A2E", rLt:"#F7E3DF",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Navbar() {
  const C = useThemeColors();
  return (
    <div style={{ background:C.w, borderBottom:`1px solid ${C.bd}`, height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px" }}>
      <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
        <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.p},#4B5390)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <GraduationCap size={17} color="#fff" />
        </div>
        <span style={{ color:C.t1, fontWeight:900, fontSize:18 }}>Edu<span style={{ color:C.p }}>BD</span></span>
      </Link>
      <DarkModeToggle size="sm" />
    </div>
  );
}

function QuestionCard({ question, index, total, selected, onSelect }) {
  return (
    <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:"28px 28px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.p, background:C.pLt, padding:"4px 12px", borderRadius:100 }}>
          Question {index + 1} of {total}
        </span>
        <span style={{ fontSize:12, color:C.t3 }}>{question.points} point{question.points !== 1 ? "s" : ""}</span>
      </div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.t1, lineHeight:1.5, margin:"0 0 24px" }}>{question.text}</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {question.options.map(opt => {
          const isSelected = selected === opt.id;
          return (
            <button key={opt.id} onClick={() => onSelect(question.id, opt.id)}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderRadius:12,
                border:`1.5px solid ${isSelected ? C.p : C.bd}`, background: isSelected ? C.pLt : C.w,
                cursor:"pointer", textAlign:"left", fontSize:14, color:C.t1, transition:"all .15s",
              }}
            >
              <div style={{
                width:20, height:20, borderRadius:"50%", border:`2px solid ${isSelected ? C.p : C.bd}`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                {isSelected && <div style={{ width:10, height:10, borderRadius:"50%", background:C.p }} />}
              </div>
              <span style={{ fontWeight: isSelected ? 700 : 500 }}>{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultScreen({ result, onRetry, courseSlug }) {
  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"48px 20px" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{
          width:88, height:88, borderRadius:"50%", margin:"0 auto 20px",
          background: result.passed ? C.gLt : C.rLt,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {result.passed
            ? <CheckCircle2 size={42} color={C.g} />
            : <XCircle size={42} color={C.r} />}
        </div>
        <h1 style={{ fontSize:26, fontWeight:900, color:C.t1, margin:"0 0 8px" }}>
          {result.passed ? "You passed! 🎉" : "Not quite there"}
        </h1>
        <p style={{ fontSize:15, color:C.t2, margin:0 }}>{result.message}</p>
      </div>

      <div style={{ display:"flex", gap:14, marginBottom:28 }}>
        <div style={{ flex:1, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"20px", textAlign:"center" }}>
          <div style={{ fontSize:32, fontWeight:900, color: result.passed ? C.g : C.r, letterSpacing:"-1px" }}>{result.score_percentage}%</div>
          <div style={{ fontSize:12, color:C.t3, marginTop:4 }}>Your Score</div>
        </div>
        <div style={{ flex:1, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"20px", textAlign:"center" }}>
          <div style={{ fontSize:32, fontWeight:900, color:C.t1, letterSpacing:"-1px" }}>{result.pass_percentage}%</div>
          <div style={{ fontSize:12, color:C.t3, marginTop:4 }}>Required to Pass</div>
        </div>
        <div style={{ flex:1, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:16, padding:"20px", textAlign:"center" }}>
          <div style={{ fontSize:32, fontWeight:900, color:C.t1, letterSpacing:"-1px" }}>{result.score_points}/{result.total_points}</div>
          <div style={{ fontSize:12, color:C.t3, marginTop:4 }}>Points</div>
        </div>
      </div>

      {result.certificate_issued && (
        <div style={{ background:`linear-gradient(135deg,#1A2044,#4B5390)`, borderRadius:16, padding:"22px 24px", marginBottom:28, display:"flex", alignItems:"center", gap:16, color:"#fff" }}>
          <Award size={36} />
          <div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>Certificate Issued!</div>
            <div style={{ fontSize:13, opacity:.85 }}>You completed this course. Find your certificate on your dashboard.</div>
          </div>
        </div>
      )}

      {result.breakdown && (
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.t1, marginBottom:14 }}>Answer Review</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {result.breakdown.map((b, i) => (
              <div key={b.question_id} style={{ background:C.w, border:`1.5px solid ${b.is_correct ? C.g+"55" : C.r+"55"}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  {b.is_correct ? <CheckCircle2 size={16} color={C.g} style={{ flexShrink:0, marginTop:2 }}/> : <XCircle size={16} color={C.r} style={{ flexShrink:0, marginTop:2 }}/>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.t1 }}>{i+1}. {b.question}</div>
                    {b.explanation && <div style={{ fontSize:12, color:C.t3, marginTop:6, lineHeight:1.6 }}>{b.explanation}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
        {!result.passed && (result.attempts_remaining === null || result.attempts_remaining > 0) && (
          <button onClick={onRetry} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            <RefreshCw size={15}/> Try Again{result.attempts_remaining !== null && ` (${result.attempts_remaining} left)`}
          </button>
        )}
        <Link to={courseSlug ? `/learn/${courseSlug}` : "/dashboard"} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:12, border:`1.5px solid ${C.bd}`, background:C.w, color:C.t1, fontSize:14, fontWeight:700, textDecoration:"none" }}>
          Back to Course
        </Link>
      </div>
    </div>
  );
}

export default function Quiz() {
  const C = useThemeColors();
  const { id } = useParams();

  const [quiz,        setQuiz]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [answers,     setAnswers]     = useState({});
  const [current,     setCurrent]     = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [result,      setResult]      = useState(null);
  const [elapsed,     setElapsed]     = useState(0);
  const [courseSlug]  = useState(null);
  const timerRef = useRef(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setResult(null);
    setAnswers({});
    setCurrent(0);
    setElapsed(0);
    api.get(`/quizzes/${id}`)
      .then(setQuiz)
      .catch(e => setError(e.message || "Could not load quiz."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (loading || result || !quiz || quiz.already_passed || !quiz.can_attempt) return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, result, quiz]);

  const handleSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining).`);
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post(`/quizzes/${id}/submit`, {
        answers: answers,
        time_taken_seconds: elapsed,
      });
      clearInterval(timerRef.current);
      setResult(r);
    } catch(e) {
      toast.error(e.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    try {
      await api.post(`/quizzes/${id}/start`, {});
      load();
    } catch(e) { toast.error(e.message || "Could not start a new attempt."); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:`3px solid ${C.pLt}`, borderTopColor:C.p, animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !quiz) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:C.bg }}>
      <AlertCircle size={44} color={C.r} />
      <h2 style={{ fontSize:20, fontWeight:800, color:C.t1 }}>{error || "Quiz not found"}</h2>
      <Link to="/dashboard" style={{ color:C.p, fontWeight:600 }}>Back to Dashboard</Link>
    </div>
  );

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background:C.bg, minHeight:"100vh" }}>
      <Navbar />

      {result ? (
        <ResultScreen result={result} onRetry={handleRetry} courseSlug={courseSlug} />
      ) : quiz.already_passed ? (
        <div style={{ maxWidth:480, margin:"0 auto", padding:"80px 20px", textAlign:"center" }}>
          <CheckCircle2 size={56} color={C.g} style={{ marginBottom:20 }} />
          <h2 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:"0 0 10px" }}>Already passed!</h2>
          <p style={{ fontSize:14, color:C.t2, marginBottom:24 }}>You've already passed this quiz. No need to retake it.</p>
          <Link to="/dashboard" style={{ padding:"12px 24px", borderRadius:12, background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", textDecoration:"none", fontWeight:700, fontSize:14 }}>
            Back to Dashboard
          </Link>
        </div>
      ) : !quiz.can_attempt ? (
        <div style={{ maxWidth:480, margin:"0 auto", padding:"80px 20px", textAlign:"center" }}>
          <AlertCircle size={56} color={C.y} style={{ marginBottom:20 }} />
          <h2 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:"0 0 10px" }}>No attempts remaining</h2>
          <p style={{ fontSize:14, color:C.t2, marginBottom:24 }}>
            You've used all {quiz.attempts_allowed} allowed attempt{quiz.attempts_allowed !== 1 ? "s" : ""} for this quiz.
          </p>
          <Link to="/dashboard" style={{ padding:"12px 24px", borderRadius:12, background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", textDecoration:"none", fontWeight:700, fontSize:14 }}>
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 20px 60px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:800, color:C.t1, margin:"0 0 4px" }}>{quiz.title}</h1>
              {quiz.description && <p style={{ fontSize:13, color:C.t3, margin:0 }}>{quiz.description}</p>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:10, padding:"8px 14px", flexShrink:0 }}>
              <Clock size={14} color={C.t3} />
              <span style={{ fontSize:13, fontWeight:700, color:C.t2, fontVariantNumeric:"tabular-nums" }}>{fmtTime(elapsed)}</span>
            </div>
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:24 }}>
            {quiz.questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrent(i)}
                style={{
                  flex:1, height:6, borderRadius:100, border:"none", cursor:"pointer",
                  background: answers[q.id] ? C.g : (i === current ? C.p : C.bd),
                }}
              />
            ))}
          </div>

          <QuestionCard
            question={quiz.questions[current]}
            index={current}
            total={quiz.questions.length}
            selected={answers[quiz.questions[current].id]}
            onSelect={handleSelect}
          />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:24 }}>
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"11px 18px", borderRadius:11, border:`1.5px solid ${C.bd}`, background:C.w, color: current === 0 ? "#D9D0C0" : C.t1, fontSize:13, fontWeight:600, cursor: current === 0 ? "not-allowed" : "pointer" }}>
              <ChevronLeft size={15}/> Previous
            </button>

            {current < quiz.questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"11px 22px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Next <ChevronRight size={15}/>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:11, border:"none", background: submitting ? "#D9D0C0" : `linear-gradient(135deg,${C.g},#2E5640)`, color:"#fff", fontSize:13, fontWeight:700, cursor: submitting ? "wait" : "pointer" }}>
                {submitting ? <><RefreshCw size={14} style={{ animation:"spin .6s linear infinite" }}/> Submitting…</> : <><CheckCircle2 size={15}/> Submit Quiz</>}
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
