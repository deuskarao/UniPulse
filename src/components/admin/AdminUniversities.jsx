import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUniversities() {
  const { tokens } = useTheme();
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyDepartments, setFacultyDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [uniRes, facRes, deptRes, fdRes] = await Promise.all([
        supabase.from("universities").select("*").order("ad"),
        supabase.from("faculties").select("*").order("ad"),
        supabase.from("departments").select("*, department_courses(count)").order("ad"),
        supabase.from("faculty_departments").select("*"),
      ]);
      if (uniRes.data) setUniversities(uniRes.data);
      if (facRes.data) setFaculties(facRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (fdRes.data) setFacultyDepartments(fdRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const getFacultiesForUni = (uniId) => faculties.filter(f => f.university_id === uniId);
  const getDeptsForFaculty = (facId) => {
    const deptIds = facultyDepartments.filter(fd => fd.faculty_id === facId).map(fd => fd.department_id);
    return departments.filter(d => deptIds.includes(d.id));
  };

  const selectedFaculties = selectedUni ? getFacultiesForUni(selectedUni.id) : [];
  const selectedDepts = selectedFaculty ? getDeptsForFaculty(selectedFaculty.id) : [];

  const totalDepts = departments.length;

  const goBack = () => {
    if (selectedFaculty) {
      setSelectedFaculty(null);
    } else if (selectedUni) {
      setSelectedUni(null);
    }
  };

  return (
    <div>
      {/* Üniversite Başlık Kartı */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl overflow-hidden mb-6"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, background: tokens.primary + "18", fontSize: 32 }}
            >
              🏛️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.textPrimary }}>{t("admin.universities")}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: tokens.muted }}>{t("admin.uni_hierarchy")}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-5">
            {[
              { label: "Üniversite", value: universities.length, color: tokens.primary },
              { label: "Fakülte", value: faculties.length, color: tokens.success },
              { label: "Bölüm", value: totalDepts, color: "#3B82F6" },
            ].map((s, i) => (
              <div key={i} className="flex-1 rounded-xl p-3 text-center" style={{ background: tokens.surface }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Geri Butonu */}
      {(selectedUni || selectedFaculty) && (
        <button
          onClick={goBack}
          className="flex items-center gap-2 mb-5 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: tokens.primary + "15", border: `1px solid ${tokens.primary + "30"}`, color: tokens.primary, cursor: "pointer" }}
        >
          ← Geri
        </button>
      )}

      {/* Başlık */}
      <h3 className="mb-4" style={{ fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>
        {!selectedUni
          ? "Üniversiteler"
          : !selectedFaculty
            ? `${selectedUni.ad} — Fakülteleri (${selectedFaculties.length})`
            : `${selectedFaculty.ad} — Bölümleri (${selectedDepts.length})`
        }
      </h3>

      {/* İçerik */}
      <AnimatePresence mode="wait">
        {!selectedUni ? (
          /* Üniversite Kartları */
          <motion.div key="unis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: tokens.card, border: `1px solid ${tokens.border}`, height: 140 }} />
                ))
              : universities.map((u, i) => {
                  const uniFaculties = getFacultiesForUni(u.id);
                  const deptCount = uniFaculties.reduce((sum, f) => sum + getDeptsForFaculty(f.id).length, 0);
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                      style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
                      onClick={() => setSelectedUni(u)}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadowMd; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="flex items-center justify-center rounded-xl"
                          style={{ width: 44, height: 44, background: (u.renk || tokens.primary) + "18", fontSize: 22 }}
                        >
                          {u.emoji || "🏛️"}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{u.ad}</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 rounded-lg p-2 text-center" style={{ background: tokens.surface }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.primary }}>{uniFaculties.length}</div>
                          <div style={{ fontSize: 9, color: tokens.muted, fontWeight: 600, textTransform: "uppercase" }}>{t("admin.faculty")}</div>
                        </div>
                        <div className="flex-1 rounded-lg p-2 text-center" style={{ background: tokens.surface }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.success }}>{deptCount}</div>
                          <div style={{ fontSize: 9, color: tokens.muted, fontWeight: 600, textTransform: "uppercase" }}>{t("admin.department")}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
          </motion.div>
        ) : !selectedFaculty ? (
          /* Fakülte Kartları */
          <motion.div key="facs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {selectedFaculties.length === 0 ? (
              <div className="col-span-full text-center py-12" style={{ color: tokens.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🏛️</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t("admin.no_faculty")}</div>
              </div>
            ) : selectedFaculties.map((f, i) => {
              const depts = getDeptsForFaculty(f.id);
              const courseCount = depts.reduce((sum, d) => sum + (d.department_courses?.[0]?.count || 0), 0);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                  style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
                  onClick={() => setSelectedFaculty(f)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadowMd; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{ width: 44, height: 44, background: (f.renk || tokens.primary) + "18", fontSize: 22 }}
                    >
                      {f.emoji || "🏛️"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{f.ad}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-lg p-2 text-center" style={{ background: tokens.surface }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: tokens.primary }}>{depts.length}</div>
                      <div style={{ fontSize: 9, color: tokens.muted, fontWeight: 600, textTransform: "uppercase" }}>{t("admin.department")}</div>
                    </div>
                    <div className="flex-1 rounded-lg p-2 text-center" style={{ background: tokens.surface }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: tokens.success }}>{courseCount}</div>
                      <div style={{ fontSize: 9, color: tokens.muted, fontWeight: 600, textTransform: "uppercase" }}>Ders</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Bölüm Kartları */
          <motion.div key="depts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {selectedDepts.length === 0 ? (
              <div className="col-span-full text-center py-12" style={{ color: tokens.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📚</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t("admin.no_department")}</div>
              </div>
            ) : selectedDepts.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="rounded-xl p-4 transition-all duration-200"
                style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadowMd; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 40, height: 40, background: (d.renk || tokens.primary) + "18", fontSize: 20 }}
                  >
                    {d.ikon || "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.ad}</div>
                    <div style={{ fontSize: 11, color: tokens.muted }}>{d.department_courses?.[0]?.count || 0} ders · {d.toplam_kredi} kredi · {d.toplam_donem} dönem</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
