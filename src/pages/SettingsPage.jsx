import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { supabase } from "../lib/supabase";
import { Overlay, useInputStyle, useWindowSize } from "../components/shared.jsx";
import { useHedefGano } from "../hooks/useHedefGano";
import DepartmentSelector from "../components/DepartmentSelector";
import TermsModal from "../components/TermsModal";

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function SettingsPage({ dersler, stats, bolum }) {
  const { tokens, mode, setMode } = useTheme();
  const { user, profile, logout, updateProfile } = useAuth();
  const { t, translateName, language } = useI18n();
  const { hedefGano, setHedefGano, resetHedefGano, defaultHedef } = useHedefGano();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifGrade, setNotifGrade] = useState(true);
  const [facultyName, setFacultyName] = useState(null);
  const [universityName, setUniversityName] = useState(null);
  const [className, setClassName] = useState(null);
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const [hedefInput, setHedefInput] = useState(String(hedefGano.toFixed(2)));
  const [hedefError, setHedefError] = useState("");
  const [termsModal, setTermsModal] = useState(null); // 'terms' or 'kvkk'

  useEffect(() => { setHedefInput(hedefGano.toFixed(2)); }, [hedefGano]);

  const w = useWindowSize();
  const mobil = w < 768;
  const [usernameModal, setUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const inputStyle = useInputStyle();

  useEffect(() => {
    async function loadOrgInfo() {
      const fetches = [];

      // === Sınıf ===
      if (profile?.class_id) {
        fetches.push(
          supabase.from("classes").select("name").eq("id", profile.class_id).maybeSingle()
            .then(({ data }) => { if (data) setClassName(data.name); })
        );
      }

      // === Üniversite ===
      if (profile?.university_id) {
        fetches.push(
          supabase.from("universities").select("*").eq("id", profile.university_id).maybeSingle()
            .then(({ data }) => { 
              if (data) {
                const transAd = language !== "tr" && data[`ad_${language}`] ? data[`ad_${language}`] : data.ad;
                setUniversityName(transAd);
              } 
            })
        );
      }

      // === Fakülte ===
      if (profile?.faculty_id) {
        fetches.push(
          supabase.from("faculties").select("*").eq("id", profile.faculty_id).maybeSingle()
            .then(({ data }) => { 
              if (data) {
                const transAd = language !== "tr" && data[`ad_${language}`] ? data[`ad_${language}`] : data.ad;
                setFacultyName(transAd);
              } 
            })
        );
      }
      // Öncelik 2: department_id → department_slug → faculty_departments'tan ilk fakülte
      else if (profile?.department_id) {
        fetches.push(
          (async () => {
            try {
              // Önce department slug'ını bul
              const { data: dept } = await supabase
                .from("departments")
                .select("slug, ad")
                .eq("id", profile.department_id)
                .maybeSingle();

              if (!dept) return;

              // Bu slug'a sahip ilk faculty_departments kaydını al
              const { data: fd } = await supabase
                .from("faculty_departments")
                .select("faculty_id, faculties!inner(*)")
                .eq("department_slug", dept.slug)
                .limit(1)
                .maybeSingle();

              if (fd?.faculties) {
                const transFacAd = language !== "tr" && fd.faculties[`ad_${language}`] ? fd.faculties[`ad_${language}`] : fd.faculties.ad;
                setFacultyName(transFacAd);
                // Eğer university_id yoksa, fakülteden üniversiteyi de öğren
                if (!profile?.university_id && fd.faculty_id) {
                  const { data: fac } = await supabase
                    .from("faculties")
                    .select("university_id, universities!inner(*)")
                    .eq("id", fd.faculty_id)
                    .maybeSingle();
                  if (fac?.universities) {
                    const transUniAd = language !== "tr" && fac.universities[`ad_${language}`] ? fac.universities[`ad_${language}`] : fac.universities.ad;
                    setUniversityName(transUniAd);
                  }
                }
              }
            } catch (err) {
              console.error("Fakülte bilgisi yüklenemedi:", err);
            }
          })()
        );
      }

      await Promise.all(fetches);
    }
    loadOrgInfo();
  }, [profile?.faculty_id, profile?.department_id, profile?.university_id, language]);

  async function handleThemeChange(m) {
    setMode(m);
    try { await supabase.from("profiles").update({ theme_preference: m }).eq("id", user.id); } catch {}
  }

  // Bölüm sıfırlama — artık özel modal ile onaylanıyor, sonra DepartmentSelector açılır
  const [deptResetOpen, setDeptResetOpen] = useState(false);
  const [deptResetError, setDeptResetError] = useState("");
  const [deptSelectOpen, setDeptSelectOpen] = useState(false); // Bölüm seçme modalı

  // Şifre değiştirme — Supabase auth.updateUser ile
  // Not: Supabase yeni sürümde mevcut şifre doğrulaması istiyor.
  // Çözüm: Önce signInWithPassword ile mevcut şifreyi doğrula, sonra updateUser çağır.
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  function handlePasswordChangeClick() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess(false);
    setPasswordModalOpen(true);
  }

  async function handlePasswordSubmit(e) {
    if (e) e.preventDefault();
    setPasswordError("");

    // Validasyon
    if (!currentPassword) {
      setPasswordError(t("settings.enter_current_password"));
      return;
    }
    if (!newPassword) {
      setPasswordError(t("settings.enter_new_password"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("settings.password_min_length"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwords_do_not_match"));
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(t("settings.new_password_must_be_different"));
      return;
    }

    setPasswordLoading(true);
    try {
      // 1) Mevcut şifreyi doğrula (signInWithPassword)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError(t("settings.current_password_incorrect"));
        return;
      }

      // 2) Yeni şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message || t("settings.password_update_failed"));
        return;
      }

      // Başarılı
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Şifre değiştirme hatası:", err);
      setPasswordError(err?.message || t("settings.password_update_failed_retry"));
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleResetDepartmentClick() {
    setDeptResetError("");
    setDeptResetOpen(true);
  }

  async function confirmResetDepartment() {
    setIsUpdatingDept(true);
    setDeptResetError("");
    try {
      await updateProfile({ department_id: null, faculty_id: null, university_id: null });
      setDeptResetOpen(false);
      // Onay sonrası bölüm seçme modalını aç
      setDeptSelectOpen(true);
    } catch (e) {
      console.error(e);
      setDeptResetError(e?.message || t("settings.department_change_failed"));
    } finally {
      setIsUpdatingDept(false);
    }
  }

  // Bölüm seçme modalından gelen veriyi kaydet
  // DepartmentSelector zaten updateProfile ile DB'ye yazdı, burada sadece reload
  async function handleDepartmentSelect(deptData) {
    console.log("[Settings] Bölüm seçildi (DB'ye zaten yazıldı), sayfa yenileniyor:", deptData);
    setDeptSelectOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }

  function openUsernameModal() {
    setUsernameInput(profile?.username || "");
    setUsernameError("");
    setUsernameModal(true);
  }

  const [usernameError, setUsernameError] = useState("");

  async function saveUsername() {
    setUsernameError("");
    if (usernameInput && !/^[a-zA-Z0-9_.-]+$/.test(usernameInput)) {
      setUsernameError(t("settings.invalid_username"));
      return;
    }
    try {
      await updateProfile({ username: usernameInput || null });
      setUsernameModal(false);
    } catch (err) {
      setUsernameError(t("settings.username_taken"));
    }
  }

  function exportJSON() {
    const payload = { bolum: bolum?.ad, exportedAt: new Date().toISOString(), stats, dersler };
    downloadFile(`unipulse-export-${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json");
  }
  function exportCSV() {
    const header = "Ders,Dönem,Kredi,Vize,Ödev,Proje,Final\n";
    const rows = dersler.map(d => `${d.ad},${d.donem},${d.kredi},${d.vize},${d.odev},${d.proje},${d.final}`).join("\n");
    downloadFile(`unipulse-export-${Date.now()}.csv`, header + rows, "text/csv");
  }

  // Kullanıcı baş harfi + renk
  const initials = (profile?.full_name || user?.email || "?")[0]?.toUpperCase() || "?";

  const infoItems = [
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>, label: t("Üniversite"), value: universityName },
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>, label: t("Fakülte"), value: facultyName },
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, label: t("Bölüm"), value: bolum?.ad || profile?.department_id ? (bolum?.ad || t("Yükleniyor…")) : null },
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: t("Kayıt Yılı"), value: profile?.enrollment_year || t("Belirtilmemiş") },
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: t("Rol"), value: profile?.role === "admin" ? t("Yönetici") : (profile?.enrollment_year ? (new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear()) - profile.enrollment_year + 1 > 0 ? `${(new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear()) - profile.enrollment_year + 1}. ${t("Sınıf")}` : t("Hazırlık") : t("Öğrenci")) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Profil Kartı ── */}
      <div style={{
        background: `linear-gradient(135deg, ${tokens.primary}18 0%, ${tokens.card} 60%)`,
        border: `1px solid ${tokens.primary}30`,
        borderRadius: 20, padding: "28px 28px 24px",
        boxShadow: `0 0 40px ${tokens.primary}10`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Dekoratif arka plan */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: tokens.primary + "0a", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, borderRadius: "50%", background: tokens.primary + "08", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primary}aa)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#fff",
            boxShadow: `0 8px 24px ${tokens.primary}40`,
            border: `3px solid ${tokens.primary}30`,
          }}>{initials}</div>

          {/* Ad + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: tokens.textPrimary, letterSpacing: -0.5 }}>
                {profile?.full_name || t("Kullanıcı")}
              </div>
              <button onClick={openUsernameModal} style={{ fontSize: 13, fontWeight: 700, color: tokens.primary, background: tokens.primary + "15", padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.target.style.background = tokens.primary + "25"} onMouseLeave={(e) => e.target.style.background = tokens.primary + "15"}>
                {profile?.username ? `@${profile.username}` : t("+ Kullanıcı Adı Ekle")}
              </button>
            </div>
            <div style={{ fontSize: 13, color: tokens.muted, marginTop: 4 }}>{user?.email}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {infoItems.filter(i => i.value).map(item => (
                <span key={item.label} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 99,
                  background: tokens.primary + "15", border: `1px solid ${tokens.primary}25`,
                  fontSize: 11.5, fontWeight: 600, color: tokens.primary,
                }}>
                  {item.icon} {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Alt Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: mobil ? "1fr" : "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>

        {/* Hedef GPA */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
          title={t("Hedef GPA")}
        >
          <p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
            {t("Onur derecesi için hedefini belirle. Dashboard'da ilerlemen bu hedefe göre ölçülür.")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input
              type="number"
              min="0"
              max="4"
              step="0.05"
              value={hedefInput}
              onChange={(e) => { setHedefInput(e.target.value); setHedefError(""); }}
              style={{
                ...inputStyle,
                flex: 1,
                fontWeight: 700,
                fontSize: 16,
                color: tokens.primary,
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 600 }}>/ 4.00</span>
          </div>
          {hedefError && (
            <div style={{ background: tokens.danger + "10", border: `1px solid ${tokens.danger}25`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, color: tokens.danger, fontSize: 11, fontWeight: 500 }}>
              {hedefError}
            </div>
          )}
          {/* Hızlı seçim */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[2.00, 2.50, 3.00, 3.50].map((v) => (
              <button
                key={v}
                onClick={() => { setHedefInput(v.toFixed(2)); setHedefError(""); }}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 7,
                  border: `1px solid ${hedefGano.toFixed(2) === v.toFixed(2) ? tokens.primary + "50" : tokens.border}`,
                  background: hedefGano.toFixed(2) === v.toFixed(2) ? tokens.primary + "12" : "transparent",
                  color: hedefGano.toFixed(2) === v.toFixed(2) ? tokens.primary : tokens.muted,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (hedefGano.toFixed(2) !== v.toFixed(2)) { e.currentTarget.style.borderColor = tokens.primary + "30"; e.currentTarget.style.color = tokens.textPrimary; } }}
                onMouseLeave={(e) => { if (hedefGano.toFixed(2) !== v.toFixed(2)) { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.muted; } }}
              >
                {v.toFixed(2)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const ok = setHedefGano(hedefInput);
                if (!ok) setHedefError("Lütfen 0.00 ile 4.00 arasında bir değer girin.");
              }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8,
                background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryHover})`,
                color: "#fff", border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 12, fontFamily: "inherit",
                boxShadow: `0 4px 12px ${tokens.primary}30`,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {t("Kaydet")}
            </button>
            {hedefGano.toFixed(2) !== defaultHedef.toFixed(2) && (
              <button
                onClick={() => { resetHedefGano(); setHedefError(""); }}
                style={{
                  padding: "8px 12px", borderRadius: 8,
                  background: "transparent", color: tokens.muted,
                  border: `1px solid ${tokens.border}`, cursor: "pointer",
                  fontWeight: 600, fontSize: 12, fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = tokens.textPrimary; e.currentTarget.style.borderColor = tokens.primary + "30"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = tokens.muted; e.currentTarget.style.borderColor = tokens.border; }}
              >
                {t("Sıfırla")}
              </button>
            )}
          </div>
        </SettingCard>

        {/* Güvenlik */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
          title={t("Güvenlik")}
        >
          <p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
            {t("Hesabınızın şifresini değiştirmek için butona tıklayın.")}
          </p>
          <button
            onClick={handlePasswordChangeClick}
            style={{
              padding: "9px 14px", borderRadius: 10, background: tokens.warning + "12",
              border: `1px solid ${tokens.warning}40`, color: tokens.warning,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", width: "100%",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = tokens.warning + "20"; e.currentTarget.style.borderColor = tokens.warning + "60"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = tokens.warning + "12"; e.currentTarget.style.borderColor = tokens.warning + "40"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {t("Şifre Değiştir")}
          </button>
        </SettingCard>

        {/* Eğitim */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>}
          title={t("Eğitim")}
        >
          <p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
            {t("Farklı bir üniversite veya bölüme geçmek isterseniz buradan değiştirebilirsiniz.")}
          </p>
          <button
            onClick={handleResetDepartmentClick}
            disabled={isUpdatingDept}
            style={{
              padding: "9px 14px", borderRadius: 10, background: tokens.primary + "12",
              border: `1px solid ${tokens.primary}40`, color: tokens.primary,
              fontSize: 12.5, fontWeight: 600, cursor: isUpdatingDept ? "wait" : "pointer",
              transition: "all 0.2s", width: "100%",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (!isUpdatingDept) { e.currentTarget.style.background = tokens.primary + "20"; e.currentTarget.style.borderColor = tokens.primary + "60"; } }}
            onMouseLeave={(e) => { if (!isUpdatingDept) { e.currentTarget.style.background = tokens.primary + "12"; e.currentTarget.style.borderColor = tokens.primary + "40"; } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
            </svg>
            {isUpdatingDept ? t("Güncelleniyor...") : t("Bölümü Değiştir")}
          </button>

          <div style={{ marginTop: 24, borderTop: `1px solid ${tokens.border}`, paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
              {t("Kayıt olduğunuz yılı seçin. Aynı yıl ve bölümde olan arkadaşlarınızı 'Sınıfım' sayfasında görebilirsiniz.")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                value={profile?.enrollment_year || ""}
                onChange={async (e) => {
                  const year = e.target.value ? parseInt(e.target.value, 10) : null;
                  try {
                    await updateProfile({ enrollment_year: year });
                  } catch (err) {
                    alert(t("settings.update_error"));
                  }
                }}
                style={{
                  ...inputStyle,
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  background: tokens.input,
                  border: `1px solid ${tokens.border}`,
                  cursor: "pointer",
                }}
              >
                <option value="">{t("Kayıt Yılını Seçin")}</option>
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i + 1).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={profile?.enrollment_year ? (new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear()) - profile.enrollment_year + 1 : ""}
                onChange={async (e) => {
                  const sinif = e.target.value ? parseInt(e.target.value, 10) : null;
                  if (sinif !== null) {
                    const currentAcademicYear = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                    const year = currentAcademicYear - sinif + 1;
                    try {
                      await updateProfile({ enrollment_year: year });
                    } catch (err) {
                      alert(t("settings.update_error"));
                    }
                  }
                }}
                style={{
                  ...inputStyle,
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  background: tokens.input,
                  border: `1px solid ${tokens.border}`,
                  cursor: "pointer",
                }}
              >
                <option value="">{t("Sınıf Seçin")}</option>
                <option value="0">{t("Hazırlık")}</option>
                <option value="1">1. {t("Sınıf")}</option>
                <option value="2">2. {t("Sınıf")}</option>
                <option value="3">3. {t("Sınıf")}</option>
                <option value="4">4. {t("Sınıf")}</option>
                <option value="5">5. {t("Sınıf")}</option>
                <option value="6">6. {t("Sınıf")}</option>
              </select>
            </div>
          </div>
        </SettingCard>

        {/* Bildirimler */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
          title={t("Bildirimler")}
        >
          <ToggleRow
            tokens={tokens}
            label={t("E-posta Bildirimleri")}
            sub={t("Önemli güncellemeler")}
            checked={notifEmail}
            onChange={setNotifEmail}
          />
          <ToggleRow
            tokens={tokens}
            label={t("Not Güncellemeleri")}
            sub={t("Not eklenince bildirim al")}
            checked={notifGrade}
            onChange={setNotifGrade}
          />
        </SettingCard>

        {/* Hesap Yönetimi (Silme ve Dışa Aktarma) */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          title={t("Hesap")}
          defaultOpen={false}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ExportButton onClick={exportJSON} tokens={tokens} color="#F59E0B" icon="{ }">
              {t("Verileri JSON İndir")}
            </ExportButton>
            <ExportButton onClick={exportCSV} tokens={tokens} color="#10B981" icon="⊞">
              {t("Verileri CSV İndir")}
            </ExportButton>
            <button
              onClick={async () => {
                if (window.confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir!")) {
                  if (typeof deleteUser === "function" && user?.id) {
                    try {
                      await deleteUser(user.id);
                      alert(t("settings.account_deleted"));
                      if (typeof logout === "function") await logout();
                    } catch (err) {
                      alert(t("settings.account_delete_error") + ": " + err.message);
                    }
                  } else {
                    alert(t("settings.delete_not_active"));
                  }
                }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 14px", borderRadius: 10, border: `1px solid ${tokens.danger}30`,
                background: tokens.danger + "10", color: tokens.danger,
                fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s", width: "100%", marginTop: 8
              }}
              onMouseEnter={e => { e.currentTarget.style.background = tokens.danger + "20"; e.currentTarget.style.borderColor = tokens.danger + "50"; }}
              onMouseLeave={e => { e.currentTarget.style.background = tokens.danger + "10"; e.currentTarget.style.borderColor = tokens.danger + "30"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {t("Hesabı Kalıcı Olarak Sil")}
            </button>
          </div>
        </SettingCard>

        {/* Hakkında */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
          title={t("Hakkında")}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: `1px solid ${tokens.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{t("Sürüm")}</span>
              <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 500 }}>v1.0.0</span>
            </div>
            <button type="button" onClick={() => setTermsModal('kvkk')} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", width: "100%", textAlign: "left", padding: "0 0 8px 0", borderBottom: `1px solid ${tokens.border}`, cursor: "pointer", color: tokens.textPrimary, fontFamily: "inherit" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("KVKK & Aydınlatma Metni")}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button type="button" onClick={() => setTermsModal('terms')} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", width: "100%", textAlign: "left", padding: "0 0 8px 0", borderBottom: `1px solid ${tokens.border}`, cursor: "pointer", color: tokens.textPrimary, fontFamily: "inherit" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("Kullanıcı Sözleşmesi")}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <a href="mailto:contact@lifeos.com" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: tokens.primary }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("İletişim (Destek)")}</span>
              <span style={{ fontSize: 12, color: tokens.primary, fontWeight: 500 }}>contact@lifeos.com</span>
            </a>
          </div>
        </SettingCard>
      </div>



      {usernameModal && (
        <Overlay onClick={() => setUsernameModal(false)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 20, padding: 28, maxWidth: 400, width: "90%", textAlign: "center", boxShadow: tokens.shadowLg }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: tokens.primary + "12", border: `1px solid ${tokens.primary}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: tokens.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 style={{ color: tokens.textPrimary, margin: "0 0 8px", fontSize: 19 }}>{t("Kullanıcı Adı Belirle")}</h3>
            <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 24px" }}>{t("Sadece harf, rakam, alt çizgi ve nokta kullanabilirsiniz.")}</p>
            <input
              value={usernameInput}
              onChange={(e) => { setUsernameInput(e.target.value); setUsernameError(""); }}
              placeholder="kullanici_adi"
              style={{ ...inputStyle, textAlign: "center", marginBottom: usernameError ? 12 : 24, fontSize: 15, fontWeight: 600, letterSpacing: 0.5, ...(usernameError ? { borderColor: tokens.danger + "60", background: tokens.danger + "08" } : {}) }}
              onFocus={(e) => setTimeout(() => e.target.select(), 10)}
            />
            {usernameError && (
              <div style={{
                margin: "0 0 18px",
                padding: "10px 14px",
                borderRadius: 10,
                background: tokens.danger + "08",
                border: `1px solid ${tokens.danger}25`,
                display: "flex", alignItems: "center", gap: 8,
                color: tokens.danger, fontSize: 11.5, fontWeight: 500,
                textAlign: "left",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {t(usernameError)}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setUsernameModal(false)} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = tokens.surface} onMouseLeave={(e) => e.target.style.background = "transparent"}>{t("İptal")}</button>
              <button onClick={saveUsername} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: tokens.primary, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "opacity 0.2s", boxShadow: `0 4px 14px ${tokens.primary}40` }} onMouseEnter={(e) => e.target.style.opacity = 0.85} onMouseLeave={(e) => e.target.style.opacity = 1}>{t("Kaydet")}</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Bölüm Değiştir Onay Modalı */}
      {deptResetOpen && (
        <Overlay onClick={() => !isUpdatingDept && setDeptResetOpen(false)}>
          <div
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              borderRadius: 20,
              padding: "32px 28px 28px",
              maxWidth: 420,
              width: "90%",
              textAlign: "center",
              boxShadow: tokens.shadowLg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* İkon */}
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: tokens.warning + "12",
              border: `1px solid ${tokens.warning}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
              color: tokens.warning,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <h3 style={{ color: tokens.textPrimary, margin: "0 0 8px", fontSize: 19, fontWeight: 700, letterSpacing: -0.3 }}>
              {t("Bölümünü Değiştir")}
            </h3>

            <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.55 }}>
              {t("Mevcut bölümünü")} ({bolum?.ad || profile?.department_id ? "—" : t("seçili değil")}) {t("sıfırlayarak yeni bir üniversite, fakülte ve bölüm seçebilirsin.")}
            </p>

            {/* Uyarı kutusu — bu işlem geri alınamaz */}
            <div style={{
              margin: "16px 0",
              padding: "12px 14px",
              borderRadius: 10,
              background: tokens.warning + "08",
              border: `1px solid ${tokens.warning}20`,
              display: "flex", alignItems: "flex-start", gap: 10,
              textAlign: "left",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.warning} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div style={{ fontSize: 11.5, color: tokens.textSecondary, lineHeight: 1.5 }}>
                <strong style={{ color: tokens.textPrimary }}>{t("Dikkat:")}</strong> {t("Bu işlem, ders ve not verilerini silmez. Ancak mevcut bölümüne ait ders listesi görünürlüğü değişir. Yeni bölümüne özel dersleri sıfırdan eklemen gerekebilir.")}
              </div>
            </div>

            {/* Hata mesajı */}
            {deptResetError && (
              <div style={{
                margin: "12px 0",
                padding: "10px 14px",
                borderRadius: 10,
                background: tokens.danger + "08",
                border: `1px solid ${tokens.danger}25`,
                display: "flex", alignItems: "center", gap: 8,
                color: tokens.danger, fontSize: 12, fontWeight: 500,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {deptResetError}
              </div>
            )}

            {/* Butonlar */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button
                onClick={() => setDeptResetOpen(false)}
                disabled={isUpdatingDept}
                style={{
                  padding: "10px 20px", borderRadius: 10,
                  border: `1px solid ${tokens.border}`,
                  background: "transparent",
                  color: tokens.textSecondary,
                  cursor: isUpdatingDept ? "default" : "pointer",
                  fontWeight: 600, fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  opacity: isUpdatingDept ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isUpdatingDept) { e.currentTarget.style.background = tokens.surface; e.currentTarget.style.color = tokens.textPrimary; } }}
                onMouseLeave={(e) => { if (!isUpdatingDept) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tokens.textSecondary; } }}
              >
                {t("İptal")}
              </button>
              <button
                onClick={confirmResetDepartment}
                disabled={isUpdatingDept}
                style={{
                  padding: "10px 22px", borderRadius: 10,
                  border: "none",
                  background: isUpdatingDept
                    ? tokens.warning + "60"
                    : `linear-gradient(135deg, ${tokens.warning}, #d97706)`,
                  color: "#fff",
                  cursor: isUpdatingDept ? "wait" : "pointer",
                  fontWeight: 600, fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  boxShadow: isUpdatingDept ? "none" : `0 4px 14px ${tokens.warning}40`,
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={(e) => { if (!isUpdatingDept) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${tokens.warning}50`; } }}
                onMouseLeave={(e) => { if (!isUpdatingDept) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 14px ${tokens.warning}40`; } }}
              >
                {isUpdatingDept ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                    {t("Değiştiriliyor...")}
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {t("Evet, Değiştir")}
                  </>
                )}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Bölüm Seçme Modalı — "Bölümü Değiştir" onayından sonra açılır */}
      {deptSelectOpen && (
        <Overlay onClick={() => setDeptSelectOpen(false)}>
          <div
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              borderRadius: 20,
              padding: "28px 28px 24px",
              maxWidth: 720,
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: tokens.shadowLg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ color: tokens.textPrimary, margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {t("Yeni Bölüm Seç")}
                </h3>
                <p style={{ color: tokens.muted, margin: "4px 0 0", fontSize: 12 }}>
                  {t("Üniversite → Fakülte → Bölüm seçerek devam et")}
                </p>
              </div>
              <button
                onClick={() => setDeptSelectOpen(false)}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: tokens.surface, border: `1px solid ${tokens.border}`,
                  color: tokens.muted, cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >✕</button>
            </div>
            <DepartmentSelector
              tokens={tokens}
              onSelect={handleDepartmentSelect}
            />
          </div>
        </Overlay>
      )}

      {/* Şifre Değiştirme Modalı */}
      {passwordModalOpen && (
        <Overlay onClick={() => !passwordLoading && !passwordSuccess && setPasswordModalOpen(false)}>
          <div
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              borderRadius: 20,
              padding: "32px 28px 28px",
              maxWidth: 420,
              width: "90%",
              textAlign: "center",
              boxShadow: tokens.shadowLg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {passwordSuccess ? (
              <>
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: tokens.success + "12",
                  border: `1px solid ${tokens.success}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={tokens.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3 style={{ color: tokens.textPrimary, margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
                  {t("Şifre Güncellendi! ✓")}
                </h3>
                <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
                  {t("Şifreniz başarıyla değiştirildi. Bir sonraki giriş yapışınızda yeni şifrenizi kullanabilirsiniz.")}
                </p>
                <p style={{ color: tokens.muted, fontSize: 11, margin: 0 }}>
                  {t("Pencere 3 saniye içinde kapanacak...")}
                </p>
              </>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: tokens.warning + "12",
                  border: `1px solid ${tokens.warning}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px",
                  color: tokens.warning,
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>

                <h3 style={{ color: tokens.textPrimary, margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>
                  {t("Şifre Değiştir")}
                </h3>
                <p style={{ color: tokens.muted, fontSize: 12, margin: "0 0 20px", lineHeight: 1.5 }}>
                  {t("Güvenliğiniz için mevcut şifrenizi doğrulayın, sonra yeni şifrenizi belirleyin.")}
                </p>

                <div style={{ textAlign: "left", marginBottom: 12 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: tokens.textSecondary,
                    fontWeight: 600, marginBottom: 5, letterSpacing: "0.2px",
                  }}>
                    {t("Mevcut Şifre")}
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
                    placeholder="••••••••"
                    required
                    autoFocus
                    style={{
                      ...inputStyle,
                      ...(passwordError ? { borderColor: tokens.danger + "60", background: tokens.danger + "08" } : {}),
                    }}
                  />
                </div>

                <div style={{ textAlign: "left", marginBottom: 12 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: tokens.textSecondary,
                    fontWeight: 600, marginBottom: 5, letterSpacing: "0.2px",
                  }}>
                    {t("Yeni Şifre")}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{
                      ...inputStyle,
                      ...(passwordError ? { borderColor: tokens.danger + "60", background: tokens.danger + "08" } : {}),
                    }}
                  />
                </div>

                <div style={{ textAlign: "left", marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: tokens.textSecondary,
                    fontWeight: 600, marginBottom: 5, letterSpacing: "0.2px",
                  }}>
                    {t("Şifreyi Tekrar Gir")}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{
                      ...inputStyle,
                      ...(passwordError ? { borderColor: tokens.danger + "60", background: tokens.danger + "08" } : {}),
                    }}
                  />
                </div>

                {passwordError && (
                  <div style={{
                    margin: "0 0 16px",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: tokens.danger + "08",
                    border: `1px solid ${tokens.danger}25`,
                    display: "flex", alignItems: "center", gap: 8,
                    color: tokens.danger, fontSize: 11.5, fontWeight: 500,
                    textAlign: "left",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {passwordError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    disabled={passwordLoading}
                    style={{
                      padding: "10px 20px", borderRadius: 10,
                      border: `1px solid ${tokens.border}`,
                      background: "transparent",
                      color: tokens.textSecondary,
                      cursor: passwordLoading ? "default" : "pointer",
                      fontWeight: 600, fontSize: 13,
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                      opacity: passwordLoading ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!passwordLoading) { e.currentTarget.style.background = tokens.surface; e.currentTarget.style.color = tokens.textPrimary; } }}
                    onMouseLeave={(e) => { if (!passwordLoading) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tokens.textSecondary; } }}
                  >
                    {t("İptal")}
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      padding: "10px 22px", borderRadius: 10,
                      border: "none",
                      background: passwordLoading
                        ? tokens.warning + "60"
                        : `linear-gradient(135deg, ${tokens.warning}, #d97706)`,
                      color: "#fff",
                      cursor: passwordLoading ? "wait" : "pointer",
                      fontWeight: 600, fontSize: 13,
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                      boxShadow: passwordLoading ? "none" : `0 4px 14px ${tokens.warning}40`,
                      display: "inline-flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={(e) => { if (!passwordLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${tokens.warning}50`; } }}
                    onMouseLeave={(e) => { if (!passwordLoading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 14px ${tokens.warning}40`; } }}
                  >
                    {passwordLoading ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                          <line x1="12" y1="2" x2="12" y2="6"/>
                          <line x1="12" y1="18" x2="12" y2="22"/>
                          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                          <line x1="2" y1="12" x2="6" y2="12"/>
                          <line x1="18" y1="12" x2="22" y2="12"/>
                          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                        </svg>
                        {t("Güncelleniyor...")}
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {t("Şifreyi Güncelle")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Overlay>
      )}

      {/* Ortak Terms / KVKK Modalı */}
      <TermsModal
        isOpen={!!termsModal}
        onClose={() => setTermsModal(null)}
        type={termsModal}
        tokens={tokens}
        isDark={mode === "dark"}
      />
    </div>
  );
}

function SettingCard({ tokens, icon, title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: tokens.shadowSm,
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: "16px 20px", 
          borderBottom: isOpen ? `1px solid ${tokens.border}` : "none", 
          display: "flex", alignItems: "center", gap: 12, 
          cursor: "pointer", transition: "background 0.2s" 
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = tokens.primary + "05"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width: 32, height: 32, borderRadius: 10, background: tokens.primary + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.primary }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary, flex: 1 }}>{title}</span>
        <svg style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tokens.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {isOpen && (
        <div style={{ padding: "18px 20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleRow({ tokens, label, sub, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${tokens.border}` }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{label}</div>
        <div style={{ fontSize: 11, color: tokens.muted, marginTop: 1 }}>{sub}</div>
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 40, height: 22, borderRadius: 99, border: "none", flexShrink: 0,
        background: checked ? tokens.primary : tokens.border + "80",
        cursor: "pointer", position: "relative", transition: "background 200ms ease",
      }}>
        <span style={{
          position: "absolute", top: 3, left: checked ? 20 : 3,
          width: 16, height: 16, borderRadius: 99, background: "#fff",
          transition: "left 200ms ease", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

function ExportButton({ onClick, tokens, color, icon, children }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "9px 14px", borderRadius: 10, border: `1px solid ${color}30`,
      background: color + "10", color: tokens.textPrimary,
      fontWeight: 600, fontSize: 12.5, cursor: "pointer",
      fontFamily: "inherit", transition: "all 0.2s", width: "100%",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color + "20"; e.currentTarget.style.borderColor = color + "50"; }}
      onMouseLeave={e => { e.currentTarget.style.background = color + "10"; e.currentTarget.style.borderColor = color + "30"; }}
    >
      <span style={{ fontSize: 14, color }}>{icon}</span>
      {children}
    </button>
  );
}
