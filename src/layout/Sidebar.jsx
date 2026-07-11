import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../context/I18nContext";

const ICON = {
  dashboard: (color = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5"/>
      <rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/>
      <rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  ),
  courses: (color = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  analytics: (color = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  settings: (color = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  admin: (color = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  departments: (color = "currentColor") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21V7l8-4v18"/>
      <path d="M19 21V11l-6-4"/>
      <line x1="9" y1="9" x2="9" y2="9.01"/>
      <line x1="9" y1="12" x2="9" y2="12.01"/>
      <line x1="9" y1="15" x2="9" y2="15.01"/>
      <line x1="9" y1="18" x2="9" y2="18.01"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Ana Sayfa", icon: ICON.dashboard },
  { id: "courses", label: "Dersler", icon: ICON.courses },
  { id: "analytics", label: "Analitik", icon: ICON.analytics },
  { id: "settings", label: "Ayarlar", icon: ICON.settings },
];

const ADMIN_ITEM = { id: "admin", label: "Admin Paneli", icon: ICON.admin };
const DEPARTMENT_ITEM = { id: "departments", label: "Departmanlar", icon: ICON.departments };

function SidebarLogo({ tokens, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryHover})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 12px ${tokens.primary}40`,
      }}>
        <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
          <polyline points="6,34 16,34 22,20 28,48 34,26 38,38 44,30 50,34 58,34"
            fill="none" stroke="white" strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span style={{
        fontWeight: 700, fontSize: 16, color: tokens.textPrimary,
        letterSpacing: -0.3,
      }}>
        UniPulse
      </span>
    </button>
  );
}

export default function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  donemler,
  aktifDonem,
  onDonemChange,
  isAdmin,
  customNavItems,
}) {
  const { tokens, mode } = useTheme();
  const { t } = useI18n();

  const navItems = customNavItems ? customNavItems : (isAdmin ? [...NAV_ITEMS, ADMIN_ITEM, DEPARTMENT_ITEM] : NAV_ITEMS);
  // Admin & departments go into a separate "Yönetim" group
  const primaryNav = customNavItems ? customNavItems : NAV_ITEMS;
  const adminNav = customNavItems ? [] : (isAdmin ? [ADMIN_ITEM, DEPARTMENT_ITEM] : []);

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{ position: "fixed", inset: 0, background: "rgba(7,11,20,0.6)", backdropFilter: "blur(4px)", zIndex: 199 }}
        />
      )}
      <aside
        style={{
          position: "fixed",
          left: 20,
          top: 20,
          bottom: 20,
          width: collapsed ? 80 : 220,
          background: mode === "dark" ? "rgba(15, 22, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${tokens.border}`,
          borderRadius: 24,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.1)`,
          display: "flex",
          flexDirection: "column",
          zIndex: 200,
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          transform: mobileOpen ? "translateX(0)" : undefined,
          overflow: "hidden"
        }}
        className="up-sidebar"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 0",
            borderBottom: `1px solid ${tokens.border}`,
            background: "transparent",
          }}
        >
          {!collapsed ? (
            <SidebarLogo tokens={tokens} onClick={() => onNavigate("dashboard")} />
          ) : (
            <button onClick={() => onNavigate("dashboard")} style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryHover})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 12px ${tokens.primary}40`,
              border: "none", cursor: "pointer", padding: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
                <polyline points="6,34 16,34 22,20 28,48 34,26 38,38 44,30 50,34 58,34"
                  fill="none" stroke="white" strokeWidth="5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {primaryNav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activePage === item.id}
              collapsed={collapsed}
              tokens={tokens}
              onClick={() => { onNavigate(item.id); onCloseMobile?.(); }}
            />
          ))}

          {adminNav.length > 0 && (
            <>
              {!collapsed && (
                <div style={{ padding: "0 18px", marginTop: 24, marginBottom: 8, fontSize: 11, fontWeight: 700, color: tokens.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  {t("Yönetim")}
                </div>
              )}
              {collapsed && <div style={{ height: 8 }} />}
              {adminNav.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activePage === item.id}
                  collapsed={collapsed}
                  tokens={tokens}
                  onClick={() => { onNavigate(item.id); onCloseMobile?.(); }}
                />
              ))}
            </>
          )}
        </nav>

        {/* Dönem seçici */}
        {donemler && (
          <div style={{ padding: collapsed ? "12px 8px 16px" : "12px 16px 20px", borderTop: `1px solid ${tokens.border}`, background: "transparent" }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: tokens.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 8,
                }}
              >
                {t("Dönem")}
              </div>
            )}
            <div style={{ position: "relative" }}>
              <select
                value={aktifDonem}
                onChange={(e) => onDonemChange(e.target.value)}
                title="Dönem Seç"
                style={{
                  width: "100%",
                  padding: collapsed ? "8px 4px" : "9px 28px 9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${tokens.border}`,
                  background: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  fontFamily: "inherit",
                }}
              >
                {donemler.map((d) => (
                  <option key={d.value} value={d.value}>
                    {collapsed ? d.short : d.label}
                  </option>
                ))}
              </select>
              {!collapsed && (
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: tokens.muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function NavButton({ item, active, collapsed, tokens, onClick }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      title={collapsed ? t(item.label) : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "10px 0" : "9px 12px",
        borderRadius: 10,
        border: "none",
        background: active ? tokens.sidebarActive : "transparent",
        color: active ? tokens.primary : tokens.textSecondary,
        fontWeight: active ? 600 : 500,
        fontSize: 14,
        cursor: "pointer",
        transition: "background 150ms ease, color 150ms ease",
        position: "relative",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = tokens.sidebarHover;
          e.currentTarget.style.color = tokens.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = tokens.textSecondary;
        }
      }}
    >
      {active && !collapsed && (
        <span style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: 18,
          borderRadius: 0,
          background: tokens.primary,
        }} />
      )}
      <span style={{ display: "flex", flexShrink: 0, color: active ? tokens.primary : "inherit" }}>
        {item.icon(active ? tokens.primary : undefined)}
      </span>
      {!collapsed && <span>{t(item.label)}</span>}
    </button>
  );
}
