import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { displayProfileName, profileInitial } from "../../utils/profileDisplay";
export default function AdminSettings({ showToast }) {
  const { t } = useI18n();
  const { tokens } = useTheme();
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

  return (
    <div className="w-full">
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
              <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{displayProfileName(profile, "—")}</span>
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
                  {profileInitial(a)}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{displayProfileName(a, "—")}</div>
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
