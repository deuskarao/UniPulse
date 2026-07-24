import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../context/I18nContext';
import { Mail, Lock, Loader2, Sparkles, User, ArrowRight, ShieldCheck, Eye, EyeOff, Sun, Moon, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageToggle from './LanguageToggle';
import { createGoogleNonce, getGoogleClientId, loadGoogleIdentity } from '../lib/googleIdentity';

// --- Basic UI Components replacing shadcn/ui ---
const Button = ({ className = '', variant = 'default', ...props }) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };
  return <button className={`${base} ${variants[variant] || ''} ${className}`} {...props} />;
};

const Input = ({ className = '', ...props }) => {
  return (
    <input 
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} 
      {...props} 
    />
  );
};

const Label = ({ className = '', ...props }) => {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />;
};

const Checkbox = ({ className = '', checked, onCheckedChange, id, ...props }) => {
  return (
    <button 
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`peer h-4 w-4 shrink-0 rounded-[4px] border border-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent dark:bg-white/5 border-border/60 dark:border-white/20'} ${className}`} 
      {...props} 
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </button>
  );
};
// ----------------------------------------------

const AppleIcon = ({ className, size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 384 512" className={className} fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
)

const GoogleIcon = ({ className, size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" className={className}>
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
    <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
  </svg>
)

class Point {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.age = 0
    this.color = color
  }
}

export default function AuthPage({ initialMode = 'login' }) {
  const { login, register, loginWithGoogle, loginAsDemo, resetPassword } = useAuth();
  const { toggleTheme, resolvedMode, tokens } = useTheme();
  const isDark = resolvedMode === "dark";
  const { t } = useI18n();

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsModal, setTermsModal] = useState(null)
  const [agreedContracts, setAgreedContracts] = useState({ terms: false, kvkk: false })
  const [showPassword, setShowPassword] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [googleButtonAvailable, setGoogleButtonAvailable] = useState(false)

  const canvasRef = useRef(null)
  const googleButtonRef = useRef(null)
  const googleLoginRef = useRef(loginWithGoogle)
  const googleNonceRef = useRef(null)

  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted) {
        setLoading(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    googleLoginRef.current = loginWithGoogle;
  }, [loginWithGoogle]);

  useEffect(() => {
    if (mode === 'forgot-password') return undefined;

    let cancelled = false;

    async function renderGoogleButton() {
      const container = googleButtonRef.current;
      if (!container) return;

      container.innerHTML = "";
      setGoogleButtonAvailable(false);

      try {
        const clientId = getGoogleClientId();
        const google = await loadGoogleIdentity();
        const { nonce, hashedNonce } = await createGoogleNonce();
        if (cancelled) return;

        googleNonceRef.current = nonce;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (cancelled) return;
            setLoading(true);
            setError('');
            try {
              await googleLoginRef.current(response?.credential, googleNonceRef.current);
            } catch (err) {
              setError(err.message || t('auth.google_login_failed'));
              setLoading(false);
            }
          },
          nonce: hashedNonce,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: mode === 'register' ? 'signup' : 'signin',
          ux_mode: 'popup',
        });

        container.innerHTML = "";
        google.accounts.id.renderButton(container, {
          type: 'icon',
          shape: 'rectangular',
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          logo_alignment: 'center',
          width: 48,
        });
        setGoogleButtonAvailable(true);
      } catch (err) {
        console.warn("Google kimlik butonu hazırlanamadı:", err);
        setGoogleButtonAvailable(false);
      }
    }

    renderGoogleButton();

    return () => {
      cancelled = true;
      if (googleButtonRef.current) googleButtonRef.current.innerHTML = "";
    };
  }, [isDark, mode, t]);

  // Rainbow Trail Animasyonu
  useEffect(() => {
    if (window.innerWidth < 768) return; 

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let w = window.innerWidth
    canvas.width = w
    let h = window.innerHeight
    canvas.height = h
    
    const handleResize = () => {
      w = window.innerWidth
      canvas.width = w
      h = window.innerHeight
      canvas.height = h
    }
    window.addEventListener('resize', handleResize)

    const trail = []
    let hue = 0

    const handleMouseMove = (e) => {
      hue = (hue + 4) % 360
      trail.push(new Point(e.clientX, e.clientY, hue))
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    let animationId
    const animate = () => {
      if (!ctx) return
      
      ctx.clearRect(0, 0, w, h)
      
      if (trail.length > 0) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        for (let i = 0; i < trail.length; i++) {
          trail[i].age++
          
          if (trail[i].age > 60) {
            trail.splice(i, 1)
            i--
            continue
          }
          
          if (i > 0) {
            const p1 = trail[i - 1]
            const p2 = trail[i]
            const lifeRatio = 1 - p2.age / 60
            
            ctx.beginPath()
            ctx.strokeStyle = `hsla(${p2.color}, 100%, 50%, ${lifeRatio})`
            ctx.lineWidth = lifeRatio * 18 
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'forgot-password') {
      try {
        await resetPassword(email);
        alert(t('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!'))
        setMode('login')
      } catch(err) {
        setError(err.message || t("Bir hata oluştu"));
      }
      setLoading(false)
      return
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError(t('Şifreler eşleşmiyor.'))
        setLoading(false)
        return
      }
      if (!termsAccepted) {
        setError(t("Lütfen Kullanım Koşulları ve KVKK Aydınlatma Metni'ni kabul edin."))
        setLoading(false)
        return
      }
      
      const allowedDomains = ["gmail.com", "googlemail.com", "icloud.com", "me.com", "mac.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.tr", "yandex.com", "yandex.com.tr", "msn.com", "live.com", "proton.me", "protonmail.com", "zoho.com", "perainc.online", "mail.perainc.online", "unipulse.app", "lifeos.app", "komsucep.app"];
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain || !allowedDomains.includes(domain)) {
        setError('Sadece bilinen e-posta sağlayıcıları (gmail, icloud vb.) ve şirket maili kabul edilmektedir.');
        setLoading(false);
        return;
      }
      if (!username || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
        setError(t("Lütfen geçerli bir kullanıcı adı girin (Boşluksuz harf, rakam, alt çizgi)."));
        setLoading(false);
        return;
      }
      try {
        await register(email, password, name, username);
        setBasarili(true);
      } catch(err) {
        setError(err.message === "User already registered" ? t("Bu e-posta adresi zaten kayıtlı") : err.message);
      }
      setLoading(false)
      return
    }

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || t("Giriş başarısız."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    setError('')
    try {
      await loginAsDemo();
    } catch (err) {
      setError(t("Demo girişi yapılırken bir hata oluştu."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(t('auth.google_login_failed'));
  }

  function handleAppleLogin() {
    setInfo(t('Apple ile Giriş özelliği çok yakında eklenecektir.'));
  }

  if (basarili) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground" style={{ background: tokens.background, color: tokens.textPrimary }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">{t('Hesabınız Oluşturuldu!')}</h1>
          <p className="text-muted-foreground mb-4 opacity-80">{email} {t('adresine doğrulama e-postası gönderdik.')}</p>
          <Button className="mt-2 bg-blue-500 text-white rounded-[12px] h-12 px-8 font-semibold shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border-none" onClick={() => { setBasarili(false); setMode('login'); }}>{t('Giriş Yap')}</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden" style={{ background: tokens.background, color: tokens.textPrimary }}>
      
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/30 blur-[150px] dark:bg-blue-500/25" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-emerald-500/30 blur-[150px] dark:bg-emerald-400/25" />
        <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[150px] dark:bg-indigo-500/20" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/25 blur-[150px] dark:bg-emerald-500/20" />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden md:block" />

      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10 pointer-events-auto">
        <motion.a 
          href="/"
          onClick={(e) => e.preventDefault()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: isDark ? "rgba(37,99,235,0.1)" : "rgba(37,99,235,0.08)", 
            display: "flex", alignItems: "center", justifyContent: "center", color: tokens.primary
          }}>
            <GraduationCap size={24} />
          </div>
          <span className="text-[20px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70" style={{ letterSpacing: -0.5, color: tokens.textPrimary }}>UniPulse</span>
        </motion.a>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} title={t("Temayı değiştir")} style={{
            width: 36, height: 36, borderRadius: "9999px",
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", 
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
            color: tokens.textPrimary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
            backdropFilter: "blur(4px)",
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"; }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <LanguageToggle />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 p-8 z-10 pointer-events-auto hidden sm:block">
        <p className="text-[12px] font-normal tracking-wide opacity-50">
          {t("© 2026 UniPulse — Tüm Hakları Saklıdır")}
        </p>
      </div>

      <div className={`w-full px-6 z-10 relative mt-24 mb-10 md:mt-0 md:mb-0 transition-all duration-300 mx-auto ${mode === 'register' ? 'max-w-[600px]' : 'max-w-[512px]'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="backdrop-blur-[24px] backdrop-saturate-[180%] border shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] rounded-3xl px-10 py-7"
          style={{ background: isDark ? "rgba(15, 22, 35, 0.7)" : "rgba(255, 255, 255, 0.7)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
        >
          <div className="mb-5 text-center">
            {mode === 'forgot-password' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-5"
              >
                <Lock className="h-6 w-6" />
              </motion.div>
            )}

            <motion.h2 
              className={`text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent ${mode === 'register' ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' : 'bg-gradient-to-r from-emerald-400 to-blue-500'}`}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: '200% auto' }}
            >
              {mode === 'login' ? t('Hoş Geldiniz') : mode === 'register' ? t('Aramıza Katılın') : t('Şifremi Unuttum')}
            </motion.h2>

            <p className="text-[13px] font-medium mt-2 max-w-[340px] mx-auto leading-relaxed opacity-70">
              {mode === 'login'
                ? t('Kampüs hayatınızın dijital asistanı ile üretkenliğinizi zirveye taşıyın.')
                : mode === 'register' 
                  ? t("Öğrencilik hayatınızı kolaylaştıracak UniPulse'a hemen kayıt olun.")
                  : t('Şifrenizi sıfırlamak için e-posta adresinizi girin.')}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {mode !== 'forgot-password' && (
              <>
                <div className={`grid gap-3 ${mode === 'login' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {mode === 'login' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-[50px] transition-colors flex items-center justify-center overflow-hidden rounded-xl border"
                      onClick={handleDemoLogin}
                      disabled={loading}
                      title="Demo ile giriş yap"
                      aria-label="Demo ile giriş yap"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
                    >
                      <Sparkles size={24} className="text-blue-500" />
                    </Button>
                  )}
                  <div
                    className="relative w-full h-[50px] transition-colors flex items-center justify-center overflow-hidden rounded-xl border"
                    title="Google ile giriş yap"
                    aria-label="Google ile giriş yap"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      pointerEvents: loading ? "none" : "auto",
                    }}
                  >
                    <div ref={googleButtonRef} className="flex items-center justify-center" />
                    {!googleButtonAvailable && (
                      <Button
                        type="button"
                        variant="outline"
                        className="absolute inset-0 w-full h-full border-0 bg-transparent hover:bg-transparent"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        title="Google ile giriş yap"
                        aria-label="Google ile giriş yap"
                      >
                        <GoogleIcon size={24} />
                      </Button>
                    )}
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]" style={{ background: isDark ? "rgba(15,22,35,0.55)" : "rgba(255,255,255,0.55)" }}>
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-[50px] transition-colors flex items-center justify-center overflow-hidden rounded-xl border"
                    onClick={handleAppleLogin}
                    disabled={loading}
                    title="Apple ile giriş yap"
                    aria-label="Apple ile giriş yap"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
                  >
                    <AppleIcon size={24} />
                  </Button>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                  <span className="text-[11px] font-medium opacity-50">{t('veya')}</span>
                  <div className="h-px flex-1" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                </div>
              </>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {mode === 'register' && (
                  <motion.div
                    key="name-username-grid"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-3 overflow-hidden"
                  >
                    <div className="space-y-1 text-left">
                      <Label htmlFor="name" className="text-[12px] font-bold tracking-wide opacity-90">{t('Ad Soyad')}</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                        <Input
                          id="name"
                          placeholder={t('Ad Soyad')}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-12 text-[14px] transition-colors rounded-xl border"
                          required
                          autoComplete="name"
                          style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: tokens.textPrimary }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <Label htmlFor="username" className="text-[12px] font-bold tracking-wide opacity-90">{t('Kullanıcı Adı')}</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                        <Input
                          id="username"
                          placeholder={t('Kullanıcı Adı')}
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                          className="pl-10 h-12 text-[14px] transition-colors rounded-xl border"
                          required
                          autoComplete="username"
                          style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: tokens.textPrimary }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1 text-left">
                <Label htmlFor="email" className="text-[12px] font-bold tracking-wide opacity-90">
                  {mode === 'login' ? t('E-posta veya Kullanıcı Adı') : t('E-posta Adresiniz')}
                </Label>
                <div className="relative">
                  {mode === 'login' ? <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" /> : <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />}
                  <Input
                    id="email"
                    type={mode === 'register' ? 'email' : 'text'}
                    placeholder={mode === 'login' ? t('E-posta veya Kullanıcı Adı') : t('E-posta Adresiniz')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-[14px] transition-colors rounded-xl border"
                    required
                    autoComplete={mode === 'forgot-password' ? 'email' : 'username'}
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: tokens.textPrimary }}
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div className={mode === 'register' ? "grid grid-cols-2 gap-3" : "space-y-1 text-left"}>
                  <div className="space-y-1 text-left">
                    <Label htmlFor="password" className="text-[12px] font-bold tracking-wide opacity-90">{t('Şifreniz')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 text-[14px] transition-colors rounded-xl border"
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: tokens.textPrimary }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === 'login' && (
                      <div className="flex items-center justify-between pt-1.5 pb-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="rememberMe"
                            className="border-primary"
                            checked={rememberMe}
                            onCheckedChange={setRememberMe}
                          />
                          <Label htmlFor="rememberMe" onClick={() => setRememberMe(!rememberMe)} className="text-[11.5px] font-semibold tracking-wide opacity-80 cursor-pointer">
                            {t('Beni Hatırla')}
                          </Label>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setMode('forgot-password'); setError(''); setInfo(''); }} 
                          className="text-[13px] font-semibold text-blue-500 hover:text-blue-600 hover:underline focus-visible:outline-none rounded"
                        >
                          {t('Şifremi Unuttum')}
                        </button>
                      </div>
                    )}
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-1 text-left">
                      <Label htmlFor="confirmPassword" className="text-[12px] font-bold tracking-wide opacity-90">{t('Şifre Tekrar')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 h-12 text-[14px] transition-colors rounded-xl border"
                          required
                          autoComplete="new-password"
                          style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: tokens.textPrimary }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === 'register' && (
                <div className="flex items-start gap-2 mt-1">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      if (checked && (!agreedContracts.terms || !agreedContracts.kvkk)) {
                        alert(t("Önce Kullanım Koşulları ve KVKK metinlerini okuyup onaylamanız gerekmektedir."))
                        return
                      }
                      setTermsAccepted(checked)
                    }}
                    className="mt-0.5 border-primary"
                  />
                    <span className="text-xs opacity-70 mt-0.5 leading-snug text-left">
                      {t('Kayıt olarak')} <button type="button" onClick={() => setTermsModal('terms')} className="text-blue-500 hover:underline font-medium focus:outline-none">{t('Kullanım Koşulları')}</button>
                      {' '}{t('ve')} <button type="button" onClick={() => setTermsModal('kvkk')} className="text-blue-500 hover:underline font-medium focus:outline-none">{t('KVKK Aydınlatma Metni')}</button> {t('metinlerini kabul etmiş olursunuz.')}
                    </span>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-tight">{error}</p>
                </motion.div>
              )}

              {info && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-xs rounded-lg p-3"
                  style={{ background: `${tokens.primary}15`, color: tokens.primary, border: `1px solid ${tokens.primary}30` }}
                >
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-tight">{info}</p>
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 gap-2 font-bold text-[15px] shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-[12px] border-none" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : mode === 'login' ? <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /> : <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />}
                {mode === 'login' ? t('Giriş Yap') : mode === 'register' ? t('Kayıt Ol') : t('Şifremi Unuttum')}
              </Button>
            </form>

            <p className="text-center text-[12px] opacity-70 font-medium">
                  {mode === 'login' ? t('Hesabınız yok mu?') : mode === 'register' ? t('Zaten hesabınız var mı?') : t('Zaten hesabınız var mı?')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login')
                      setError('')
                      setInfo('')
                    }}
                    className="text-blue-500 hover:underline focus:outline-none font-bold tracking-wide"
                  >
                    {mode === 'login' ? t('Ücretsiz Kayıt Ol') : t('Giriş Yap')}
                  </button>
            </p>

            <div className="-mt-1 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-medium opacity-80 whitespace-nowrap">
                <ShieldCheck className="h-4 w-4 opacity-70 shrink-0" />
                <span>{t('Verileriniz 256-bit SSL şifreleme ile korunur.')}</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Mobile-only Footer */}
        <div className="mt-3 sm:hidden pb-6">
          <div className="text-center text-[10px] font-medium opacity-60 tracking-wide uppercase">
            {t("© 2026 UniPulse — Tüm Hakları Saklıdır")}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {termsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTermsModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[80vh] mx-4 border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ background: isDark ? "#0f1623" : "#fff", color: tokens.textPrimary, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            >
              <div className="flex justify-between items-center px-6 pt-6 pb-4">
                <h2 className="text-lg font-bold">
                  {termsModal === 'terms' ? t('Kullanım Koşulları') : t('KVKK Aydınlatma Metni')}
                </h2>
                <button onClick={() => setTermsModal(null)} className="opacity-50 hover:opacity-100 transition-opacity text-lg">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-2 text-sm opacity-80 leading-relaxed space-y-4 text-left">
                {termsModal === 'terms' ? (
                  <>
                    <div><h3 className="font-semibold mb-1 opacity-100">{t('1. Genel Koşullar')}</h3><p>{t('Platformumuza kayıt olarak kullanım koşullarını kabul etmiş sayılırsınız.')}</p></div>
                    <div><h3 className="font-semibold mb-1 opacity-100">{t('2. Hesap Güvenliği')}</h3><p>{t('Şifrenizi kimseyle paylaşmayınız.')}</p></div>
                  </>
                ) : (
                  <>
                    <div><h3 className="font-semibold mb-1 opacity-100">{t('Veri Sorumlusu')}</h3><p>{t('Kişisel verilerinizin korunmasına büyük önem veriyoruz.')}</p></div>
                  </>
                )}
              </div>
              <div className="px-6 pb-6 pt-4 flex gap-3">
                <Button 
                  onClick={() => {
                    setAgreedContracts(prev => {
                      const next = { ...prev, [termsModal]: false }
                      setTermsAccepted(false)
                      return next
                    })
                    setTermsModal(null)
                  }} 
                  variant="outline"
                  className="flex-1 h-11"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: "none", color: tokens.textPrimary }}
                >
                  {t('Vazgeç')}
                </Button>
                <Button 
                  onClick={() => {
                    setAgreedContracts(prev => {
                      const next = { ...prev, [termsModal]: true }
                      if (next.terms && next.kvkk) {
                        setTermsAccepted(true)
                      }
                      return next
                    })
                    setTermsModal(null)
                  }} 
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold border-none"
                >
                  {t('Onaylıyorum')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
