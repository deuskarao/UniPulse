import { createContext, useContext, useEffect, useState, useCallback } from "react";

/*
  UniPulse Design Tokens v3 — "Professional Tech"
  Palette: Blue (#2563EB / #3B82F6)
  Style:   Modern Minimal — Corporate/Professional
  Semantic: Yeşil · Amber · Kırmızı
*/
export const THEME_TOKENS = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    primaryLight: "#DBEAFE",
    success: "#059669",
    successLight: "#ECFDF5",
    warning: "#D97706",
    warningLight: "#FFFBEB",
    danger: "#DC2626",
    dangerLight: "#FEF2F2",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    muted: "#64748B",
    border: "#E2E8F0",
    sidebar: "#FFFFFF",
    sidebarActive: "#DBEAFE",
    sidebarHover: "#F8FAFC",
    chartPrimary: "#2563EB",
    chartSecondary: "#10B981",
    chartTertiary: "#F59E0B",
    shadowSm: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
    shadowMd: "0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
    shadowLg: "0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)",
    glow: "0 0 0 1px rgba(37, 99, 235, 0.08)",
    input: "#F8FAFC",
  },
  dark: {
    background: "#0A0F1C",
    surface: "#0F1623",
    card: "#131A2A",
    primary: "#3B82F6",
    primaryHover: "#60A5FA",
    primaryLight: "#1E3A8A",
    success: "#10B981",
    successLight: "#052E1A",
    warning: "#F59E0B",
    warningLight: "#451A03",
    danger: "#EF4444",
    dangerLight: "#450A0A",
    textPrimary: "#F1F5F9",
    textSecondary: "#CBD5E1",
    muted: "#94A3B8",
    border: "#1F2937",
    sidebar: "#070B14",
    sidebarActive: "#1E3A8A",
    sidebarHover: "#111827",
    chartPrimary: "#3B82F6",
    chartSecondary: "#34D399",
    chartTertiary: "#FBBF24",
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.20), 0 1px 3px 0 rgba(0, 0, 0, 0.25)",
    shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.30), 0 2px 4px -2px rgba(0, 0, 0, 0.25)",
    shadowLg: "0 12px 24px -6px rgba(0, 0, 0, 0.40), 0 4px 8px -2px rgba(0, 0, 0, 0.30)",
    glow: "0 0 24px rgba(59, 130, 246, 0.18)",
    input: "#0F1623",
  },
};

const STORAGE_KEY = "unipulse-theme";

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialMode() {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "dark";
}

export function ThemeProvider({ children, initialTheme }) {
  const [mode, setModeState] = useState(() => initialTheme || getInitialMode());
  const resolvedMode = mode === "system" ? getSystemTheme() : mode;
  const tokens = THEME_TOKENS[resolvedMode];

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
    document.documentElement.setAttribute("data-theme", newMode);
    document.documentElement.style.colorScheme = newMode === "system" ? getSystemTheme() : newMode;
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(resolvedMode === "dark" ? "light" : "dark");
  }, [resolvedMode, setMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedMode);
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.setAttribute("data-theme", getSystemTheme());
      document.documentElement.style.colorScheme = getSystemTheme();
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  useEffect(() => {
    if (initialTheme && initialTheme !== mode) {
      setMode(initialTheme);
    }
  }, [initialTheme]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, tokens, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
