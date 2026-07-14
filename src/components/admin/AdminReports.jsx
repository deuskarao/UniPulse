import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export default function AdminReports() {
  const { tokens } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalGrades: 0,
    avgGano: 0,
    totalCourses: 0,
    facultyCount: 0,
    deptCount: 0,
  });
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [topDepartments, setTopDepartments] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [usersRes, gradesRes, facRes, deptRes, coursesRes] = await Promise.all([
        supabase.from("profiles").select("id, is_allowed, created_at"),
        supabase.from("student_grades").select("*, harf_notlari(harf, katsayi)"),
        supabase.from("faculties").select("id"),
        supabase.from("departments").select("id"),
        supabase.from("department_courses").select("id"),
      ]);

      const users = usersRes.data || [];
      const grades = gradesRes.data || [];

      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.is_allowed).length;
      const blockedUsers = users.filter(u => !u.is_allowed).length;

      const ganoValues = grades
        .filter(g => g.harf_notlari?.katsayi != null && g.harf_notlari.katsayi > 0)
        .map(g => g.harf_notlari.katsayi);
      const avgGano = ganoValues.length > 0
        ? (ganoValues.reduce((a, b) => a + b, 0) / ganoValues.length).toFixed(2)
        : 0;

      const gradeDist = {};
      grades.forEach(g => {
        const harf = g.harf_notlari?.harf || "—";
        gradeDist[harf] = (gradeDist[harf] || 0) + 1;
      });
      const dist = Object.entries(gradeDist)
        .map(([harf, count]) => ({ harf, count }))
        .sort((a, b) => b.count - a.count);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentUsers = users
        .filter(u => u.created_at >= sevenDaysAgo)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalUsers,
        activeUsers,
        blockedUsers,
        totalGrades: grades.length,
        avgGano,
        totalCourses: coursesRes.data?.length || 0,
        facultyCount: facRes.data?.length || 0,
        deptCount: deptRes.data?.length || 0,
      });
      setGradeDistribution(dist);
      setRecentUsers(recentUsers);
      setLoading(false);
    }
    load();
  }, []);

  const maxGradeCount = Math.max(...gradeDistribution.map(g => g.count), 1);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h3 className="mb-5" style={{ fontSize: 18, fontWeight: 800, color: tokens.textPrimary }}>{t("admin.system_reports")}</h3>

        {/* Genel İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: t("admin.total_users"), value: stats.totalUsers, color: tokens.primary },
            { label: t("admin.active_users"), value: stats.activeUsers, color: tokens.success },
            { label: t("admin.blocked"), value: stats.blockedUsers, color: tokens.danger },
            { label: t("admin.total_grades"), value: stats.totalGrades, color: "#3B82F6" },
            { label: t("admin.avg_gpa"), value: stats.avgGano, color: "#8B5CF6" },
            { label: t("admin.total_courses"), value: stats.totalCourses, color: "#F59E0B" },
            { label: t("admin.faculty"), value: stats.facultyCount, color: "#EC4899" },
            { label: t("admin.department"), value: stats.deptCount, color: "#14B8A6" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-xl p-4 text-center"
              style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Harf Notu Dağılımı */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-xl p-5"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
          >
            <div className="mb-4" style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.grade_distribution")}</div>
            {gradeDistribution.length === 0 ? (
              <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>{t("admin.no_grade_records")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {gradeDistribution.slice(0, 8).map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ width: 32, fontSize: 12, fontWeight: 700, color: tokens.textPrimary }}>{g.harf}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 20, background: tokens.surface }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(g.count / maxGradeCount) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="rounded-full h-full"
                        style={{ background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.primary}cc)` }}
                      />
                    </div>
                    <span style={{ width: 36, textAlign: "right", fontSize: 12, fontWeight: 600, color: tokens.textSecondary }}>{g.count}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Son Kayıt Olan Kullanıcılar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="rounded-xl p-5"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
          >
            <div className="mb-4" style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.new_users_7d_chart")}</div>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>{t("admin.no_new_users_7d")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentUsers.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-2" style={{ background: tokens.surface }}>
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{ width: 32, height: 32, background: tokens.primary + "20", color: tokens.primary, fontWeight: 700, fontSize: 12 }}
                    >
                      {u.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                      <div style={{ fontSize: 10, color: tokens.muted }}>
                        {new Date(u.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
