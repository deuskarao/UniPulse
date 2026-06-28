import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Overlay, useInputStyle, useWindowSize } from "../components/shared.jsx";
import { useHedefGano } from "../hooks/useHedefGano";

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
  const { hedefGano, setHedefGano, resetHedefGano, defaultHedef } = useHedefGano();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifGrade, setNotifGrade] = useState(true);
  const [facultyName, setFacultyName] = useState(null);
  const [universityName, setUniversityName] = useState(null);
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const [hedefInput, setHedefInput] = useState(String(hedefGano.toFixed(2)));
  const [hedefError, setHedefError] = useState("");

  useEffect(() => { setHedefInput(hedefGano.toFixed(2)); }, [hedefGano]);

  const w = useWindowSize();
  const mobil = w < 768;
  const [usernameModal, setUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const inputStyle = useInputStyle();

  useEffect(() => {
    async function loadOrgInfo() {
      const fetches = [];

      // Fakülte: önce profile.faculty_id'den dene, yoksa faculty_departments üzerinden bul
      if (profile?.faculty_id) {
        fetches.push(
          supabase.from("faculties").select("ad").eq("id", profile.faculty_id).maybeSingle()
            .then(({ data }) => { if (data) setFacultyName(data.ad); })
        );
      } else if (profile?.department_id) {
        fetches.push(
          supabase
            .from("faculty_departments")
            .select("faculties!inner(ad)")
            .eq("department_id", profile.department_id)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.faculties) setFacultyName(data.faculties.ad);
              else {
                // department_slug üzerinden dene
                supabase.from("departments").select("slug").eq("id", profile.department_id).maybeSingle()
                  .then(({ data: dept }) => {
                    if (!dept) return;
                    supabase.from("faculty_departments").select("faculties!inner(ad)")
                      .eq("department_slug", dept.slug).maybeSingle()
                      .then(({ data: fd }) => { if (fd?.faculties) setFacultyName(fd.faculties.ad); });
                  });
              }
            })
        );
      }

      // Üniversite: profile.university_id'den çek
      if (profile?.university_id) {
        fetches.push(
          supabase.from("universities").select("ad").eq("id", profile.university_id).maybeSingle()
            .then(({ data }) => { if (data) setUniversityName(data.ad); })
        );
      }

      await Promise.all(fetches);
    }
    loadOrgInfo();
  }, [profile?.faculty_id, profile?.department_id, profile?.university_id]);

  async function handleThemeChange(m) {
    setMode(m);
    try { await supabase.from("profiles").update({ theme_preference: m }).eq("id", user.id); } catch {}
  }

  // Bölüm sıfırlama — artık özel modal ile onaylanıyor
  const [deptResetOpen, setDeptResetOpen] = useState(false);
  const [deptResetError, setDeptResetError] = useState("");

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
    } catch (e) {
      console.error(e);
      setDeptResetError(e?.message || "Bölüm değiştirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsUpdatingDept(false);
    }
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
      setUsernameError("Lütfen geçerli bir kullanıcı adı girin (Sadece harf, rakam, alt çizgi, nokta).");
      return;
    }
    try {
      await updateProfile({ username: usernameInput || null });
      setUsernameModal(false);
    } catch (err) {
      setUsernameError("Bu kullanıcı adı zaten alınmış veya geçersiz!");
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
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>, label: "Üniversite", value: universityName },
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>, label: "Fakülte", value: facultyName },
    { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, label: "Bölüm", value: bolum?.ad || profile?.department_id ? (bolum?.ad || "Yükleniyor…") : null },
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
                {profile?.full_name || "Kullanıcı"}
              </div>
              <button onClick={openUsernameModal} style={{ fontSize: 13, fontWeight: 700, color: tokens.primary, background: tokens.primary + "15", padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.target.style.background = tokens.primary + "25"} onMouseLeave={(e) => e.target.style.background = tokens.primary + "15"}>
                {profile?.username ? `@${profile.username}` : "+ Kullanıcı Adı Ekle"}
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

          {/* Çıkış */}
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
            padding: "9px 16px", borderRadius: 12,
            border: `1px solid ${tokens.danger}35`,
            background: tokens.danger + "10",
            color: tokens.danger, fontWeight: 600, fontSize: 12.5,
            cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = tokens.danger + "20"; e.currentTarget.style.borderColor = tokens.danger + "55"; }}
            onMouseLeave={e => { e.currentTarget.style.background = tokens.danger + "10"; e.currentTarget.style.borderColor = tokens.danger + "35"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* ── Alt Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: mobil ? "1fr" : "1fr 1fr 1fr 1fr", gap: 16 }}>

        {/* Bildirimler */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
          title="Bildirimler"
        >
          <ToggleRow
            tokens={tokens}
            label="E-posta Bildirimleri"
            sub="Önemli güncellemeler"
            checked={notifEmail}
            onChange={setNotifEmail}
          />
          <ToggleRow
            tokens={tokens}
            label="Not Güncellemeleri"
            sub="Not eklenince bildirim al"
            checked={notifGrade}
            onChange={setNotifGrade}
          />
        </SettingCard>

        {/* Tema */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
          title="Görünüm"
        >
          <div style={{ display: "flex", gap: 0, borderRadius: 12, overflow: "hidden", border: `1px solid ${tokens.border}`, marginTop: 4 }}>
            {[
              { id: "light", label: "☀️ Açık" },
              { id: "dark", label: "🌙 Koyu" },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => handleThemeChange(id)} style={{
                flex: 1, padding: "10px 0", border: "none", fontFamily: "inherit",
                background: mode === id ? tokens.primary : "transparent",
                color: mode === id ? "#fff" : tokens.muted,
                fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: tokens.surface, border: `1px solid ${tokens.border}` }}>
            <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Aktif Tema</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>{mode === "dark" ? "🌙 Koyu Mod" : "☀️ Açık Mod"}</div>
          </div>
        </SettingCard>

        {/* Veri Dışa Aktarma */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
          title="Veri Dışa Aktarma"
        >
          <p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
            Tüm ders ve not verilerini indir.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ExportButton onClick={exportJSON} tokens={tokens} color="#F59E0B" icon="{ }">
              JSON İndir
            </ExportButton>
            <ExportButton onClick={exportCSV} tokens={tokens} color="#10B981" icon="⊞">
              CSV İndir
            </ExportButton>
          </div>
          {dersler?.length > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: tokens.surface, border: `1px solid ${tokens.border}`, fontSize: 11, color: tokens.muted, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              {dersler.length} ders · {stats?.totalKredi || 0} toplam kredi
            </div>
          )}
        </SettingCard>

        {/* Hedef GPA */}
        <SettingCard
          tokens={tokens}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
          title="Hedef GPA"
        >
          <p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 12px", lineHeight: 1.5 }}>
            Onur derecesi için hedefini belirle. Dashboard'da ilerlemen bu hedefe göre ölçülür.
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
              Kaydet
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
                Sıfırla
              </button>
            )}
          </div>
        </SettingCard>
      </div>

      {/* ── Hesap Detayları ── */}
      <div style={{
        background: tokens.card, border: `1px solid ${tokens.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: tokens.primary + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Hesap Bilgileri</span>
          </div>
          <button
            onClick={handleResetDepartmentClick}
            disabled={isUpdatingDept}
            style={{
              padding: "7px 14px", borderRadius: 8, background: tokens.primary + "12",
              border: `1px solid ${tokens.primary}40`, color: tokens.primary,
              fontSize: 12, fontWeight: 600, cursor: isUpdatingDept ? "wait" : "pointer",
              transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={(e) => { if (!isUpdatingDept) { e.currentTarget.style.background = tokens.primary + "20"; e.currentTarget.style.borderColor = tokens.primary + "60"; } }}
            onMouseLeave={(e) => { if (!isUpdatingDept) { e.currentTarget.style.background = tokens.primary + "12"; e.currentTarget.style.borderColor = tokens.primary + "40"; } }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
            </svg>
            {isUpdatingDept ? "Güncelleniyor..." : "Bölümü Değiştir"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {[
            { label: "Üniversite", value: universityName, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg> },
            { label: "Fakülte", value: facultyName, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg> },
            { label: "Bölüm", value: bolum?.ad, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            { label: "Hesap Tipi", value: profile?.role === "admin" ? "Admin" : "Öğrenci", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> },
          ].map((item, i) => (
            <div key={i} style={{
              padding: "16px 22px",
              borderRight: `1px solid ${tokens.border}`,
              borderBottom: `1px solid ${tokens.border}`,
              transition: "background 150ms ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = tokens.primary + "06"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                {item.icon} {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.value ? tokens.textPrimary : tokens.muted }}>
                {item.value || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {usernameModal && (
        <Overlay onClick={() => setUsernameModal(false)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 20, padding: 28, maxWidth: 400, width: "90%", textAlign: "center", boxShadow: tokens.shadowLg }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: tokens.primary + "12", border: `1px solid ${tokens.primary}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: tokens.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 style={{ color: tokens.textPrimary, margin: "0 0 8px", fontSize: 19 }}>Kullanıcı Adı Belirle</h3>
            <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 24px" }}>Sadece harf, rakam, alt çizgi ve nokta kullanabilirsiniz.</p>
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
                {usernameError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setUsernameModal(false)} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = tokens.surface} onMouseLeave={(e) => e.target.style.background = "transparent"}>İptal</button>
              <button onClick={saveUsername} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: tokens.primary, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "opacity 0.2s", boxShadow: `0 4px 14px ${tokens.primary}40` }} onMouseEnter={(e) => e.target.style.opacity = 0.85} onMouseLeave={(e) => e.target.style.opacity = 1}>Kaydet</button>
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
              Bölümünü Değiştir
            </h3>

            <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.55 }}>
              Mevcut bölümünü ({bolum?.ad || profile?.department_id ? "—" : "seçili değil"}) sıfırlayarak
              yeni bir üniversite, fakülte ve bölüm seçebilirsin.
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
                <strong style={{ color: tokens.textPrimary }}>Dikkat:</strong> Bu işlem, ders ve not verilerini silmez.
                Ancak mevcut bölümüne ait ders listesi görünürlüğü değişir. Yeni bölümüne özel dersleri
                sıfırdan eklemen gerekebilir.
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
                İptal
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
                    Değiştiriliyor...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Evet, Değiştir
                  </>
                )}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function SettingCard({ tokens, icon, title, children }) {
  return (
    <div style={{
      background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: tokens.primary + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.primary }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>{title}</span>
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
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
