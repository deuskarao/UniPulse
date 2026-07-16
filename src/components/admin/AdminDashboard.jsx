import { useI18n } from "../../context/I18nContext";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

const MetricCard = ({ icon, label, value, change, color, delay }) => {
  const { tokens } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl p-5 transition-all duration-200"
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        boxShadow: tokens.shadowSm,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadowMd; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = tokens.shadowSm; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {label}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span style={{ fontSize: 28, fontWeight: 800, color: tokens.textPrimary, lineHeight: 1 }}>{value}</span>
            {change !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: change >= 0 ? tokens.success : tokens.danger,
                  background: change >= 0 ? tokens.successLight : tokens.dangerLight,
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {change >= 0 ? "+" : ""}{change}%
              </span>
            )}
          </div>
        </div>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            background: color + "18",
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminDashboard({ users, onUserSelect }) {
  const { t } = useI18n();
  const { tokens } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [totalUsers, activeUsers, newUsers, admins, blockedUsers, totalApps] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").eq("is_online", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").eq("is_allowed", false),
        supabase.from("student_grades").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: totalUsers.count || 0,
        activeUsers: activeUsers.count || 0,
        newUsers: newUsers.count || 0,
        adminCount: admins.count || 0,
        blockedUsers: blockedUsers.count || 0,
        totalApplications: totalApps.count || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users]
      .filter(u => u.role !== "admin")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  }, [users]);

  const metricCards = stats ? [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: t("admin.total_users"), value: stats.totalUsers, color: tokens.primary },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, label: t("admin.active_users"), value: stats.activeUsers, color: tokens.success },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>, label: t("admin.new_users_7d"), value: stats.newUsers, color: "#3B82F6" },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: t("admin.admin_count"), value: stats.adminCount, color: "#8B5CF6" },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, label: t("admin.blocked_users"), value: stats.blockedUsers, color: tokens.danger },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: t("admin.total_applications"), value: stats.totalApplications, color: "#F59E0B" },
  ] : [];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-5 animate-pulse"
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, height: 110 }}
              >
                <div className="rounded" style={{ background: tokens.border, height: 12, width: "60%", marginBottom: 12 }} />
                <div className="rounded" style={{ background: tokens.border, height: 28, width: "40%" }} />
              </div>
            ))
          : metricCards.map((card, i) => <MetricCard key={i} {...card} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.recent_users")}</span>
            <button
              onClick={() => onUserSelect?.(null)}
              style={{ fontSize: 12, color: tokens.primary, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Tümünü Gör →
            </button>
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {recentUsers.length === 0 ? (
              <div className="text-center py-10" style={{ color: tokens.muted, fontSize: 13 }}>{t("admin.no_users_yet")}</div>
            ) : (
              recentUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => onUserSelect?.(u)}
                  className="w-full flex items-center gap-3 text-left transition-colors duration-150"
                  style={{
                    padding: "12px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${tokens.border}`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      background: tokens.primary + "20",
                      color: tokens.primary,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {u.full_name?.[0] || u.email?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.full_name || t("admin.anonymous")}
                    </div>
                    <div style={{ fontSize: 11, color: tokens.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.department_name ? `📚 ${u.department_name}` : u.email}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div style={{ fontSize: 10, color: tokens.muted }}>
                      {new Date(u.created_at).toLocaleDateString("tr-TR")}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: u.is_allowed === false ? tokens.danger : tokens.success,
                      }}
                    >
                      {u.is_allowed === false ? t("admin.status_blocked") : t("admin.status_active")}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="rounded-xl overflow-hidden"
          style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>Dağılım</span>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-4">
              {stats && [
                { label: t("admin.active_users"), value: stats.activeUsers, total: stats.totalUsers, color: tokens.success },
                { label: t("admin.blocked_users"), value: stats.blockedUsers, total: stats.totalUsers, color: tokens.danger },
                { label: t("admin.registrations_7d"), value: stats.newUsers, total: stats.totalUsers, color: "#3B82F6" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 12, fontWeight: 600, color: tokens.textSecondary }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tokens.textPrimary }}>
                      {item.value} / {item.total}
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: tokens.border }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                      className="rounded-full"
                      style={{ height: "100%", background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
