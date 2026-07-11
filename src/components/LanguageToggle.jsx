import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../context/I18nContext";

export default function LanguageToggle() {
  const { tokens, isDark } = useTheme();
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        title="Dil Seçimi"
        style={{
          width: 36,
          height: 36,
          borderRadius: "9999px",
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
          color: tokens?.textPrimary || (isDark ? "#fff" : "#000"),
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
          backdropFilter: "blur(4px)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 8,
          background: tokens?.surface || (isDark ? "#1e293b" : "#fff"),
          border: `1px solid ${tokens?.border || (isDark ? "#334155" : "#e2e8f0")}`,
          borderRadius: 12,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          zIndex: 100,
          minWidth: 120,
        }}>
          <button
            onClick={() => { setLanguage("tr"); setOpen(false); }}
            style={{
              display: "block", width: "100%", padding: "10px 16px",
              textAlign: "left", background: language === "tr" ? (tokens?.primary + "15" || "rgba(0,0,0,0.05)") : "transparent",
              color: tokens?.textPrimary || (isDark ? "#fff" : "#000"),
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: language === "tr" ? 600 : 400,
            }}
            onMouseEnter={(e) => { if (language !== "tr") e.currentTarget.style.background = tokens?.sidebarHover || "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e) => { if (language !== "tr") e.currentTarget.style.background = "transparent"; }}
          >
            Türkçe
          </button>
          <button
            onClick={() => { setLanguage("en"); setOpen(false); }}
            style={{
              display: "block", width: "100%", padding: "10px 16px",
              textAlign: "left", background: language === "en" ? (tokens?.primary + "15" || "rgba(0,0,0,0.05)") : "transparent",
              color: tokens?.textPrimary || (isDark ? "#fff" : "#000"),
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: language === "en" ? 600 : 400,
            }}
            onMouseEnter={(e) => { if (language !== "en") e.currentTarget.style.background = tokens?.sidebarHover || "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e) => { if (language !== "en") e.currentTarget.style.background = "transparent"; }}
          >
            English
          </button>
        </div>
      )}
    </div>
  );
}
