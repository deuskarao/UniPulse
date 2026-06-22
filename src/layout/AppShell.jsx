import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
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
  { id: "dashboard", icon: "🏠", label: "Ana Sayfa" },
  { id: "courses", icon: "📚", label: "Dersler" },
  { id: "analytics", icon: "📊", label: "Analiz" },
  { id: "settings", icon: "⚙️", label: "Ayarlar" },
];

export default function AppShell({ bolumProp, departmentId }) {
  const { tokens } = useTheme();
  const { profile: authProfile } = useAuth();
  const w = useWindowSize();
  const mobil = w < 768;

  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const d = useDersler({ bolumProp, departmentId });

  if (d.bolumLoading || !d.bolum) return <CenteredMessage text="Bölüm yükleniyor..." />;
  if (!d.profile) return <CenteredMessage text="Profil yükleniyor..." />;
  if (d.dbLoading) return <CenteredMessage text="Dersler yükleniyor..." />;

  const donemler = [
    { value: "tumu", label: "Tüm Dönemler", short: "Tümü" },
    ...Array.from({ length: d.bolum.toplamDonem }, (_, i) => i + 1).map((n) => ({
      value: String(n),
      label: `${n}. Dönem`,
      short: `D${n}`,
    })),
  ];

  const sidebarWidth = mobil ? 0 : collapsed ? 72 : 220;

  return (
    <div style={{ minHeight: "100vh", background: tokens.background, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {!mobil && (
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
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
      {mobil && mobileSidebarOpen && (
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          collapsed={false}
          onToggleCollapsed={() => setMobileSidebarOpen(false)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          donemler={donemler}
          aktifDonem={d.aktifDonem}
          onDonemChange={d.setAktifDonem}
          isAdmin={authProfile?.role === "admin"}
        />
      )}

      <div style={{ marginLeft: sidebarWidth, transition: "margin-left 200ms ease" }}>
        <Header sidebarWidth={0} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} pageTitle={PAGE_TITLES[activePage]} />
        <main style={{ padding: mobil ? "16px 16px 88px" : "24px 28px 40px" }}>
          {activePage === "dashboard" && <DashboardPage dersler={d.dersler} stats={d.stats} harfNotlari={d.harfNotlari} bolum={d.bolum} />}
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
        </main>
      </div>

      {mobil && (
        <nav
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: 64,
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
                onClick={() => setActivePage(item.id)}
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
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
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