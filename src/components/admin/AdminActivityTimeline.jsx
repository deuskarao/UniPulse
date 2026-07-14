import { useI18n } from "../../context/I18nContext";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

const ACTION_ICONS = {
  login: { icon: "🔑", color: "#22C55E" },
  logout: { icon: "🚪", color: "#94A3B8" },
  user_updated: { icon: "✏️", color: "#3B82F6" },
  user_blocked: { icon: "🔒", color: "#EF4444" },
  user_unblocked: { icon: "🔓", color: "#22C55E" },
  user_deleted: { icon: "🗑️", color: "#EF4444" },
  role_changed: { icon: "👤", color: "#8B5CF6" },
  note_added: { icon: "📝", color: "#F59E0B" },
  note_deleted: { icon: "🗑️", color: "#EF4444" },
  grade_updated: { icon: "📊", color: "#3B82F6" },
  profile_updated: { icon: "✏️", color: "#3B82F6" },
};

const ACTION_LABELS = {
  login: "Giriş yaptı",
  logout: "Çıkış yaptı",
  user_updated: "Kullanıcı güncellendi",
  user_blocked: "Kullanıcı engellendi",
  user_unblocked: "Kullanıcı engeli kaldırıldı",
  user_deleted: "Kullanıcı silindi",
  role_changed: "Rol değiştirildi",
  note_added: "Not eklendi",
  note_deleted: "Not silindi",
  grade_updated: "Not güncellendi",
  profile_updated: "Profil güncellendi",
};

export default function AdminActivityTimeline({ userId, isFullPage }) {
  const { tokens } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    let query = supabase
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(full_name, email)")
      .gte("created_at", threeDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(isFullPage ? 50 : 10);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (!error && data) setActivities(data);
    setLoading(false);
  }, [userId, isFullPage]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}` }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
          {isFullPage ? "Tüm Aktivite Logları" : "Son Aktiviteler"}
        </span>
        <button
          onClick={fetchActivities}
          className="rounded px-2 py-1 text-xs"
          style={{ background: "transparent", border: "none", color: tokens.primary, cursor: "pointer", fontWeight: 600 }}
        >
          Yenile
        </button>
      </div>

      <div style={{ maxHeight: isFullPage ? "calc(100vh - 200px)" : 320, overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>{t("admin.loading")}</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>{t("admin.no_activity_found")}</div>
        ) : (
          activities.map((a, i) => {
            const actionInfo = ACTION_ICONS[a.action] || { icon: "📋", color: "#94A3B8" };
            const label = ACTION_LABELS[a.action] || a.action;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="flex gap-3 transition-colors duration-150"
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${tokens.border}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="flex-shrink-0 relative">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 32,
                      height: 32,
                      background: actionInfo.color + "18",
                      fontSize: 14,
                    }}
                  >
                    {actionInfo.icon}
                  </div>
                  {i < activities.length - 1 && (
                    <div
                      className="absolute"
                      style={{
                        left: 15,
                        top: 36,
                        width: 2,
                        height: "calc(100% + 8px)",
                        background: tokens.border,
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, color: tokens.textPrimary, fontWeight: 500 }}>
                    {label}
                  </div>
                  {isFullPage && a.profiles && (
                    <div style={{ fontSize: 11, color: tokens.muted, marginTop: 2 }}>
                      {a.profiles.full_name || a.profiles.email}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: tokens.muted, marginTop: 2 }}>
                    {new Date(a.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
