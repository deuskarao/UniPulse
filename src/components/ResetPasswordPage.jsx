import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../context/I18nContext';
import { Lock, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Button = ({ className = '', ...props }) => (
  <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props} />
);

const Input = ({ className = '', ...props }) => (
  <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Label = ({ className = '', ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
);

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { resolvedMode, tokens } = useTheme();
  const isDark = resolvedMode === "dark";
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t('Şifreler eşleşmiyor.'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('Şifre en az 6 karakter olmalıdır.'));
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err.message || t("Şifre güncellenirken bir hata oluştu."));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground" style={{ background: tokens.background, color: tokens.textPrimary }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">{t('Şifreniz Güncellendi!')}</h1>
          <p className="text-muted-foreground mb-4 opacity-80">{t('Ana sayfaya yönlendiriliyorsunuz...')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden" style={{ background: tokens.background, color: tokens.textPrimary }}>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/30 blur-[150px] dark:bg-blue-500/25" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-emerald-500/30 blur-[150px] dark:bg-emerald-400/25" />
      </div>

      <div className="w-full px-6 z-10 relative max-w-[512px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-[24px] border shadow-2xl rounded-3xl px-10 py-7"
          style={{ background: isDark ? "rgba(15, 22, 35, 0.7)" : "rgba(255, 255, 255, 0.7)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
        >
          <div className="mb-5 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
              {t('Yeni Şifre Belirleyin')}
            </h2>
            <p className="text-[13px] font-medium mt-2 max-w-[340px] mx-auto leading-relaxed opacity-70">
              {t('Hesabınız için yeni bir şifre girin.')}
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="space-y-1 text-left">
              <Label htmlFor="password" className="text-[12px] font-bold tracking-wide opacity-90">{t('Yeni Şifre')}</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-[14px] transition-colors rounded-xl border"
                  required
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
            </div>

            <div className="space-y-1 text-left">
              <Label htmlFor="confirmPassword" className="text-[12px] font-bold tracking-wide opacity-90">{t('Yeni Şifre (Tekrar)')}</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-[14px] transition-colors rounded-xl border"
                  required
                  style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: tokens.textPrimary }}
                />
              </div>
            </div>

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

            <Button 
              type="submit" 
              className="w-full h-12 mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-[12px]" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('Şifreyi Güncelle')}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
