import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";

export default function Header({ sidebarWidth, onOpenMobileSidebar, pageTitle }) {
  const { tokens, mode, toggleTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = ((profile?.full_name || user?.email || "?")[0] || "?").toUpperCase();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 150,
        height: 64,
        marginLeft: sidebarWidth,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
      }}
      className="up-header"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onOpenMobileSidebar}
          className="up-mobile-only"
          style={{
            display: "none",
            width: 34,
            height: 34,
            borderRadius: 9,
            border: `1px solid ${tokens.border}`,
            background: "transparent",
            color: tokens.textPrimary,
            cursor: "pointer",
          }}
          aria-label="Menüyü aç"
        >
          ☰
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary }}>{pageTitle}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={toggleTheme}
          aria-label="Temayı değiştir"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `1px solid ${tokens.border}`,
            background: "transparent",
            color: tokens.textSecondary,
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          {mode === "dark" ? "☀️" : "🌙"}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifMenuOpen((v) => !v)}
            aria-label="Bildirimler"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${tokens.border}`,
              background: "transparent",
              color: tokens.textSecondary,
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            🔔
          </button>
          {notifMenuOpen && (
            <>
              <div
                onClick={() => setNotifMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 160 }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: 280,
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  boxShadow: tokens.shadowLg,
                  overflow: "hidden",
                  zIndex: 170,
                }}
              >
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tokens.textPrimary }}>Bildirimler</div>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  <div style={{ padding: 16, textAlign: "center", color: tokens.muted, fontSize: 12 }}>
                    Şu anda bir bildirim yok.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${tokens.border}`,
              background: tokens.primary + "20",
              color: tokens.primary,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {initial}
          </button>
          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 160 }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: 220,
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  boxShadow: tokens.shadowLg,
                  overflow: "hidden",
                  zIndex: 170,
                }}
              >
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${tokens.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                    {profile?.full_name || "Kullanıcı"}
                  </div>
                  <div style={{ fontSize: 11, color: tokens.muted, marginTop: 2 }}>{user?.email}</div>
                </div>
                <button
                  onClick={logout}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: tokens.danger,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}