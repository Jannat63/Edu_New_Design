import { RefreshCw } from "lucide-react";

const C = {
  p:"#28305E", pLt:"#E8E9F1",
  w:"#FFFFFF", bd:"#E4DBC8",
  t1:"#211D1A", t3:"#8A8275",
};

export const GATEWAYS = [
  { key:"bkash",      label:"bKash",      emoji:"📱", color:"#E2136E", bg:"#FCE7F0" },
  { key:"nagad",      label:"Nagad",      emoji:"🧡", color:"#F6921E", bg:"#FEF3E2" },
  { key:"sslcommerz", label:"Card / Bank",emoji:"💳", color:C.p,       bg:C.pLt    },
];

/**
 * Shared checkout modal — used for both single-course purchases (Course.jsx)
 * and bundle purchases (BundleDetail.jsx). `itemLabel` customizes the one
 * line of copy that differs between the two ("this course" vs the bundle's
 * title).
 */
export default function PaymentMethodModal({ amount, itemLabel = "this course", onClose, onSelect, loadingGateway }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.w, borderRadius:20, padding:"28px 26px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:C.t1, margin:0 }}>Choose payment method</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.t3, padding:2 }}>✕</button>
        </div>
        <p style={{ fontSize:13, color:C.t3, margin:"0 0 20px" }}>You're paying <strong style={{ color:C.t1 }}>৳{amount.toLocaleString()}</strong> to enroll in {itemLabel}.</p>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {GATEWAYS.map(g => (
            <button key={g.key} onClick={() => onSelect(g.key)} disabled={!!loadingGateway}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14, border:`1.5px solid ${C.bd}`, background:C.w, cursor: loadingGateway ? "wait" : "pointer", textAlign:"left", opacity: loadingGateway && loadingGateway !== g.key ? .5 : 1, transition:"all .15s" }}
              onMouseEnter={e=>{ if(!loadingGateway) e.currentTarget.style.borderColor = g.color; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor = C.bd; }}
            >
              <div style={{ width:44, height:44, borderRadius:12, background:g.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{g.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>{g.label}</div>
                <div style={{ fontSize:12, color:C.t3 }}>{g.key==="sslcommerz" ? "Visa, Mastercard, or bank transfer" : `Pay instantly with ${g.label}`}</div>
              </div>
              {loadingGateway === g.key
                ? <RefreshCw size={16} color={g.color} style={{ animation:"spin .6s linear infinite" }}/>
                : <span style={{ color:g.color, fontSize:18 }}>→</span>}
            </button>
          ))}
        </div>

        <p style={{ fontSize:11, color:C.t3, textAlign:"center", marginTop:18 }}>
          You'll be redirected to your chosen provider to complete payment securely.
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
