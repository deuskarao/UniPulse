import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
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

export default function Header({ sidebarWidth, pageTitle, donemler, aktifDonem, onDonemChange, onToggleCollapsed, collapsed }) {
  const { tokens, mode, toggleTheme, setMode } = useTheme();
  const { user, profile, logout, updateProfile } = useAuth();
  const { language, setLanguage, t } = useI18n();
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
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 150,
      paddingTop: mobil ? 0 : 20,
      marginLeft: mobil ? 0 : sidebarWidth + 20,
      marginRight: mobil ? 0 : 20,
      background: tokens.background, // Match app background to hide scrolling text above header
    }}>
      <header
        style={{
          height: 72,
          borderRadius: mobil ? 0 : 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          background: mode === "dark" ? "rgba(15, 22, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="up-header"
      >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary, letterSpacing: -0.2 }}>{t(pageTitle)}</span>
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

        <IconBtn tokens={tokens} label="Toggle Language" onClick={() => setLanguage(language === "tr" ? "en" : "tr")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </IconBtn>
        <IconBtn tokens={tokens} label="Toggle Theme" onClick={handleThemeToggle}>
          <ThemeIcon mode={mode} />
        </IconBtn>

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
                <a href="#" style={{ display: "block", padding: "10px 16px", color: tokens.textPrimary, textDecoration: "none", fontSize: 14 }}>{t("Hesabım")}</a>
                <a href="#" style={{ display: "block", padding: "10px 16px", color: tokens.textPrimary, textDecoration: "none", fontSize: 14 }}>{t("Ayarlar")}</a>
                <div style={{ height: 1, background: tokens.border, margin: "4px 0" }} />
                <button
                  onClick={logout}
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "10px 16px",
                    color: tokens.danger,
                    background: "none",
                    border: "none",
                    fontSize: 14,
                    textAlign: "left",
                    cursor: "pointer",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  {t("Çıkış Yap")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </div>
  );
}
