import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert, Sun, Moon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INDIGO = "#6366F1";
const INDIGO_LIGHT = "#818CF8";

function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="logoGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={INDIGO_LIGHT}/>
          <stop offset="100%" stopColor={INDIGO}/>
        </linearGradient>
      </defs>
      <polyline points="6,34 16,34 22,20 28,48 34,26 38,38 44,30 50,34 58,34"
        fill="none" stroke="url(#logoGradLogin)" strokeWidth="4.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Google SVG icon
function AppleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

function GoogleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// Social button shared style
const socialBtnBase = {
  flex: 1, height: 48, borderRadius: 12,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#F1F5F9", cursor: "pointer", fontSize: 13, fontWeight: 600,
  fontFamily: "inherit", transition: "all 0.2s ease",
  display: "flex", justifyContent: "center", alignItems: "center", gap: 0,
};

export default function LoginPage({ onSwitch }) {
  const { login, loginWithGoogle, loginWithApple, resetPassword } = useAuth();
  const { toggleTheme, resolvedMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const canvasRef = useRef(null);

  // ─── Rainbow Trail Canvas Animation ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const trail = [];
    let hue = 0;

    const handleMouseMove = (e) => {
      hue = (hue + 4) % 360;
      trail.push({ x: e.clientX, y: e.clientY, age: 0, color: hue });
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationId;
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      if (trail.length > 0) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 0; i < trail.length; i++) {
          trail[i].age++;
          if (trail[i].age > 60) {
            trail.splice(i, 1);
            i--;
            continue;
          }
          if (i > 0) {
            const p1 = trail[i - 1];
            const p2 = trail[i];
            const lifeRatio = 1 - p2.age / 60;
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${p2.color}, 100%, 50%, ${lifeRatio})`;
            ctx.lineWidth = lifeRatio * 18;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

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

  const inputStyle = {
    width: "100%", height: 46, padding: "0 14px 0 42px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#F1F5F9", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "all 0.2s ease", fontFamily: "inherit",
  };

  const inputStyleNoIcon = {
    ...inputStyle, paddingLeft: 14,
  };

  const labelStyle = {
    display: "block", fontSize: 12, color: "rgba(241,245,249,0.6)",
    fontWeight: 600, marginBottom: 6, letterSpacing: "0.2px",
  };

  const focusHandlers = {
    onFocus: (e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.background = "rgba(99,102,241,0.06)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; },
    onBlur: (e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.boxShadow = "none"; },
  };

  const iconStyle = {
    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
    color: "rgba(241,245,249,0.35)", pointerEvents: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#070B14",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Rainbow Trail Canvas */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />

      {/* Background Glows */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 720, height: 720, borderRadius: "50%", background: INDIGO, filter: "blur(150px)", opacity: 0.25 }} />
        <div style={{ position: "absolute", bottom: "-180px", right: "-180px", width: 560, height: 560, borderRadius: "50%", background: "#0EA5E9", filter: "blur(150px)", opacity: 0.18 }} />
      </div>

      {/* Top Header */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Logo size={24} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: "#F1F5F9" }}>UniPulse</span>
        </div>
        <button onClick={toggleTheme} title="Temayı değiştir" style={{
          width: 40, height: 40, borderRadius: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          {resolvedMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 420, margin: "0 auto", padding: "0 24px",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{
          background: "rgba(15, 22, 35, 0.7)",
          backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
          padding: "36px 32px 32px", position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(99,102,241,0.08)",
        }}>
          {/* Brand / Title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <motion.h1
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                margin: "0 0 6px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5,
                backgroundImage: "linear-gradient(to right, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
            >Hoş Geldiniz</motion.h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(241,245,249,0.5)", fontWeight: 500 }}>
              Devam etmek için bilgilerinizi girin
            </p>
          </div>

          {/* Social Login Buttons — 3 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <button onClick={loginWithGoogle} disabled={loading} title="Google ile giriş yap" style={socialBtnBase}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <GoogleIcon size={20} />
            </button>
            <button onClick={() => loginWithApple?.()} disabled={loading} title="Apple ile giriş yap" style={socialBtnBase}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <AppleIcon size={20} />
            </button>
            <button onClick={() => { login("demo@unipulse.app", "demo123").catch(() => {}); }} disabled={loading} title="Demo hesabı ile giriş yap"
              style={{ ...socialBtnBase, color: "#60A5FA" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(96,165,250,0.08)"; e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <Sparkles size={20} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <span style={{ padding: "0 14px", fontSize: 11, color: "rgba(241,245,249,0.35)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>veya</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>E-posta veya Kullanıcı Adı</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={iconStyle} />
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@edu.tr veya kullaniciadi" required style={inputStyle} {...focusHandlers} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Şifre</label>
                <button type="button" onClick={() => setForgotOpen(true)} style={{ background: "none", border: "none", fontSize: 11.5, color: INDIGO_LIGHT, cursor: "pointer", fontFamily: "inherit", padding: 0, fontWeight: 600, transition: "color 0.15s" }}
                  onMouseEnter={(e) => e.target.style.color = "#A5B4FC"}
                  onMouseLeave={(e) => e.target.style.color = INDIGO_LIGHT}
                >Şifremi unuttum</button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={iconStyle} />
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} {...focusHandlers} />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#FCA5A5",
                    fontSize: 12.5, display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: "100%", height: 48, borderRadius: 12, border: "none",
                background: loading ? "rgba(99,102,241,0.3)" : `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_LIGHT} 100%)`,
                color: "#fff", cursor: loading ? "default" : "pointer",
                fontWeight: 600, fontSize: 14.5, fontFamily: "inherit",
                transition: "all 0.25s ease",
                boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2) inset",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Giriş yapılıyor...</>
              ) : (
                <>Giriş Yap <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "rgba(241,245,249,0.5)" }}>
            Hesabın yok mu?{" "}
            <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: INDIGO_LIGHT, cursor: "pointer", fontWeight: 700, fontSize: 13.5, padding: 0, fontFamily: "inherit", transition: "color 0.15s" }}
              onMouseEnter={(e) => e.target.style.color = "#A5B4FC"}
              onMouseLeave={(e) => e.target.style.color = INDIGO_LIGHT}
            >Kayıt Ol</button>
          </div>
        </div>

        {/* Copyright */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "rgba(241,245,249,0.25)", fontWeight: 500 }}>
          © 2026 UniPulse — Tüm Hakları Saklıdır
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeForgot}
            style={{
              position: "fixed", inset: 0, background: "rgba(7, 11, 20, 0.7)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 400, maxWidth: "90vw",
                background: "rgba(15, 22, 35, 0.92)",
                backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
                borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
                padding: "30px 32px", position: "relative", zIndex: 1,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.06)",
              }}
            >
              <button onClick={closeForgot} style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(241,245,249,0.5)", borderRadius: 8, width: 30, height: 30,
                cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit", transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#F1F5F9"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(241,245,249,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              >✕</button>

              {!forgotSent ? (
                <>
                  <div style={{ textAlign: "center", marginBottom: 22 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 16px",
                    }}>
                      <Lock size={22} color={INDIGO_LIGHT} />
                    </div>
                    <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 700, color: "#F1F5F9", letterSpacing: -0.3 }}>Şifre Sıfırlama</h2>
                    <p style={{ margin: 0, fontSize: 12.5, color: "rgba(241,245,249,0.5)", lineHeight: 1.55 }}>
                      E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
                    </p>
                  </div>
                  <form onSubmit={handleForgotPassword}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>E-posta</label>
                      <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ornek@university.edu.tr" required style={inputStyleNoIcon} {...focusHandlers} />
                    </div>
                    {forgotError && (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, color: "#FCA5A5", fontSize: 11.5 }}>{forgotError}</div>
                    )}
                    <motion.button type="submit" disabled={forgotLoading}
                      whileHover={!forgotLoading ? { scale: 1.02 } : {}}
                      whileTap={!forgotLoading ? { scale: 0.98 } : {}}
                      style={{
                        width: "100%", height: 46, borderRadius: 12, border: "none",
                        background: forgotLoading ? "rgba(99,102,241,0.3)" : `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_LIGHT} 100%)`,
                        color: "#fff", cursor: forgotLoading ? "default" : "pointer",
                        fontWeight: 600, fontSize: 13.5, fontFamily: "inherit",
                        boxShadow: forgotLoading ? "none" : "0 8px 20px rgba(99,102,241,0.32)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      {forgotLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Gönderiliyor...</> : "Sıfırlama Bağlantısı Gönder"}
                    </motion.button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 18px",
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#F1F5F9", letterSpacing: -0.3 }}>Bağlantı Gönderildi!</h2>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(241,245,249,0.6)", lineHeight: 1.55 }}>
                    <strong style={{ color: "#F1F5F9" }}>{forgotEmail}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                  </p>
                  <p style={{ margin: "0 0 22px", fontSize: 12, color: "rgba(241,245,249,0.4)", lineHeight: 1.55 }}>
                    E-posta kutunuzu kontrol edin.
                  </p>
                  <motion.button onClick={closeForgot}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: "100%", height: 46, borderRadius: 12, border: "none",
                      background: `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_LIGHT} 100%)`,
                      color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13.5,
                      fontFamily: "inherit", boxShadow: "0 8px 20px rgba(99,102,241,0.32)",
                    }}
                  >Giriş Sayfasına Dön</motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
