import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useAppData } from "../context/AppDataContext";
import { useTheme } from "../theme/ThemeProvider";
import { useWindowSize } from "../components/shared.jsx";

export default function MyClassPage({ bolum }) {
  const { tokens } = useTheme();
  const { profile } = useAuth();
  const { t, translateName, language } = useI18n();
  const { universities, faculties, facultyDepartments } = useAppData();
  const w = useWindowSize();
  const mobil = w < 768;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [activeTab, setActiveTab] = useState("class");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    supabase.from("departments").select("*").then(({ data }) => {
      if (data) setDepartments(data);
    });
  }, []);

  const getTransUni = (ad) => {
    if (!ad || language === "tr") return ad;
    const uni = universities.find(u => u.ad === ad);
    return uni && uni[`ad_${language}`] ? uni[`ad_${language}`] : ad;
  };

  const getTransFac = (ad) => {
    if (!ad || language === "tr") return ad;
    const fac = faculties.find(f => f.original_ad === ad || f.ad === ad);
    return fac && fac[`ad_${language}`] ? fac[`ad_${language}`] : ad;
  };

  const getTransDept = (ad) => {
    if (!ad || language === "tr") return ad;
    const dept = departments.find(d => d.ad === ad);
    return dept && dept[`ad_${language}`] ? dept[`ad_${language}`] : ad;
  };
  const [selectedDonem, setSelectedDonem] = useState("all");
  const [availableDonems, setAvailableDonems] = useState([]);

  // Get user's faculty and university info from AppData
  const userFd = bolum?.slug ? facultyDepartments.find(fd => fd.department_slug === bolum.slug) : null;
  const userFaculty = userFd ? faculties.find(f => f.id === userFd.faculty_id) : null;
  const userUniversity = userFaculty ? universities.find(u => u.id === userFaculty.university_id) : null;

  useEffect(() => {
    async function fetchCourses() {
      if (!profile?.department_id) return;
      const { data } = await supabase
        .from("department_courses")
        .select("id, ad, donem, ad_en, ad_es, ad_it, ad_ru")
        .eq("department_id", profile.department_id)
        .order("ad");
      if (data) {
        setCourses(data);
        const uniqueDonems = [...new Set(data.map(c => c.donem))].filter(Boolean).sort((a,b) => a-b);
        setAvailableDonems(uniqueDonems);
      }
    }
    fetchCourses();
  }, [profile?.department_id]);

  useEffect(() => {
    async function fetchClassmates() {
      if (!profile?.department_id || !profile?.enrollment_year) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "school") {
          if (!userUniversity) throw new Error("Üniversite bilgisi bulunamadı.");
          const { data, error } = await supabase.rpc("get_university_leaderboard", {
            p_university_id: userUniversity.id
          });
          if (error) throw error;
          setStudents(data || []);
        } else if (activeTab === "faculty") {
          if (!userFaculty) throw new Error("Fakülte bilgisi bulunamadı.");
          const { data, error } = await supabase.rpc("get_faculty_leaderboard", {
            p_faculty_id: userFaculty.id
          });
          if (error) throw error;
          setStudents(data || []);
        } else if (activeTab === "department") {
          const { data, error } = await supabase.rpc("get_department_leaderboard", {
            p_department_id: profile.department_id
          });
          if (error) throw error;
          setStudents(data || []);
        } else if (activeTab === "class") {
          if (selectedCourse === "all") {
            const { data, error } = await supabase.rpc("get_class_leaderboard", {
              p_department_id: profile.department_id,
              p_enrollment_year: profile.enrollment_year
            });
            if (error) throw error;
            setStudents(data || []);
          } else {
            const { data, error } = await supabase.rpc("get_course_leaderboard", {
              p_department_id: profile.department_id,
              p_enrollment_year: profile.enrollment_year,
              p_course_id: selectedCourse
            });
            if (error) throw error;
            setStudents(data || []);
          }
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error("Sınıf arkadaşları yüklenemedi:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchClassmates();
  }, [profile?.department_id, profile?.enrollment_year, selectedCourse, activeTab, userUniversity, userFaculty]);

  if (!profile?.department_id || !profile?.enrollment_year) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: tokens.warning + "15", border: `1px solid ${tokens.warning}30`, borderRadius: 16, padding: 24, textAlign: "center", color: tokens.warning }}>
          {t("Sınıf arkadaşlarınızı görebilmek için lütfen Ayarlar sayfasından Bölüm ve Kayıt Yılı bilgilerinizi doldurun.")}
        </div>
      </div>
    );
  }

  const headerTitle = bolum?.ad 
    ? `${getTransDept(bolum.ad)} ${profile.enrollment_year} ${t("Girişliler")}` 
    : `${profile.enrollment_year} ${t("Girişliler")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Üst Kart ── */}
      <div style={{
        background: `linear-gradient(135deg, ${tokens.primary}18 0%, ${tokens.card} 60%)`,
        border: `1px solid ${tokens.primary}30`,
        borderRadius: 20, padding: "28px 28px 24px",
        boxShadow: `0 0 40px ${tokens.primary}10`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: tokens.primary + "0a", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primary}aa)`,
            display: mobil ? "none" : "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", boxShadow: `0 8px 24px ${tokens.primary}40`,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 4px", letterSpacing: -0.5 }}>{headerTitle}</h1>
            <p style={{ fontSize: 13, color: tokens.muted, margin: 0 }}>
              {t("Kendi sınıfınız, fakülteniz ve okuldaki diğer öğrencilerle başarı sıralamanızı karşılaştırın.")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sekmeler (Tabs) ── */}
      <div style={{ display: mobil ? "grid" : "flex", gridTemplateColumns: mobil ? "1fr 1fr" : "none", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button 
          onClick={() => setActiveTab("school")}
          style={{ 
            padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "school" ? tokens.primary : tokens.card, 
            color: activeTab === "school" ? "#fff" : tokens.textSecondary,
            boxShadow: activeTab === "school" ? `0 4px 12px ${tokens.primary}40` : tokens.shadowSm
          }}>
          {t("Genel")}
        </button>
        <button 
          onClick={() => setActiveTab("faculty")}
          style={{ 
            padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "faculty" ? tokens.primary : tokens.card, 
            color: activeTab === "faculty" ? "#fff" : tokens.textSecondary,
            boxShadow: activeTab === "faculty" ? `0 4px 12px ${tokens.primary}40` : tokens.shadowSm
          }}>
          {t("Fakülte")}
        </button>
        <button 
          onClick={() => setActiveTab("department")}
          style={{ 
            padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "department" ? tokens.primary : tokens.card, 
            color: activeTab === "department" ? "#fff" : tokens.textSecondary,
            boxShadow: activeTab === "department" ? `0 4px 12px ${tokens.primary}40` : tokens.shadowSm
          }}>
          {t("Bölüm")}
        </button>
        <button 
          onClick={() => setActiveTab("class")}
          style={{ 
            padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "class" ? tokens.primary : tokens.card, 
            color: activeTab === "class" ? "#fff" : tokens.textSecondary,
            boxShadow: activeTab === "class" ? `0 4px 12px ${tokens.primary}40` : tokens.shadowSm
          }}>
          {t("Sınıf")}
        </button>

        {activeTab === "class" && (
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
            <select
              value={selectedDonem}
              onChange={(e) => {
                setSelectedDonem(e.target.value);
                setSelectedCourse("all");
              }}
              style={{
                backgroundColor: tokens.background,
                border: `1px solid ${tokens.border}`,
                color: tokens.textPrimary,
                padding: "8px 32px 8px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(tokens.muted)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center"
              }}
            >
              <option value="all">{t("Tüm Dönemler")}</option>
              {availableDonems.map(d => (
                <option key={d} value={d}>{d}. {t("Dönem")}</option>
              ))}
            </select>

            {(selectedDonem !== "all" || courses.length > 0) && (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{
                  backgroundColor: tokens.background,
                  border: `1px solid ${tokens.border}`,
                  color: tokens.textPrimary,
                  padding: "8px 32px 8px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(tokens.muted)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  maxWidth: "200px",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden"
                }}
              >
                <option value="all">{t("Genel Ortalama")}</option>
                {courses.filter(c => selectedDonem === "all" || c.donem === Number(selectedDonem)).map(c => (
                  <option key={c.id} value={c.id}>
                    {(language !== "tr" && c[`ad_${language}`]) ? c[`ad_${language}`] : c.ad}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* ── Liste ── */}
      <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, overflow: "hidden", boxShadow: tokens.shadowSm }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            {activeTab === "school" 
              ? (userUniversity?.ad ? `${getTransUni(userUniversity.ad)} ${t("Liderlik Tablosu")}` : t("Genel Liderlik Tablosu")) 
              : activeTab === "faculty" 
                ? (userFaculty?.ad ? `${getTransFac(userFaculty.ad)} ${t("Liderlik Tablosu")}` : t("Fakülte Liderlik Tablosu")) 
                : activeTab === "department"
                  ? (bolum?.ad ? `${getTransDept(bolum.ad)} ${t("Liderlik Tablosu")}` : t("Bölüm Liderlik Tablosu"))
                  : t("Sınıf Liderlik Tablosu")}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: tokens.muted, fontWeight: 600, background: tokens.primary + "15", padding: "4px 10px", borderRadius: 99, color: tokens.primary }}>
              {students.length} {t("Öğrenci")}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: tokens.muted }}>{t("Yükleniyor...")}</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: tokens.danger }}>{error}</div>
        ) : students.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: tokens.muted }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
              {activeTab === "class" && selectedCourse !== "all" ? t("Kayıtlı Öğrenci Yok") : t("Henüz Kimse Yok")}
            </div>
            <div style={{ fontSize: 13 }}>
              {activeTab === "class" && selectedCourse !== "all" 
                ? t("Ya bu dersi almıyorsunuz ya da sınıfınızda bu dersi alan başka öğrenci bulunmuyor.") 
                : t("Seçilen kritere uygun sınıf arkadaşınız bulunmuyor.")}
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 700 }}>
            {/* Header */}
            <div style={{ display: "grid", 
              gridTemplateColumns: activeTab === "school" ? "60px 2.5fr 120px 2fr 2fr 1fr" :
                                   activeTab === "faculty" ? "60px 2.5fr 120px 2fr 1fr" :
                                   activeTab === "department" ? "60px 2.5fr 120px 1.5fr" :
                                   (activeTab === "class" && selectedCourse !== "all") ? "60px 2.5fr 100px 1fr 1fr 1fr 1fr 1fr 1fr" :
                                   "60px 3fr 120px", 
              padding: "12px 24px", background: tokens.background, borderBottom: `1px solid ${tokens.border}`, fontSize: 12, fontWeight: 600, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div style={{ textAlign: "center" }}>#</div>
              <div>{t("Öğrenci")}</div>
              
              {activeTab === "class" && selectedCourse !== "all" ? (
                <div style={{ textAlign: "center" }}>{t("Harf Notu")}</div>
              ) : (
                <div style={{ textAlign: "center" }}>{t("Ortalama")}</div>
              )}

              {activeTab === "school" && (
                <>
                  <div style={{ textAlign: "center" }}>{t("Fakülte")}</div>
                  <div style={{ textAlign: "center" }}>{t("Bölüm")}</div>
                  <div style={{ textAlign: "center" }}>{t("Sınıf")}</div>
                </>
              )}
              {activeTab === "faculty" && (
                <>
                  <div style={{ textAlign: "center" }}>{t("Bölüm")}</div>
                  <div style={{ textAlign: "center" }}>{t("Sınıf")}</div>
                </>
              )}
              {activeTab === "department" && <div style={{ textAlign: "center" }}>{t("Sınıf")}</div>}

              {activeTab === "class" && selectedCourse !== "all" && (
                <>
                  <div style={{ textAlign: "center" }}>{t("Vize")}</div>
                  <div style={{ textAlign: "center" }}>{t("Ödev")}</div>
                  <div style={{ textAlign: "center" }}>{t("Proje")}</div>
                  <div style={{ textAlign: "center" }}>{t("Final")}</div>
                  <div style={{ textAlign: "center" }}>{t("Büt")}</div>
                  <div style={{ textAlign: "center" }}>{t("Ort.")}</div>
                </>
              )}
            </div>
            
            {/* Rows */}
            {students.map((s, idx) => {
              const isCourseRank = activeTab === "class" && selectedCourse !== "all";
              const isMe = s.user_id === profile.id;
              
              const score = isCourseRank ? (s.sort_score || 0) : (s.gpa || 0);
              const gpaStatus = score >= 3.5 ? { l: t("Yüksek Onur"), c: tokens.primary } : score >= 3.0 ? { l: t("Onur"), c: tokens.success } : score >= 2.0 ? { l: t("Başarılı"), c: tokens.textPrimary } : { l: t("Uyarı"), c: tokens.danger };
              const pct = Math.min(100, Math.max(0, (score / 4.0) * 100));
              
              const getSinif = (year) => {
                if (!year) return "-";
                const now = new Date();
                const currentAcademicYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
                const sinif = currentAcademicYear - year + 1;
                return sinif > 0 ? `${sinif}. ${t("Sınıf")}` : t("Hazırlık");
              };
              
              const gridCols = activeTab === "school" ? "60px 2.5fr 120px 2fr 2fr 1fr" :
                               activeTab === "faculty" ? "60px 2.5fr 120px 2fr 1fr" :
                               activeTab === "department" ? "60px 2.5fr 120px 1.5fr" :
                               (activeTab === "class" && selectedCourse !== "all") ? "60px 2.5fr 100px 1fr 1fr 1fr 1fr 1fr 1fr" :
                               "60px 3fr 120px";
              
              return (
                <div key={s.user_id} style={{ 
                  display: "grid", gridTemplateColumns: gridCols, alignItems: "center", padding: "16px 24px",
                  background: isMe ? tokens.primary + "0a" : "transparent",
                  borderBottom: `1px solid ${tokens.border}`,
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => { if (!isMe) e.currentTarget.style.background = tokens.background; }}
                onMouseLeave={(e) => { if (!isMe) e.currentTarget.style.background = "transparent"; }}
                >
                  {isMe && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: tokens.primary, borderRadius: "0 4px 4px 0" }} />}
                  
                  {/* # */}
                  <div style={{ textAlign: "center" }}>
                    {idx === 0 ? <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>🥇</span> : 
                     idx === 1 ? <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>🥈</span> : 
                     idx === 2 ? <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>🥉</span> : 
                     <span style={{ fontSize: 15, fontWeight: 700, color: tokens.muted }}>{idx + 1}</span>}
                  </div>
                  
                  {/* Öğrenci */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {s.is_online && <div style={{ width: 8, height: 8, borderRadius: "50%", background: tokens.success, flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isMe ? tokens.primary : tokens.textPrimary, display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        {s.full_name || t("Anonim Öğrenci")}
                        {isMe && <span style={{ fontSize: 10, fontWeight: 800, background: tokens.primary + "15", color: tokens.primary, padding: "2px 8px", borderRadius: 8, letterSpacing: 0.5 }}>{t("SEN")}</span>}
                      </div>
                      {s.username && <div style={{ fontSize: 13, color: tokens.muted }}>@{s.username}</div>}
                    </div>
                  </div>
                  
                  {/* Ortalama / Not */}
                  {activeTab === "class" && selectedCourse !== "all" ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: gpaStatus.c, letterSpacing: -0.5 }}>
                        {s.harf_notu || "-"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: gpaStatus.c, letterSpacing: -0.5, textShadow: isMe ? `0 2px 10px ${gpaStatus.c}40` : "none" }}>
                        {(s.gpa || 0).toFixed(2)}
                      </div>
                      <div style={{ width: 60, height: 4, background: tokens.background, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: gpaStatus.c, borderRadius: 2 }} />
                      </div>
                    </div>
                  )}

                  {/* New Fields */}
                  {activeTab === "school" && (
                    <>
                      <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600, textAlign: "center" }}>{getTransFac(s.faculty_name) || "-"}</div>
                      <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600, textAlign: "center" }}>{getTransDept(s.department_name) || "-"}</div>
                      <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600, textAlign: "center" }}>{getSinif(s.enrollment_year)}</div>
                    </>
                  )}
                  {activeTab === "faculty" && (
                    <>
                      <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600, textAlign: "center" }}>{getTransDept(s.department_name) || "-"}</div>
                      <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600, textAlign: "center" }}>{getSinif(s.enrollment_year)}</div>
                    </>
                  )}
                  {activeTab === "department" && (
                    <div style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: 600, textAlign: "center" }}>{getSinif(s.enrollment_year)}</div>
                  )}

                  {activeTab === "class" && selectedCourse !== "all" && (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textSecondary, textAlign: "center" }}>{s.vize ?? "-"}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textSecondary, textAlign: "center" }}>{s.odev ?? "-"}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textSecondary, textAlign: "center" }}>{s.proje ?? "-"}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textSecondary, textAlign: "center" }}>{s.final ?? "-"}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textSecondary, textAlign: "center" }}>{s.but ?? "-"}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: tokens.textPrimary, textAlign: "center" }}>{(s.sort_score || 0).toFixed(1)}</div>
                    </>
                  )}
                  
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
