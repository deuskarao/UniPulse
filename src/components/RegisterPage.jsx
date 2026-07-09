import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert, User, AtSign, Sun, Moon, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TermsModal from "./TermsModal";

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
  flex: 1, height: 46, borderRadius: 12,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#F1F5F9", cursor: "pointer", fontSize: 13, fontWeight: 600,
  fontFamily: "inherit", transition: "all 0.2s ease",
  display: "flex", justifyContent: "center", alignItems: "center", gap: 0,
};

export default function RegisterPage({ onSwitch }) {
  const { register, loginAsDemo, loginWithGoogle, loginWithApple, login } = useAuth();
  const { toggleTheme, resolvedMode, tokens } = useTheme();
  const isDark = resolvedMode === "dark";
  
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [termsModal, setTermsModal] = useState(null); // 'terms' or 'kvkk'
  const [agreedContracts, setAgreedContracts] = useState({ terms: false, kvkk: false });
  const canvasRef = useRef(null);

  // ─── Rainbow Trail Canvas Animation ───
  useEffect(() => {
    if (window.innerWidth < 768) return; // Disable on mobile for performance

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (!terms) {
      setError("Lütfen Kullanım Koşulları ve KVKK Aydınlatma Metni'ni kabul edin.");
      return;
    }
    if (!username || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError("Lütfen geçerli bir kullanıcı adı girin (Boşluksuz harf, rakam, alt çizgi).");
      return;
    }

    setLoading(true);
    try {
      const data = await register(email, password, fullName, username, null);
      if (!data.session) {
        setBasarili(true);
      }
    } catch (err) {
      setError(err.message === "User already registered" ? "Bu e-posta adresi zaten kayıtlı" : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginAsDemo();
    } catch (err) {
      if (err.message?.includes("Sistemde")) {
        setError("Demo hesabı bulunamadı.");
      } else {
        setError(err.message || "Demo girişi yapılırken bir hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", height: 44, padding: "0 14px 0 40px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#F1F5F9", fontSize: 13.5, outline: "none", boxSizing: "border-box",
    transition: "all 0.2s ease", fontFamily: "inherit",
  };

  const inputStyleNoIcon = { ...inputStyle, paddingLeft: 14 };

  const labelStyle = {
    display: "block", fontSize: 11.5, color: "rgba(241,245,249,0.55)",
    fontWeight: 600, marginBottom: 5, letterSpacing: "0.2px",
  };

  const focusHandlers = {
    onFocus: (e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.background = "rgba(99,102,241,0.06)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; },
    onBlur: (e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.boxShadow = "none"; },
  };

  const iconStyle = {
    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
    color: "rgba(241,245,249,0.35)", pointerEvents: "none",
  };

  // ─── Success Screen ───
  if (basarili) {
    return (
      <div style={{
        minHeight: "100vh", background: "#070B14",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <canvas className="hidden-mobile" ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
        <div className="hidden-mobile" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 720, height: 720, borderRadius: "50%", background: "#2563EB", filter: "blur(150px)", opacity: 0.25 }} />
          <div style={{ position: "absolute", bottom: "-180px", right: "-180px", width: 560, height: 560, borderRadius: "50%", background: "#0EA5E9", filter: "blur(150px)", opacity: 0.18 }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: 420, maxWidth: "90vw",
            background: "rgba(15, 22, 35, 0.7)",
            backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
            padding: "36px 32px 32px", position: "relative", zIndex: 1,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(99,102,241,0.08)",
            textAlign: "center",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 22px",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </motion.div>
          <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "#F1F5F9", letterSpacing: -0.3 }}>Hesabınız Oluşturuldu!</h1>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(241,245,249,0.6)", lineHeight: 1.55 }}>
            <strong style={{ color: "#F1F5F9" }}>{email}</strong> adresine doğrulama e-postası gönderdik.
          </p>
          <p style={{ margin: "0 0 22px", fontSize: 12, color: "rgba(241,245,249,0.4)", lineHeight: 1.55 }}>
            E-posta kutunuzu kontrol edin ve doğrulama bağlantısına tıklayın.
          </p>
          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: "12px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{ fontSize: 12, color: "#FBBF24", fontWeight: 500, textAlign: "left" }}>E-posta gelen kutunuzda görünmüyorsa spam klasörünü kontrol edin.</div>
          </div>
          <motion.button onClick={onSwitch}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%", height: 48, borderRadius: 12, border: "none",
              background: tokens.primary,
              color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
              fontFamily: "inherit", boxShadow: `0 8px 20px ${isDark ? "rgba(37,99,235,0.32)" : "rgba(37,99,235,0.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >Giriş Yap <ArrowRight size={16} /></motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Register Form ───
  return (
    <div className="auth-layout" style={{
      minHeight: "100vh", background: tokens.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", flexDirection: "column",
      position: "relative", overflowX: "hidden",
    }}>
      {/* Rainbow Trail Canvas */}
      {isDark && <canvas className="hidden-mobile" ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />}

      {/* Background Glows */}
      <div className="hidden-mobile" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 720, height: 720, borderRadius: "50%", background: tokens.primary, filter: "blur(150px)", opacity: isDark ? 0.2 : 0.08 }} />
        <div style={{ position: "absolute", bottom: "-180px", right: "-180px", width: 560, height: 560, borderRadius: "50%", background: tokens.success, filter: "blur(150px)", opacity: isDark ? 0.15 : 0.05 }} />
      </div>

      {/* Top Header */}
      <div style={{ 
        position: "absolute", top: 0, left: 0, width: "100%", padding: "24px 32px", 
        display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10,
      }}>
        <motion.a 
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer" }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: isDark ? "rgba(37,99,235,0.1)" : "rgba(37,99,235,0.08)", 
            display: "flex", alignItems: "center", justifyContent: "center", color: tokens.primary
          }}>
            <GraduationCap size={24} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: tokens.textPrimary }}>UniPulse</span>
        </motion.a>
        <button onClick={toggleTheme} title="Temayı değiştir" style={{
          width: 40, height: 40, borderRadius: 12,
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", 
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
          color: tokens.textPrimary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"; }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 576, margin: "auto", padding: "120px 24px 60px",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{
          background: isDark ? "rgba(15, 22, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRadius: 24, border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
          padding: "32px 32px 28px", position: "relative",
          boxShadow: isDark ? "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(37,99,235,0.08)" : "0 25px 50px -12px rgba(0,0,0,0.05), 0 0 80px rgba(37,99,235,0.04)",
        }}>
          {/* Brand / Title */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.h1
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                margin: "0 0 6px", fontSize: 26, fontWeight: 800, letterSpacing: -0.5,
                backgroundImage: "linear-gradient(to right, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
            >Hesap Oluşturun</motion.h1>
            <p style={{ margin: 0, fontSize: 13, color: tokens.textSecondary, fontWeight: 500 }}>
              Kampüs deneyiminizi dijitalleştirmek için bilgilerinizi girin
            </p>
          </div>

          {/* Social Login Buttons — 2 columns: Google, Apple */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button type="button" onClick={loginWithGoogle} disabled={loading} title="Google ile kayıt ol" 
              style={{ ...socialBtnBase, height: 50, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)", color: tokens.textPrimary }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <GoogleIcon size={24} />
            </button>
            <button type="button" onClick={() => setError("Apple ile Giriş özelliği çok yakında eklenecektir.")} disabled={loading} title="Apple ile kayıt ol" 
              style={{ ...socialBtnBase, height: 50, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)", color: tokens.textPrimary }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <AppleIcon size={24} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
            <span style={{ padding: "0 14px", fontSize: 10, color: tokens.muted, fontWeight: 600, letterSpacing: 1 }}>veya</span>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Ad Soyad / Kullanıcı Adı */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <div style={{ position: "relative" }}>
                  <User size={15} style={iconStyle} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" required style={inputStyle} {...focusHandlers} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Kullanıcı Adı</label>
                <div style={{ position: "relative" }}>
                  <AtSign size={15} style={iconStyle} />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="kullanici_adi" required style={inputStyle} {...focusHandlers} />
                </div>
              </div>
            </div>

            {/* E-posta */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>E-posta</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={iconStyle} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@university.edu.tr" required style={inputStyle} {...focusHandlers} />
              </div>
            </div>

            {/* Şifre / Şifre Tekrar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Şifre</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={iconStyle} />
                  <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} {...focusHandlers} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Şifre Tekrar</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={iconStyle} />
                  <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} {...focusHandlers} />
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: tokens.textSecondary, cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" checked={terms} onChange={(e) => {
                  if (!terms && (!agreedContracts.terms || !agreedContracts.kvkk)) {
                    alert("Önce Kullanım Koşulları ve KVKK metinlerini okuyup onaylamanız gerekmektedir.");
                    e.preventDefault();
                    return;
                  }
                  setTerms(e.target.checked);
                }} style={{ display: "none" }} />
                <span style={{
                  width: 18, height: 18, border: isDark ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid rgba(0,0,0,0.2)",
                  borderRadius: 6, display: "flex", justifyContent: "center", alignItems: "center",
                  transition: "all 0.2s ease", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", flexShrink: 0,
                  ...(terms ? { background: tokens.primary, borderColor: "transparent" } : {}),
                }}>
                  {terms && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
                <span>
                  <button type="button" onClick={(e) => { e.preventDefault(); setTermsModal('terms'); }} style={{ background: 'none', border: 'none', color: tokens.primary, cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>Kullanım Koşulları</button>
                  {' '}ve{' '}
                  <button type="button" onClick={(e) => { e.preventDefault(); setTermsModal('kvkk'); }} style={{ background: 'none', border: 'none', color: tokens.primary, cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>KVKK Aydınlatma Metni</button>
                  'ni kabul ediyorum
                </span>
              </label>
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
                    fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%", height: 44, borderRadius: 12, border: "none", marginTop: 8,
                background: tokens.primary,
                color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13.5,
                display: "flex", justifyContent: "center", alignItems: "center", gap: 10,
                fontFamily: "inherit", boxShadow: `0 8px 20px ${isDark ? "rgba(37,99,235,0.32)" : "rgba(37,99,235,0.2)"}`,
              }}
            >
              {loading ? (
                <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Kayıt yapılıyor...</>
              ) : (
                <>Kayıt Ol <ArrowRight size={15} /></>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: tokens.textSecondary }}>
            Zaten hesabın var mı?{" "}
            <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: tokens.primary, cursor: "pointer", fontWeight: 700, fontSize: 13, padding: 0, fontFamily: "inherit", transition: "color 0.15s" }}
              onMouseEnter={(e) => e.target.style.color = tokens.primaryHover}
              onMouseLeave={(e) => e.target.style.color = tokens.primary}
            >Giriş Yap</button>
          </div>

          <div style={{ marginTop: 12, borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", paddingTop: 12, textAlign: "center", fontSize: 10, color: tokens.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" }}>
            <ShieldCheck size={14} style={{ flexShrink: 0 }} /> Verileriniz 256-bit SSL şifreleme ile korunur.
          </div>
        </div>
      </motion.div>

      {/* Copyright Footer */}
      <div style={{ position: "absolute", bottom: 28, left: 32, fontSize: 11, color: tokens.muted, fontWeight: 500, zIndex: 10 }} className="hidden-mobile">
        © 2026 UniPulse — Tüm Hakları Saklıdır
      </div>

      <TermsModal
        isOpen={!!termsModal}
        onClose={() => setTermsModal(null)}
        type={termsModal}
        tokens={tokens}
        isDark={isDark}
        onApprove={() => {
          const newAgreed = { ...agreedContracts, [termsModal]: true };
          setAgreedContracts(newAgreed);
          if (newAgreed.terms && newAgreed.kvkk) {
            setTerms(true);
          }
          setTermsModal(null);
        }}
        onDecline={() => {
          const newAgreed = { ...agreedContracts, [termsModal]: false };
          setAgreedContracts(newAgreed);
          setTerms(false);
          setTermsModal(null);
        }}
      />
    </div>
  );
}
