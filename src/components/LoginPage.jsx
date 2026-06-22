import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%", height: 42, padding: "0 14px", borderRadius: 10,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#F8FAFC", fontSize: 13, outline: "none", boxSizing: "border-box",
  transition: "all 0.3s ease", fontFamily: "inherit",
};

const labelStyle = {
  display: "block", fontSize: 12, color: "rgba(248,250,252,0.6)",
  fontWeight: 500, marginBottom: 6, letterSpacing: "0.3px",
};

const focusHandlers = {
  onFocus: (e) => { e.target.style.borderColor = "rgba(124,58,237,0.4)"; e.target.style.background = "rgba(124,58,237,0.08)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; },
  onBlur: (e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.boxShadow = "none"; },
};

export default function LoginPage({ onSwitch }) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "E-posta veya şifre hatalı" : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  }

  function closeForgot() {
    setForgotOpen(false);
    setForgotSent(false);
    setForgotEmail("");
    setForgotError("");
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#020617",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background Glows */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 800, height: 800, borderRadius: "50%", background: "#7C3AED", filter: "blur(150px)", opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: "-150px", right: "-150px", width: 600, height: 600, borderRadius: "50%", background: "#06B6D4", filter: "blur(150px)", opacity: 0.5 }} />
      </div>

      {/* Watermark */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        fontSize: 180, fontWeight: 700, letterSpacing: 30,
        color: "white", opacity: 0.03, whiteSpace: "nowrap",
        userSelect: "none", pointerEvents: "none", zIndex: 0,
      }}>UNIPULSE</div>

      {/* Card */}
      <div style={{
        width: 380, background: "rgba(10,15,35,0.45)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
        padding: "28px 32px", position: "relative", zIndex: 1,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px rgba(124,58,237,0.1)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-flex", justifyContent: "center", alignItems: "center",
            width: 48, height: 48, background: "#0f172a",
            borderRadius: 12, marginBottom: 12, border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#a78bfa"/>
                </linearGradient>
              </defs>
              <polyline points="6,34 16,34 22,20 28,48 34,26 38,38 44,30 50,34 58,34"
                fill="none" stroke="url(#lg)" strokeWidth="4.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            margin: "0 0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #F8FAFC 0%, rgba(248,250,252,0.8) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>UniPulse</h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(248,250,252,0.5)" }}>
            Üniversite hayatının kontrol merkezi
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@university.edu.tr" required style={inputStyle} {...focusHandlers} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} {...focusHandlers} />
          </div>

          {/* Options */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(248,250,252,0.5)", cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ display: "none" }} />
              <span style={{
                width: 16, height: 16, border: "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 4, display: "flex", justifyContent: "center", alignItems: "center",
                transition: "all 0.2s ease", background: "rgba(255,255,255,0.04)", flexShrink: 0,
                ...(remember ? { background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", borderColor: "transparent" } : {}),
              }}>
                {remember && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span>Beni hatırla</span>
            </label>
            <button type="button" onClick={() => setForgotOpen(true)} style={{ background: "none", border: "none", fontSize: 12, color: "rgba(248,250,252,0.5)", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              onMouseEnter={(e) => e.target.style.color = "#8B5CF6"}
              onMouseLeave={(e) => e.target.style.color = "rgba(248,250,252,0.5)"}
            >Şifremi unuttum?</button>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#f87171", fontSize: 12 }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", height: 44, borderRadius: 10, border: "none",
            background: loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
            color: "#fff", cursor: loading ? "default" : "pointer",
            fontWeight: 600, fontSize: 14, fontFamily: "inherit",
            transition: "all 0.3s ease",
            boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.35)",
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(124,58,237,0.45)"; }}}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.35)"; }}}
          >{loading ? "Giriş yapılıyor..." : "Giriş Yap"}</button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ padding: "0 14px", fontSize: 11, color: "rgba(248,250,252,0.4)" }}>veya</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Google Button */}
        <button style={{
          width: "100%", height: 42, borderRadius: 10,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#F8FAFC", cursor: "pointer", fontSize: 13, fontWeight: 500,
          fontFamily: "inherit", transition: "all 0.3s ease",
          display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google ile Devam Et
        </button>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "rgba(248,250,252,0.5)" }}>
          Hesabın yok mu?{" "}
          <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "#8B5CF6", cursor: "pointer", fontWeight: 500, fontSize: 13, padding: 0, fontFamily: "inherit" }}
            onMouseEnter={(e) => e.target.style.color = "#06B6D4"}
            onMouseLeave={(e) => e.target.style.color = "#8B5CF6"}
          >Kayıt Ol</button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div onClick={closeForgot} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 360, background: "rgba(10,15,35,0.9)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
            padding: "28px 32px", position: "relative", zIndex: 1,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
          }}>
            <button onClick={closeForgot} style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(248,250,252,0.5)", borderRadius: 8, width: 28, height: 28,
              cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(248,250,252,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >✕</button>

            {!forgotSent ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px", fontSize: 20,
                  }}>🔒</div>
                  <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#F8FAFC" }}>Şifre Sıfırlama</h2>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(248,250,252,0.5)", lineHeight: 1.5 }}>
                    E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>E-posta</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ornek@university.edu.tr" required style={inputStyle} {...focusHandlers} />
                  </div>

                  {forgotError && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, color: "#f87171", fontSize: 11 }}>{forgotError}</div>
                  )}

                  <button type="submit" disabled={forgotLoading} style={{
                    width: "100%", height: 42, borderRadius: 10, border: "none",
                    background: forgotLoading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
                    color: "#fff", cursor: forgotLoading ? "default" : "pointer",
                    fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                    boxShadow: forgotLoading ? "none" : "0 4px 20px rgba(124,58,237,0.35)",
                  }}>{forgotLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}</button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", fontSize: 24,
                }}>✉️</div>
                <h2 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#F8FAFC" }}>Bağlantı Gönderildi!</h2>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(248,250,252,0.6)", lineHeight: 1.5 }}>
                  <strong style={{ color: "#F8FAFC" }}>{forgotEmail}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                </p>
                <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(248,250,252,0.4)", lineHeight: 1.5 }}>
                  E-posta kutunuzu kontrol edin.
                </p>
                <button onClick={closeForgot} style={{
                  width: "100%", height: 42, borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
                  color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13,
                  fontFamily: "inherit", boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                }}>Giriş Sayfasına Dön</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
