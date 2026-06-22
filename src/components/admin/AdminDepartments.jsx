import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export default function AdminDepartments() {
  const { tokens } = useTheme();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data } = await supabase
        .from("departments")
        .select("*, department_courses(count), faculty_departments(*, faculties!inner(ad, emoji))")
        .order("ad");
      if (data) setDepartments(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filtered = departments.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.ad.toLowerCase().includes(q) || d.slug?.toLowerCase().includes(q);
  });

  const totalCourses = departments.reduce((sum, d) => sum + (d.department_courses?.[0]?.count || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Toplam Bölüm", value: departments.length, color: tokens.primary },
          { label: "Toplam Ders", value: totalCourses, color: tokens.success },
          { label: "Fakülte Sayısı", value: [...new Set(departments.flatMap(d => d.faculty_departments?.map(fd => fd.faculties?.ad)).filter(Boolean))].length, color: "#3B82F6" },
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

      <div className="mb-5">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ background: tokens.input, border: `1px solid ${tokens.border}`, maxWidth: 320 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Bölüm ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: tokens.textPrimary, border: "none" }}
          />
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        {loading ? (
          <div className="text-center py-16" style={{ color: tokens.muted }}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: tokens.muted }}>Bölüm bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: tokens.sidebarHover }}>
                  {["Bölüm", "Kod", "Fakülte", "Ders", "Kredi", "Dönem"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "center", fontSize: 10, fontWeight: 700, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${tokens.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? tokens.surface : "transparent" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? tokens.surface : "transparent"}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 36, height: 36, background: (d.renk || tokens.primary) + "18", fontSize: 18 }}
                        >
                          {d.ikon || "📚"}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{d.ad}</div>
                          <div style={{ fontSize: 10, color: tokens.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.aciklama || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span className="inline-flex items-center justify-center rounded px-2 py-0.5" style={{ fontSize: 10, fontWeight: 700, background: tokens.primary + "18", color: tokens.primary, letterSpacing: 0.5 }}>
                        {d.slug}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, color: tokens.textSecondary }}>
                      {d.faculty_departments?.[0]?.faculties?.ad || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 14, fontWeight: 700, color: tokens.primary }}>
                      {d.department_courses?.[0]?.count || 0}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                      {d.toplam_kredi}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: tokens.textSecondary }}>
                      {d.toplam_donem}
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
