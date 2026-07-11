import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../context/I18nContext";

/**
 * Üniversite logosu — SVG tabanlı baş harf rozeti.
 *
 * Dış API'ler güvenilmez:
 * - Clearbit: kapandı
 * - Google Favicon: CORS sorunu
 * - DuckDuckGo: bazı domainleri tanımıyor, bozuk görünüyor
 *
 * Çözüm: Her üniversite için DB'deki renk ile gradient arka plan +
 * üniversite adının baş harfi. Kırılmaz, hızlı, temiz.
 *
 * Ekstra: 3 harfli kısaltma (örn: İTÜ, ODTÜ, İTÜ) özel isimler için.
 */
const KISALTMALAR = {
  "İstanbul Teknik Üniversitesi (İTÜ)": "İTÜ",
  "Orta Doğu Teknik Üniversitesi (ODTÜ)": "ODTÜ",
  "İzmir Yüksek Teknoloji Enstitüsü (İYTE)": "İYTE",
  "İhsan Doğramacı Bilkent Üniversitesi": "BİLKENT",
  "Boğaziçi Üniversitesi": "BOĞAZİÇİ",
  "İstanbul Üniversitesi": "İSTANBUL",
  "Hacettepe Üniversitesi": "HACETTEPE",
  "Ankara Üniversitesi": "ANKARA",
  "Marmara Üniversitesi": "MARMARA",
  "Yıldız Teknik Üniversitesi": "YTÜ",
  "Gebze Teknik Üniversitesi": "GTÜ",
  "Eskişehir Teknik Üniversitesi": "ESTÜ",
  "Karadeniz Teknik Üniversitesi": "KTÜ",
  "Bursa Uludağ Üniversitesi": "ULUDAĞ",
  "Akdeniz Üniversitesi": "AKDENİZ",
  "Dokuz Eylül Üniversitesi": "DEÜ",
  "Çukurova Üniversitesi": "ÇUKUROVA",
  "Erciyes Üniversitesi": "ERCİYES",
  "Atatürk Üniversitesi": "ATAÜ",
  "Pamukkale Üniversitesi": "PAÜ",
  "Kocaeli Üniversitesi": "KOCAELİ",
  "Selçuk Üniversitesi": "SELÇUK",
  "Gaziantep Üniversitesi": "GAZİANTEP",
  "Anadolu Üniversitesi": "AÜ",
  "Ege Üniversitesi": "EÜ",
  "Koç Üniversitesi": "KOÇ",
  "Sabancı Üniversitesi": "SABANCI",
  "Galatasaray Üniversitesi": "GSÜ",
  "Gazi Üniversitesi": "GAZİ",
};

function UniversityLogo({ university, size = 36 }) {
  const { tokens } = useTheme();
  const color = university?.renk || tokens.primary;
  const ad = university?.ad || "?";

  // Kısaltma varsa onu kullan, yoksa baş harfi
  const kisaltma = KISALTMALAR[ad];
  const initial = ad[0]?.toUpperCase() || "?";
  const text = kisaltma || initial;

  // Kısaltma uzunsa font küçült
  const fontSize = kisaltma
    ? (kisaltma.length > 4 ? size * 0.22 : size * 0.28)
    : size * 0.45;

  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: "#fff",
        fontSize,
        fontWeight: 800,
        flexShrink: 0,
        letterSpacing: -0.5,
        boxShadow: `0 2px 6px ${color}30`,
        textShadow: "0 1px 2px rgba(0,0,0,0.15)",
      }}
    >
      {text}
    </div>
  );
}

export default function DepartmentSelector({ onSelect, initialValue = null, tokens }) {
  const { t } = useI18n();
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
    // faculty_departments tablosu department_slug kullanır (department_id yok)
    const deptSlugs = facultyDepartments
      .filter(fd => fd.faculty_id === facId)
      .map(fd => fd.department_slug);
    return departments.filter(d => deptSlugs.includes(d.slug));
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

  // Bölüm seçilince: doğrudan DB'ye yaz + onSelect callback çağır
  const handleDepartmentSelect = async (deptId) => {
    console.log("[DepartmentSelector] handleDepartmentSelect çağrıldı, deptId:", deptId);
    const dept = departments.find(d => d.id === deptId);
    if (!dept) {
      console.error("[DepartmentSelector] Bölüm bulunamadı:", deptId);
      alert("Hata: Bölüm bulunamadı!");
      return;
    }
    if (!selectedUni) {
      console.error("[DepartmentSelector] Üniversite seçilmemiş!");
      alert("Hata: Üniversite seçilmemiş!");
      return;
    }
    if (!selectedFaculty) {
      console.error("[DepartmentSelector] Fakülte seçilmemiş!");
      alert("Hata: Fakülte seçilmemiş!");
      return;
    }

    const payload = {
      university_id: selectedUni.id,
      faculty_id: selectedFaculty.id,
      department_id: dept.id,
    };
    console.log("[DepartmentSelector] Bölüm seçildi:", dept.ad);
    console.log("[DepartmentSelector] Üniversite:", selectedUni.ad, "→", selectedUni.id);
    console.log("[DepartmentSelector] Fakülte:", selectedFaculty.ad, "→", selectedFaculty.id);
    console.log("[DepartmentSelector] Bölüm:", dept.ad, "→", dept.id);
    console.log("[DepartmentSelector] DB'ye yazılıyor:", payload);

    // Session'dan kullanıcı ID'sini al
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error("[DepartmentSelector] Session yok!");
      alert("Hata: Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }
    console.log("[DepartmentSelector] Kullanıcı ID:", session.user.id);

    // DB'ye yaz
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", session.user.id)
      .select("*");

    if (error) {
      console.error("[DepartmentSelector] DB hatası:", error);
      alert("Bölüm kaydedilemedi: " + error.message);
      return;
    }
    console.log("[DepartmentSelector] DB sonucu:", updated);
    console.log("[DepartmentSelector] ✓ DB'ye yazıldı");

    // Callback çağır (reload için)
    if (onSelect) {
      onSelect(payload);
    }
  };

  // Tek bölüm varsa otomatik seç (useEffect kaldırıldı — closure sorunu yaratıyordu)
  // Artık kullanıcı bölüm kartına tıklamalı.

  if (loading) {
    return (
      <div className="rounded-xl p-6" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
        <div className="text-center py-8" style={{ color: tokens.muted }}>{t("Yükleniyor...")}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectedUni && (
            <UniversityLogo university={selectedUni} size={32} />
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Bölüm Seçimi</div>
            <div style={{ fontSize: 11, color: tokens.muted }}>{getDisplayName()}</div>
          </div>
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
                  <UniversityLogo university={u} size={36} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.ad}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : !selectedFaculty ? (
          <motion.div key="facs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                onClick={() => {
                  console.log("[DepartmentSelector] Bölüm kartına tıklandı:", d.ad, d.id);
                  console.log("[DepartmentSelector] selectedUni:", selectedUni?.ad, selectedUni?.id);
                  console.log("[DepartmentSelector] selectedFaculty:", selectedFaculty?.ad, selectedFaculty?.id);
                  handleDepartmentSelect(d.id);
                }}
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