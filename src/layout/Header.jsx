import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { useWindowSize } from "../components/shared.jsx";

function ThemeIcon({ mode }) {
  if (mode === "dark") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

const IconBtn = ({ tokens, label, onClick, children, active }) => (
  <button
    onClick={onClick}
    aria-label={label}
    style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      border: `1px solid ${tokens.border}`,
      background: active ? tokens.primary + "12" : "transparent",
      color: active ? tokens.primary : tokens.textSecondary,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = tokens.sidebarHover; e.currentTarget.style.color = tokens.textPrimary; } }}
    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tokens.textSecondary; } }}
  >
    {children}
  </button>
);

export default function Header({ sidebarWidth, onOpenMobileSidebar, pageTitle, donemler, aktifDonem, onDonemChange }) {
  const { tokens, mode, toggleTheme, setMode } = useTheme();
  const { user, profile, logout, updateProfile } = useAuth();
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const w = useWindowSize();
  const mobil = w < 768;

  const initial = ((profile?.full_name || user?.email || "?")[0] || "?").toUpperCase();

  const handleThemeToggle = async () => {
    const newMode = mode === "dark" ? "light" : "dark";
    toggleTheme(); // This handles local storage and CSS instantly
    if (updateProfile) {
      await updateProfile({ theme_preference: newMode });
    }
  };

  return (
    <header
      style={{
        position: mobil ? "relative" : "sticky",
        top: 0,
        zIndex: 150,
        height: 64,
        marginLeft: sidebarWidth,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px 0 32px",
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
            display: mobil ? "flex" : "none",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `1px solid ${tokens.border}`,
            background: "transparent",
            color: tokens.textPrimary,
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Menüyü aç"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary, letterSpacing: -0.2 }}>{pageTitle}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {mobil && donemler && (
          <select
            value={aktifDonem}
            onChange={(e) => onDonemChange(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: 10,
              border: `1px solid ${tokens.border}`,
              background: tokens.surface,
              color: tokens.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              outline: "none",
              appearance: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {donemler.map(d => (
              <option key={d.value} value={d.value}>{d.short || d.label}</option>
            ))}
          </select>
        )}

        <IconBtn tokens={tokens} label="Temayı değiştir" onClick={handleThemeToggle}>
          <ThemeIcon mode={mode} />
        </IconBtn>

        <div style={{ position: "relative" }}>
          <IconBtn tokens={tokens} label="Bildirimler" onClick={() => setNotifMenuOpen((v) => !v)} active={notifMenuOpen}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </IconBtn>
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
                  width: 300,
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  boxShadow: tokens.shadowLg,
                  overflow: "hidden",
                  zIndex: 170,
                }}
              >
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Bildirimler</div>
                  <span style={{ fontSize: 11, color: tokens.muted }}>0 yeni</span>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  <div style={{ padding: "32px 16px", textAlign: "center", color: tokens.muted, fontSize: 13 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tokens.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
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
              border: `1px solid ${tokens.primary}30`,
              background: `linear-gradient(135deg, ${tokens.primary}20, ${tokens.primary}10)`,
              color: tokens.primary,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.primary + "50"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.primary + "30"; }}
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
                  width: 240,
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  boxShadow: tokens.shadowLg,
                  overflow: "hidden",
                  zIndex: 170,
                }}
              >
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
                    {profile?.full_name || "Kullanıcı"}
                  </div>
                  {profile?.username && <div style={{ fontSize: 11, color: tokens.primary, marginTop: 3, fontWeight: 600 }}>@{profile.username}</div>}
                  <div style={{ fontSize: 11, color: tokens.muted, marginTop: 3 }}>{user?.email}</div>
                </div>
                <button
                  onClick={logout}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 16px",
                    background: "transparent",
                    border: "none",
                    color: tokens.danger,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = tokens.danger + "0a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
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
