import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function DepartmentSelector({ onSelect, initialValue = null, tokens }) {
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
        supabase.from("departments").select("*").order("ad"),
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

  useEffect(() => {
    if (initialValue) {
      const uni = universities.find(u => u.id === initialValue.university_id);
      if (uni) setSelectedUni(uni);
      const fac = faculties.find(f => f.id === initialValue.faculty_id);
      if (fac) setSelectedFaculty(fac);
    }
  }, [initialValue, universities, faculties]);

  const getFacultiesForUni = (uniId) => faculties.filter(f => f.university_id === uniId);
  const getDeptsForFaculty = (facId) => {
    const deptIds = facultyDepartments.filter(fd => fd.faculty_id === facId).map(fd => fd.department_id);
    return departments.filter(d => deptIds.includes(d.id));
  };

  const selectedDepts = selectedFaculty ? getDeptsForFaculty(selectedFaculty.id) : [];

  const goBack = () => {
    if (selectedFaculty) {
      setSelectedFaculty(null);
    } else if (selectedUni) {
      setSelectedUni(null);
    }
  };

  const getDisplayName = () => {
    if (selectedFaculty) return selectedFaculty.ad;
    if (selectedUni) return selectedUni.ad;
    return "Üniversite → Fakülte → Bölüm";
  };

  const getSelectedDepartment = () => {
    if (selectedFaculty && selectedDepts.length === 1) return selectedDepts[0];
    return null;
  };

  useEffect(() => {
    const dept = getSelectedDepartment();
    if (dept) onSelect(dept.id);
  }, [selectedFaculty, departments, facultyDepartments, onSelect]);

  if (loading) {
    return (
      <div className="rounded-xl p-6" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
        <div className="text-center py-8" style={{ color: tokens.muted }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Bölüm Seçimi</div>
          <div style={{ fontSize: 11, color: tokens.muted }}>{getDisplayName()}</div>
        </div>
        {(selectedUni || selectedFaculty) && (
          <button
            onClick={goBack}
            className="rounded-lg px-2 py-1 text-xs font-semibold"
            style={{ background: tokens.primary + "15", border: `1px solid ${tokens.primary + "30"}`, color: tokens.primary, cursor: "pointer" }}
          >
            ← Geri
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedUni ? (
          <motion.div key="unis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {universities.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}
                onClick={() => setSelectedUni(u)}
                onMouseEnter={(e) => { e.currentTarget.style.background = tokens.primary + "20"; e.currentTarget.style.borderColor = tokens.primary + "50"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = tokens.surface; e.currentTarget.style.borderColor = tokens.border; }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 36, height: 36, background: (u.renk || tokens.primary) + "18", fontSize: 18 }}
                  >
                    {u.emoji || "🏛️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.ad}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : !selectedFaculty ? (
          <motion.div key="facs" initial={{ opacity: 0 }} animate{{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {getFacultiesForUni(selectedUni.id).length === 0 ? (
              <div className="col-span-full text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>Bu üniversiteye bağlı fakülte bulunamadı</div>
            ) : getFacultiesForUni(selectedUni.id).map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}
                onClick={() => setSelectedFaculty(f)}
                onMouseEnter={(e) => { e.currentTarget.style.background = tokens.primary + "20"; e.currentTarget.style.borderColor = tokens.primary + "50"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = tokens.surface; e.currentTarget.style.borderColor = tokens.border; }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 36, height: 36, background: (f.renk || tokens.primary) + "18", fontSize: 18 }}
                  >
                    {f.emoji || "🏛️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.ad}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="depts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDepts.length === 0 ? (
              <div className="col-span-full text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>Bu fakülteye bağlı bölüm bulunamadı</div>
            ) : selectedDepts.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}
                onClick={() => onSelect(d.id)}
                onMouseEnter={(e) => { e.currentTarget.style.background = tokens.success + "20"; e.currentTarget.style.borderColor = tokens.success + "50"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = tokens.surface; e.currentTarget.style.borderColor = tokens.border; }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 36, height: 36, background: (d.renk || tokens.primary) + "18", fontSize: 18 }}
                  >
                    {d.ikon || "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.ad}</div>
                    <div style={{ fontSize: 10, color: tokens.muted, marginTop: 2 }}>{d.toplam_kredi} kredi · {d.toplam_donem} dönem</div>
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