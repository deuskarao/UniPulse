import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../theme/ThemeProvider";

const LANGUAGES = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" }
];

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle Language"
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${tokens.border}`,
          background: "transparent", color: tokens.textSecondary,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s ease"
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 12, padding: 6, width: 140,
          boxShadow: tokens.shadowLg, zIndex: 200,
          display: "flex", flexDirection: "column", gap: 2
        }}>
          {LANGUAGES.map(lang => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 8,
                  border: "none", background: isActive ? tokens.primary + "15" : "transparent",
                  color: isActive ? tokens.primary : tokens.textPrimary,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s ease"
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
