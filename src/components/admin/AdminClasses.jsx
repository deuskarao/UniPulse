import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminClasses({ onUserSelect }) {
  const { t, language } = useI18n();
  const { tokens } = useTheme();
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [profRes, deptRes] = await Promise.all([
        supabase.from("profiles").select("id, department_id, enrollment_year"),
        supabase.from("departments").select("id, ad").order("ad").catch(() => ({ data: [] }))
      ]);
      const mapAd = (data) => {
        if (!data) return data;
        return data.map(item => {
          const translation = language !== "tr" && item[`ad_${language}`];
          return { ...item, ad: translation ? translation : item.ad };
        });
      };

      if (deptRes.data) {
        const mappedDepts = mapAd(deptRes.data);
        setDepartments(mappedDepts);
        
        if (profRes.data) {
          const groups = {};
          profRes.data.forEach(p => {
            if (!p.department_id || !p.enrollment_year) return;
            const key = `${p.department_id}_${p.enrollment_year}`;
            if (!groups[key]) {
              const dept = mappedDepts.find(d => d.id === p.department_id);
              groups[key] = {
                id: key,
                department_id: p.department_id,
                enrollment_year: p.enrollment_year,
                name: `${dept ? dept.ad : "Bilinmeyen Bölüm"} ${p.enrollment_year} Sınıfı`,
                student_count: 0
              };
            }
            groups[key].student_count += 1;
          });
          const virtualClasses = Object.values(groups).sort((a,b) => a.name.localeCompare(b.name));
          setClasses(virtualClasses);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [language]);

  async function loadStudents(virtualClass) {
    setLoadingStudents(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, student_grades(count)")
      .eq("department_id", virtualClass.department_id)
      .eq("enrollment_year", virtualClass.enrollment_year);
    if (data) setClassStudents(data);
    setLoadingStudents(false);
  }

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    loadStudents(cls);
  };

  const [search, setSearch] = useState("");
  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (selectedClass) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card rounded-xl p-4" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedClass(null)} className="rounded-lg p-2" style={{ border: `1px solid ${tokens.border}`, background: 'transparent', color: tokens.textPrimary }}>←</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: tokens.textPrimary }}>{selectedClass.name}</div>
              <div style={{ fontSize: 12, color: tokens.muted }}>{departments.find(d => d.id === selectedClass.department_id)?.ad || "Bölüm Yok"} • {classStudents.length} Öğrenci</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          <div style={{ padding: "16px", borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Öğrenciler</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ background: tokens.surface, color: tokens.muted, fontSize: 11, textTransform: "uppercase" }}>
                  <th className="p-3 font-semibold">Öğrenci</th>
                  <th className="p-3 font-semibold">Kayıtlı Notlar</th>
                  <th className="p-3 font-semibold">Kayıt Tarihi</th>
                  <th className="p-3 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudents ? (
                  <tr><td colSpan="4" className="p-4 text-center" style={{ color: tokens.muted }}>Yükleniyor...</td></tr>
                ) : classStudents.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center" style={{ color: tokens.muted }}>Bu sınıfta öğrenci yok.</td></tr>
                ) : (
                  classStudents.map(student => (
                    <tr key={student.id} style={{ borderBottom: `1px solid ${tokens.border}`, color: tokens.textPrimary }}>
                      <td className="p-3 font-medium">{student.full_name || student.email || "İsimsiz"}</td>
                      <td className="p-3">{student.student_grades?.[0]?.count || 0}</td>
                      <td className="p-3">{new Date(student.created_at).toLocaleDateString("tr-TR")}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => onUserSelect(student)} className="text-xs px-2 py-1 rounded" style={{ background: tokens.primary + '20', color: tokens.primary }}>Detay</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-5" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.muted, textTransform: "uppercase" }}>Toplam Sınıf</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: tokens.textPrimary, marginTop: 8 }}>{classes.length}</div>
        </motion.div>
      </div>

      <div className="mb-2">
        <input
          placeholder="Sınıf Ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg px-3 py-2 outline-none"
          style={{ background: tokens.input, border: `1px solid ${tokens.border}`, color: tokens.textPrimary }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl h-24" style={{ background: tokens.card }} />)
        ) : filteredClasses.map((cls, i) => (
          <motion.button
            key={cls.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => handleClassSelect(cls)}
            className="rounded-xl p-4 text-left transition-all hover:-translate-y-1"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}`, cursor: 'pointer', boxShadow: tokens.shadowSm }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>{cls.name}</div>
            <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>{departments.find(d => d.id === cls.department_id)?.ad || "Bölüm Yok"}</div>
            <div className="mt-4 inline-block px-2 py-1 rounded text-xs" style={{ background: tokens.primary + '18', color: tokens.primary }}>
              {cls.student_count || 0} Öğrenci
            </div>
          </motion.button>
        ))}
        {!loading && filteredClasses.length === 0 && (
          <div className="col-span-full text-center py-12" style={{ color: tokens.muted }}>Sınıf bulunamadı. Lütfen veritabanından ekleyin.</div>
        )}
      </div>
    </div>
  );
}
