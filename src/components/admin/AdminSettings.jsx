import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export default function AdminSettings({ showToast }) {
  const { t, language, setLanguage } = useI18n();
  const { tokens, mode, setMode } = useTheme();
  const { user, profile } = useAuth();
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("role", "admin");
      if (data) setAdminProfiles(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleThemeChange(newMode) {
    setMode(newMode);
    try {
      await supabase.from("profiles").update({ theme_preference: newMode }).eq("id", user.id);
      showToast(t("admin.theme_saved"));
    } catch (e) {
      console.error("Theme save error:", e);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
        >
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tokens.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.theme_preference")}</h3>
            <p style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>Tema tercihiniz veritabanında saklanır ve tüm oturumlarda senkronize edilir.</p>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <div className="flex gap-3 h-full">
              {[
                { id: "dark", label: t("admin.theme_dark") || "Karanlık", icon: "🌙" },
                { id: "light", label: t("admin.theme_light") || "Aydınlık", icon: "☀️" },
                { id: "system", label: t("admin.theme_system") || "Sistem", icon: "💻" },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="flex-1 rounded-xl p-3 text-center transition-all duration-200 flex flex-col items-center justify-center"
                  style={{
                    background: mode === theme.id ? tokens.primary + "15" : tokens.surface,
                    border: `2px solid ${mode === theme.id ? tokens.primary : tokens.border}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{theme.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: mode === theme.id ? tokens.primary : tokens.textPrimary }}>{theme.label}</div>
                  {mode === theme.id && (
                    <div className="flex items-center gap-1 mt-2" style={{ fontSize: 10, color: tokens.primary, fontWeight: 700 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Aktif
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
        >
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tokens.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary }}>Dil Tercihi</h3>
            <p style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>Arayüz dilini değiştirebilirsiniz. Değişiklik anında uygulanır.</p>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3 h-full">
              {[
                { id: "tr", label: "Türkçe", icon: "🇹🇷" },
                { id: "en", label: "English", icon: "🇬🇧" },
                { id: "es", label: "Español", icon: "🇪🇸" },
                { id: "it", label: "Italiano", icon: "🇮🇹" },
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className="rounded-xl p-3 text-center transition-all duration-200 flex flex-col items-center justify-center"
                  style={{
                    background: language === lang.id ? tokens.primary + "15" : tokens.surface,
                    border: `2px solid ${language === lang.id ? tokens.primary : tokens.border}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{lang.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: language === lang.id ? tokens.primary : tokens.textPrimary }}>{lang.label}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl overflow-hidden mb-6"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tokens.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.admin_account")}</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <span style={{ fontSize: 12, color: tokens.muted }}>{t("admin.full_name")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{profile?.full_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <span style={{ fontSize: 12, color: tokens.muted }}>{t("admin.email")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{user?.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <span style={{ fontSize: 12, color: tokens.muted }}>{t("admin.role")}</span>
              <span className="inline-flex items-center rounded px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, background: tokens.primary + "20", color: tokens.primary }}>Admin</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span style={{ fontSize: 12, color: tokens.muted }}>{t("admin.register_date")}</span>
              <span style={{ fontSize: 13, color: tokens.textPrimary }}>{new Date(profile?.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tokens.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.admin_users_title")}</h3>
          <p style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>{t("admin.admin_users_desc")}</p>
        </div>
        <div>
          {loading ? (
            <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 13 }}>{t("admin.loading")}</div>
          ) : adminProfiles.length === 0 ? (
            <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 13 }}>{t("admin.no_admin_found")}</div>
          ) : (
            adminProfiles.map((a, i) => (
              <div
                key={a.id}
                className="flex items-center gap-3 px-6 py-3 transition-colors duration-150"
                style={{ borderBottom: i < adminProfiles.length - 1 ? `1px solid ${tokens.border}` : "none" }}
                onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width: 36, height: 36, background: tokens.primary + "20", color: tokens.primary, fontWeight: 700, fontSize: 13 }}
                >
                  {a.full_name?.[0] || a.email?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{a.full_name || "—"}</div>
                  <div style={{ fontSize: 11, color: tokens.muted }}>{a.email}</div>
                </div>
                <span className="inline-flex items-center rounded px-2 py-0.5" style={{ fontSize: 10, fontWeight: 700, background: tokens.primary + "20", color: tokens.primary }}>ADMIN</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
