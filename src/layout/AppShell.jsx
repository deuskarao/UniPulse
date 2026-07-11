import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useDersler } from "../hooks/useDersler";
import { useWindowSize } from "../components/shared.jsx";
import DashboardPage from "../pages/DashboardPage";
import CoursesPage from "../pages/CoursesPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import SettingsPage from "../pages/SettingsPage";
import AdminPage from "../pages/AdminPage";
import DepartmentPage from "../pages/DepartmentPage";

const PAGE_TITLES = {
  dashboard: "Ana Sayfa",
  courses: "Dersler",
  analytics: "Analitik",
  settings: "Ayarlar",
  admin: "Admin Paneli",
  departments: "Departman Yönetimi",
};

const MOBILE_NAV_ITEMS = [
  { id: "dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>, label: "Ana Sayfa" },
  { id: "courses", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, label: "Dersler" },
  { id: "analytics", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: "Analiz" },
  { id: "settings", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label: "Ayarlar" },
];

export default function AppShell({ bolumProp, departmentId }) {
  const { tokens } = useTheme();
  const { profile: authProfile, updateProfile } = useAuth();
  const { t } = useI18n();
  const w = useWindowSize();
  const mobil = w < 768;

  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace("#/", "").replace("#", "");
    return ["dashboard", "courses", "analytics", "settings", "admin", "departments"].includes(hash) ? hash : "dashboard";
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#/", "").replace("#", "");
      if (["dashboard", "courses", "analytics", "settings", "admin", "departments"].includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    if (!window.location.hash) window.location.hash = `/${activePage}`;
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (page) => {
    window.location.hash = `/${page}`;
    setActivePage(page);
  };
  const [collapsed, setCollapsed] = useState(false);

  const d = useDersler({ bolumProp, departmentId });

  if (d.bolumLoading) return <CenteredMessage text={t("Bölüm yükleniyor...")} />;
  if (!d.profile) return <CenteredMessage text={t("Profil yükleniyor...")} />;
  if (!d.bolum && authProfile?.department_id) return <CenteredMessage text={t("Bölüm bilgileri yükleniyor...")} />;

  const needsDepartment = authProfile?.role !== "admin" && !authProfile?.department_id && activePage !== "settings";

  const donemler = [
    { value: "tumu", label: t("Tüm Dönemler"), short: t("Tümü") },
    ...(d.bolum ? Array.from({ length: d.bolum.toplamDonem }, (_, i) => i + 1).map((n) => ({
      value: String(n),
      label: `${n}. ${t("Dönem")}`,
      short: `D${n}`,
    })) : []),
  ];

  const sidebarWidth = mobil ? 0 : collapsed ? 80 + 20 : 220 + 20;

  return (
    <div style={{ minHeight: "100vh", background: tokens.background, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {!mobil && (
        <Sidebar
          activePage={activePage}
          onNavigate={navigate}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          mobileOpen={false}
          onCloseMobile={() => {}}
          donemler={donemler}
          aktifDonem={d.aktifDonem}
          onDonemChange={d.setAktifDonem}
          isAdmin={authProfile?.role === "admin"}
        />
      )}
      <div style={{ marginLeft: sidebarWidth, transition: "margin-left 200ms ease" }}>
        <Header 
          sidebarWidth={0} 
          pageTitle={t(PAGE_TITLES[activePage] || "UniPulse")} 
          donemler={donemler}
          aktifDonem={d.aktifDonem}
          onDonemChange={d.setAktifDonem}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
        <main style={{ padding: mobil ? "16px 16px 88px" : "40px 28px 40px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {needsDepartment ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: "60vh", gap: 16, textAlign: "center", padding: 24,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryHover})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 32, boxShadow: `0 8px 24px ${tokens.primary}40`,
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
                </svg>
              </div>
              <h2 style={{ color: tokens.textPrimary, margin: 0, fontSize: 22, fontWeight: 700 }}>
                {t("Hoş geldin! 👋")}
              </h2>
              <p style={{ color: tokens.muted, margin: 0, fontSize: 14, lineHeight: 1.5, maxWidth: 400 }}>
                {t("UniPulse'u kullanmaya başlamak için üniversite, fakülte ve bölümünü seç. Sonra derslerini görüp notlarını takip edebilirsin.")}
              </p>
              <button
                onClick={() => navigate("settings")}
                style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryHover})`,
                  color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
                  fontFamily: "inherit", boxShadow: `0 8px 20px ${tokens.primary}35`,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 12px 28px ${tokens.primary}45`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 20px ${tokens.primary}35`; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                </svg>
                {t("Bölüm Seç")}
              </button>
            </div>
          ) : (
            <>
              {activePage === "dashboard" && <DashboardPage dersler={d.dersler} stats={d.stats} harfNotlari={d.harfNotlari} bolum={d.bolum} aktifDonem={d.aktifDonem} />}
              {activePage === "courses" && (
                <CoursesPage
                  bolum={d.bolum}
                  profile={d.profile}
                  harfNotlari={d.harfNotlari}
                  harfRenk={d.harfRenk}
                  siraliDersler={d.siraliDersler}
                  siralama={d.siralama}
                  siralamaDegistir={d.siralamaDegistir}
                  modal={d.modal}
                  setModal={d.setModal}
                  form={d.form}
                  silOnay={d.silOnay}
                  setSilOnay={d.setSilOnay}
                  modalAc={d.modalAc}
                  formDegistir={d.formDegistir}
                  kaydet={d.kaydet}
                  sil={d.sil}
                />
              )}
              {activePage === "analytics" && <AnalyticsPage dersler={d.dersler} harfNotlari={d.harfNotlari} stats={d.stats} />}
              {activePage === "settings" && <SettingsPage dersler={d.dersler} stats={d.stats} bolum={d.bolum} />}
              {activePage === "admin" && <AdminPage />}
              {activePage === "departments" && <DepartmentPage />}
            </>
          )}
        </main>
      </div>

      {mobil && (
        <nav
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
            paddingBottom: "env(safe-area-inset-bottom, 16px)",
            background: tokens.surface,
            borderTop: `1px solid ${tokens.border}`,
            display: "flex",
            zIndex: 140,
          }}
        >
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  border: "none",
                  background: "transparent",
                  color: active ? tokens.primary : tokens.muted,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", marginBottom: 2 }}>{item.icon}</span>
                <span style={{ fontSize: 10 }}>{t(item.label)}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Onboarding Overlay kaldırıldı — kullanıcı bölümsüzse Dashboard'da
          boş durum mesajı gösterilir, Settings'ten bölüm seçebilir. */}
    </div>
  );
}

function CenteredMessage({ text }) {
  const { tokens } = useTheme();
  return (
    <div style={{ minHeight: "100vh", background: tokens.background, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: tokens.muted, fontSize: 14 }}>{text}</div>
    </div>
  );
}