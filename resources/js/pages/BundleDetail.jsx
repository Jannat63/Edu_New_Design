import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  GraduationCap, Package, ChevronRight, Star, Users, CheckCircle2,
  RefreshCw, ArrowRight, BookOpen, ShoppingCart,
} from "lucide-react";
import AuthNavActions from "@/components/AuthNavActions";
import MegaMenu from "@/components/MegaMenu";
import Logo from "@/components/Logo";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { useThemeColors, DarkModeToggle } from "@/lib/darkMode";

const C = {
  p:"#28305E", pDk:"#1A2044", pLt:"#E8E9F1",
  a:"#B23A2E", aLt:"#F7E3DF",
  g:"#3A6B4C", gLt:"#E3EDE6",
  w:"#FFFFFF", bg:"#FBF6EE", bd:"#E4DBC8",
  t1:"#211D1A", t2:"#5B564E", t3:"#8A8275",
};

function Navbar() {
  return <MegaMenu logo={<Logo />} actions={<><DarkModeToggle size="sm" /><AuthNavActions /></>} />;
}

function Footer() {
  return (
    <footer style={{ background:"#1A2044", padding:"32px clamp(20px,4vw,40px)", marginTop:60 }}>
      <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <span style={{ color:"rgba(255,255,255,.25)", fontSize:13 }}>© 2026 EduBD · Bangladesh's #1 Learning Platform</span>
        <div style={{ display:"flex", gap:20 }}>
          {[["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]].map(([l,to])=>(
            <Link key={l} to={to} style={{ color:"rgba(255,255,255,.3)", fontSize:13, textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function BundleDetailPage() {
  const C = useThemeColors();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bundle,  setBundle]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [initiatingGateway, setInitiatingGateway] = useState(null);
  const [inCart, setInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!user) { navigate("/login"); return; }
    setAddingToCart(true);
    try {
      const r = await api.post("/cart", { bundle_id: bundle.id });
      setInCart(true);
      toast.success(r.message || "Added to cart.");
    } catch (e) {
      toast.error(e.message || "Could not add to cart.");
    } finally { setAddingToCart(false); }
  };

  usePageTitle(bundle ? `${bundle.title} — Bundle` : "Course Bundle");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.get(`/bundles/${id}`)
      .then(setBundle)
      .catch(() => setError("This bundle could not be found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = () => {
    if (!user) { navigate("/login"); return; }
    setShowPaymentModal(true);
  };

  const handleSelectGateway = async (gateway) => {
    setInitiatingGateway(gateway);
    try {
      const r = await api.post("/payments/initiate", { bundle_id: bundle.id, gateway });
      if (r.free) {
        toast.success(r.message || "Enrolled for free!");
        setShowPaymentModal(false);
        setTimeout(() => navigate("/dashboard"), 1000);
        return;
      }
      if (r.redirect_url) {
        window.location.href = r.redirect_url;
        return;
      }
      toast.error("Could not start payment. Please try again.");
    } catch (e) {
      toast.error(e.message || "Could not start payment.");
      setShowPaymentModal(false);
    } finally {
      setInitiatingGateway(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <RefreshCw size={28} color={C.p} style={{ animation:"spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg }}>
        <Navbar />
        <div style={{ textAlign:"center", padding:"100px 20px" }}>
          <Package size={44} style={{ color:C.t3, opacity:.4, marginBottom:14 }} />
          <p style={{ fontSize:16, fontWeight:700, color:C.t1, margin:"0 0 8px" }}>{error || "Bundle not found."}</p>
          <Link to="/bundles" style={{ color:C.p, fontWeight:700, fontSize:14, textDecoration:"none" }}>← Back to bundles</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const savingsPct = bundle.original_price && bundle.original_price > bundle.price
    ? Math.round((1 - bundle.price / bundle.original_price) * 100)
    : null;
  const ownedCount = bundle.courses.filter(c => c.is_owned).length;

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Navbar />

      <div style={{ background:`linear-gradient(135deg,${C.pDk},${C.p})`, padding:"32px clamp(20px,4vw,40px) 40px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:14 }}>
            <Link to="/" style={{ color:"rgba(255,255,255,.6)",textDecoration:"none" }}>Home</Link>
            <ChevronRight size={14} />
            <Link to="/bundles" style={{ color:"rgba(255,255,255,.6)",textDecoration:"none" }}>Bundles</Link>
            <ChevronRight size={14} />
            <span style={{ color:"#fff",fontWeight:600 }}>{bundle.title}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Package size={20} color="#fff" />
            </div>
            <span style={{ color:"rgba(255,255,255,.75)", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>Course Bundle</span>
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(24px,3.4vw,34px)", fontWeight:600, color:"#fff", margin:"0 0 12px", letterSpacing:"-0.5px", maxWidth:700 }}>{bundle.title}</h1>
          {bundle.description && <p style={{ fontSize:15, color:"rgba(255,255,255,.85)", lineHeight:1.7, maxWidth:640, margin:0 }}>{bundle.description}</p>}
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:"-28px auto 0", padding:"0 clamp(20px,4vw,40px) 60px", display:"grid", gridTemplateColumns:"1fr 340px", gap:28, alignItems:"start" }}>
        {/* Left: course list */}
        <div>
          <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:24 }}>
            <h2 style={{ fontSize:17, fontWeight:800, color:C.t1, margin:"0 0 4px" }}>What's included</h2>
            <p style={{ fontSize:13, color:C.t3, margin:"0 0 18px" }}>{bundle.courses.length} course{bundle.courses.length===1?"":"s"} in this bundle</p>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {bundle.courses.map(c => (
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:14, padding:14, borderRadius:12, border:`1px solid ${C.bd}`, background: c.is_owned ? C.gLt : C.bg }}>
                  <div style={{ width:56, height:56, borderRadius:10, background:`linear-gradient(135deg,${C.p},#4B5390)`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <BookOpen size={22} color="#fff" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link to={`/course/${c.slug}`} style={{ fontSize:14, fontWeight:700, color:C.t1, textDecoration:"none" }}>{c.title}</Link>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4, fontSize:12, color:C.t3 }}>
                      {c.instructor && <span>{c.instructor}</span>}
                      {c.rating > 0 && <span style={{ display:"flex", alignItems:"center", gap:3 }}><Star size={11} fill={C.a} color={C.a} />{c.rating.toFixed(1)}</span>}
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}><Users size={11} />{c.total_students >= 1000 ? `${(c.total_students/1000).toFixed(1)}K` : c.total_students}</span>
                    </div>
                  </div>
                  {c.is_owned
                    ? <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:C.g, flexShrink:0 }}><CheckCircle2 size={14}/> Owned</span>
                    : <span style={{ fontSize:13, fontWeight:700, color:C.t2, flexShrink:0 }}>৳{c.price.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: sticky buy box */}
        <div style={{ position:"sticky", top:84 }}>
          <div style={{ background:C.w, border:`1.5px solid ${C.bd}`, borderRadius:18, padding:24, boxShadow:"0 8px 32px rgba(0,0,0,.06)" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
              <span style={{ fontSize:30, fontWeight:900, color:C.t1 }}>৳{bundle.payable_price.toLocaleString()}</span>
              {bundle.payable_price < bundle.price && (
                <span style={{ fontSize:15, color:C.t3, textDecoration:"line-through" }}>৳{bundle.price.toLocaleString()}</span>
              )}
              {bundle.payable_price === bundle.price && bundle.original_price && bundle.original_price > bundle.price && (
                <span style={{ fontSize:15, color:C.t3, textDecoration:"line-through" }}>৳{bundle.original_price.toLocaleString()}</span>
              )}
            </div>
            {savingsPct !== null && bundle.payable_price === bundle.price && (
              <div style={{ display:"inline-block", background:C.aLt, color:C.a, fontSize:12, fontWeight:800, padding:"4px 10px", borderRadius:20, marginBottom:16 }}>
                Save {savingsPct}% vs buying separately
              </div>
            )}

            {bundle.fully_owned ? (
              <div style={{ textAlign:"center", padding:"10px 0" }}>
                <CheckCircle2 size={28} color={C.g} style={{ marginBottom:8 }} />
                <p style={{ fontSize:14, fontWeight:700, color:C.t1, margin:"0 0 14px" }}>You already own every course in this bundle.</p>
                <Link to="/dashboard" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 20px", borderRadius:12, background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontWeight:700, fontSize:14, textDecoration:"none" }}>
                  Go to dashboard <ArrowRight size={16}/>
                </Link>
              </div>
            ) : (
              <>
                <button onClick={handleBuy} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px 20px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.p},#4B5390)`, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:`0 8px 20px ${C.p}40` }}>
                  {ownedCount > 0 ? `Buy remaining ${bundle.courses.length - ownedCount} course${bundle.courses.length - ownedCount === 1 ? "" : "s"}` : "Buy this bundle"} <ArrowRight size={16}/>
                </button>
                {ownedCount > 0 && (
                  <p style={{ fontSize:12, color:C.t3, textAlign:"center", margin:"10px 0 0" }}>You already own {ownedCount} of {bundle.courses.length} courses — you'll only pay for what's left to unlock.</p>
                )}
                {ownedCount === 0 && (
                  // Cart checkout charges the bundle's full price — only
                  // offered here when nothing in it is already owned, so it
                  // can't silently overcharge past what "Buy remaining"
                  // above correctly prorates for a partial owner.
                  <button onClick={handleAddToCart} disabled={inCart || addingToCart}
                    style={{ width:"100%", background:"transparent", color: inCart ? C.g : C.p, border:`1.5px solid ${inCart ? C.g : C.p}`, borderRadius:12, padding:"11px", fontSize:14, fontWeight:700, cursor: (inCart||addingToCart) ? "default" : "pointer", marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {inCart ? <><CheckCircle2 size={16}/> In your cart</> : addingToCart ? "Adding…" : <><ShoppingCart size={16}/> Add to Cart</>}
                  </button>
                )}
              </>
            )}

            <div style={{ marginTop:18, paddingTop:18, borderTop:`1px solid ${C.bd}`, display:"flex", flexDirection:"column", gap:10 }}>
              {["Lifetime access to every course", "Certificate on completion of each course", "Learn at your own pace"].map(f => (
                <div key={f} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.t2 }}>
                  <CheckCircle2 size={15} color={C.g} /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showPaymentModal && (
        <PaymentMethodModal
          amount={bundle.payable_price}
          itemLabel={`the "${bundle.title}" bundle`}
          onClose={() => setShowPaymentModal(false)}
          onSelect={handleSelectGateway}
          loadingGateway={initiatingGateway}
        />
      )}
    </div>
  );
}
