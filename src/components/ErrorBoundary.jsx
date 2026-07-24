import { Component } from "react";
import { logClientEvent } from "../utils/clientLogger.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uygulama render hatası:", error, info);
    logClientEvent("client_render_error", {
      message: error?.message,
      componentStack: info?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:"100vh", background:"#080d1a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif", padding:24 }}>
          <div style={{ maxWidth:420, textAlign:"center" }}>
            <h1 style={{ margin:"0 0 12px", color:"#f1f5f9", fontSize:22 }}>Bir şeyler ters gitti</h1>
            <p style={{ margin:"0 0 22px", color:"#64748b", fontSize:14, lineHeight:1.6 }}>Sayfa güvenli şekilde durduruldu. Oturumu yenileyip tekrar deneyebilirsiniz.</p>
            <button onClick={() => window.location.reload()} style={{ padding:"10px 18px", borderRadius:10, border:"1px solid rgba(99,102,241,0.3)", background:"rgba(99,102,241,0.12)", color:"#a5b4fc", cursor:"pointer", fontWeight:700 }}>Sayfayı Yenile</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
