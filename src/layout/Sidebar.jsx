import { useTheme } from "../theme/ThemeProvider";

const NAV_ITEMS = [
  { id: "dashboard", label: "Ana Sayfa", icon: "🏠" },
  { id: "courses", label: "Dersler", icon: "📚" },
  { id: "analytics", label: "Analitik", icon: "📊" },
  { id: "settings", label: "Ayarlar", icon: "⚙️" },
];

const ADMIN_ITEM = { id: "admin", label: "Admin Paneli", icon: "👑" };
const DEPARTMENT_ITEM = { id: "departments", label: "Departmanlar", icon: "🏢" };

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
}) {
  const { tokens } = useTheme();
  
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM, DEPARTMENT_ITEM] : NAV_ITEMS;

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 }}
        />
      )}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 72 : 220,
          background: tokens.sidebar,
          borderRight: `1px solid ${tokens.border}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 200,
          transition: "width 200ms ease, transform 200ms ease",
          transform: mobileOpen ? "translateX(0)" : undefined,
        }}
        className="up-sidebar"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "20px 0" : "20px 20px 16px",
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 16, color: tokens.textPrimary, letterSpacing: -0.3 }}>
              UniPulse
            </span>
          )}
          <button
            onClick={onToggleCollapsed}
            aria-label="Kenar çubuğunu aç/kapat"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: `1px solid ${tokens.border}`,
              background: "transparent",
              color: tokens.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile?.();
                }}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 0" : "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: active ? tokens.sidebarActive : "transparent",
                  color: active ? tokens.primary : tokens.textSecondary,
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = tokens.sidebarHover;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {donemler && (
          <div style={{ padding: collapsed ? "12px 8px" : "12px 16px 20px", borderTop: `1px solid ${tokens.border}` }}>
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
                Dönem
              </div>
            )}
            <select
              value={aktifDonem}
              onChange={(e) => onDonemChange(e.target.value)}
              title="Dönem Seç"
              style={{
                width: "100%",
                padding: collapsed ? "8px 4px" : "9px 10px",
                borderRadius: 10,
                border: `1px solid ${tokens.border}`,
                background: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 13,
                fontWeight: 500,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {donemler.map((d) => (
                <option key={d.value} value={d.value}>
                  {collapsed ? d.short : d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </aside>
    </>
  );
}