import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert, User, AtSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INDIGO = "#6366F1";
const INDIGO_LIGHT = "#818CF8";

function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="logoGradRegister" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={INDIGO_LIGHT}/>
          <stop offset="100%" stopColor={INDIGO}/>
        </linearGradient>
      </defs>
      <polyline points="6,34 16,34 22,20 28,48 34,26 38,38 44,30 50,34 58,34"
        fill="none" stroke="url(#logoGradRegister)" strokeWidth="4.5"
        strokeLinecap="round" strokeLinejoin="round"/>
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

export default function RegisterPage({ onSwitch }) {
  const { register, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [basarili, setBasarili] = useState(false);
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

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (!terms) {
      setError("Kullanım koşullarını kabul etmeniz gerekiyor");
      return;
    }
    if (!username || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError("Lütfen geçerli bir kullanıcı adı girin (Boşluksuz harf, rakam, alt çizgi).");
      return;
    }

    setLoading(true);
    try {
      const data = await register(email, password, fullName, username, null);
      if (data.session) {
        // Otomatik giriş yapıldı
      } else {
        setBasarili(true);
      }
    } catch (err) {
      setError(err.message === "User already registered" ? "Bu e-posta adresi zaten kayıtlı" : err.message);
    } finally {
      setLoading(false);
    }
  }

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
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 720, height: 720, borderRadius: "50%", background: INDIGO, filter: "blur(150px)", opacity: 0.25 }} />
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
              background: `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_LIGHT} 100%)`,
              color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
              fontFamily: "inherit", boxShadow: "0 8px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2) inset",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >Giriş Yap <ArrowRight size={16} /></motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Register Form ───
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
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 460, margin: "0 auto", padding: "0 24px",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{
          background: "rgba(15, 22, 35, 0.7)",
          backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
          padding: "32px 32px 28px", position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(99,102,241,0.08)",
          maxHeight: "92vh", overflowY: "auto",
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
            <p style={{ margin: 0, fontSize: 13, color: "rgba(241,245,249,0.5)", fontWeight: 500 }}>
              UniPulse ailesine katılmak için bilgilerinizi girin
            </p>
          </div>

          {/* Google Button */}
          <button onClick={loginWithGoogle} disabled={loading} style={{
            width: "100%", height: 44, borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#F1F5F9", cursor: "pointer", fontSize: 13.5, fontWeight: 600,
            fontFamily: "inherit", transition: "all 0.2s ease",
            display: "flex", justifyContent: "center", alignItems: "center", gap: 10,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <GoogleIcon size={16} />
            Google ile Devam Et
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <span style={{ padding: "0 14px", fontSize: 11, color: "rgba(241,245,249,0.35)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>veya</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Ad Soyad */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Ad Soyad</label>
              <div style={{ position: "relative" }}>
                <User size={15} style={iconStyle} />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" required style={inputStyle} {...focusHandlers} />
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

            {/* Kullanıcı Adı */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Kullanıcı Adı</label>
              <div style={{ position: "relative" }}>
                <AtSign size={15} style={iconStyle} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="kullanici_adi" required style={inputStyle} {...focusHandlers} />
              </div>
            </div>

            {/* Agreement */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(241,245,249,0.55)", cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ display: "none" }} />
                <span style={{
                  width: 16, height: 16, border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: 5, display: "flex", justifyContent: "center", alignItems: "center",
                  transition: "all 0.2s ease", background: "rgba(255,255,255,0.04)", flexShrink: 0,
                  ...(terms ? { background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_LIGHT})`, borderColor: "transparent" } : {}),
                }}>
                  {terms && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span>Kullanım koşullarını kabul ediyorum</span>
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

            <motion.button type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "none",
                background: loading ? "rgba(99,102,241,0.3)" : `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_LIGHT} 100%)`,
                color: "#fff", cursor: loading ? "default" : "pointer",
                fontWeight: 600, fontSize: 14, fontFamily: "inherit",
                transition: "all 0.25s ease",
                boxShadow: loading ? "none" : "0 8px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2) inset",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
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
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(241,245,249,0.5)" }}>
            Zaten hesabın var mı?{" "}
            <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: INDIGO_LIGHT, cursor: "pointer", fontWeight: 700, fontSize: 13, padding: 0, fontFamily: "inherit", transition: "color 0.15s" }}
              onMouseEnter={(e) => e.target.style.color = "#A5B4FC"}
              onMouseLeave={(e) => e.target.style.color = INDIGO_LIGHT}
            >Giriş Yap</button>
          </div>
        </div>

        {/* Copyright */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "rgba(241,245,249,0.25)", fontWeight: 500 }}>
          © 2026 UniPulse — Tüm Hakları Saklıdır
        </p>
      </motion.div>
    </div>
  );
}
