import { useI18n } from "../../context/I18nContext";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export default function AdminApplications({ onUserSelect }) {
  const { tokens } = useTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_grades")
      .select("*, profiles!student_grades_user_id_fkey(id, full_name, email, department_id), department_courses!inner(ad, kredi, donem, department_id, departments!inner(ad))")
      .order("created_at", { ascending: false });
    if (!error && data) setApplications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApps = applications.filter(a => {
    if (filter === "graded") return a.harf_notu != null;
    if (filter === "pending") return a.harf_notu == null;
    return true;
  });

  const stats = {
    total: applications.length,
    graded: applications.filter(a => a.harf_notu != null).length,
    pending: applications.filter(a => a.harf_notu == null).length,
    departments: [...new Set(applications.map(a => a.department_courses?.departments?.ad).filter(Boolean))].length,
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("admin.total_applications"), value: stats.total, color: tokens.primary },
          { label: t("admin.graded"), value: stats.graded, color: tokens.success },
          { label: t("admin.pending"), value: stats.pending, color: tokens.warning },
          { label: t("admin.department_count"), value: stats.departments, color: "#3B82F6" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-xl p-5"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: tokens.textPrimary, marginTop: 8 }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        {["all", "graded", "pending"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              background: filter === f ? tokens.primary + "20" : "transparent",
              color: filter === f ? tokens.primary : tokens.muted,
              border: `1px solid ${filter === f ? tokens.primary + "40" : tokens.border}`,
              cursor: "pointer",
            }}
          >
            {f === "all" ? "Tümü" : f === "graded" ? t("admin.graded") : t("admin.pending")}
          </button>
        ))}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        {loading ? (
          <div className="text-center py-16" style={{ color: tokens.muted }}>{t("admin.loading")}</div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16" style={{ color: tokens.muted }}>{t("admin.no_applications")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: tokens.sidebarHover }}>
                  {["Kullanıcı", "Bölüm", "Ders", "Dönem", "Kredi", "Vize", "Ödev", "Proje", "Final", "Harf", "Tarih"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "center", fontSize: 10, fontWeight: 700, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${tokens.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApps.slice(0, 50).map((a, i) => (
                  <tr
                    key={a.id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? tokens.surface : "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? tokens.surface : "transparent"}
                    onClick={() => a.profiles && onUserSelect?.(a.profiles)}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{ width: 32, height: 32, background: tokens.primary + "20", color: tokens.primary, fontWeight: 700, fontSize: 12 }}
                        >
                          {a.profiles?.full_name?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{a.profiles?.full_name || "—"}</div>
                          <div style={{ fontSize: 10, color: tokens.muted }}>{a.profiles?.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, color: tokens.textSecondary }}>{a.department_courses?.departments?.ad || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{a.department_courses?.ad || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span className="inline-flex items-center justify-center rounded" style={{ width: 28, height: 28, background: tokens.primary + "20", color: tokens.primary, fontSize: 11, fontWeight: 700 }}>
                        {a.department_courses?.donem}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: tokens.primary, fontWeight: 700, fontSize: 13 }}>{a.department_courses?.kredi}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{a.vize || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{a.odev || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{a.proje || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{a.final || "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span
                        className="inline-flex items-center justify-center rounded px-2 py-0.5"
                        style={{
                          fontSize: 12, fontWeight: 800,
                          background: a.harf_notu ? (["FF", "DZ"].includes(a.harf_notu) ? tokens.dangerLight : tokens.successLight) : tokens.surface,
                          color: a.harf_notu ? (["FF", "DZ"].includes(a.harf_notu) ? tokens.danger : tokens.success) : tokens.muted,
                        }}
                      >
                        {a.harf_notu || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 11, color: tokens.muted }}>
                      {new Date(a.created_at).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
