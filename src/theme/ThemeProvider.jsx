import { createContext, useContext, useEffect, useState, useCallback } from "react";

/*
  UniPulse Design Tokens v3 — "Professional Tech"
  Palette: Blue (#2563EB / #3B82F6)
  Style:   Modern Minimal — Corporate/Professional
  Semantic: Yeşil · Amber · Kırmızı
*/
export const THEME_TOKENS = {
  light: {
    background: "#FDFDFE",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    primary: "#0EA5E9",       // Ocean Blue
    primaryHover: "#0284C7",
    primaryLight: "#E0F2FE",
    success: "#10B981",
    successLight: "#ECFDF5",
    warning: "#F59E0B",
    warningLight: "#FFFBEB",
    danger: "#EF4444",
    dangerLight: "#FEF2F2",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    muted: "#94A3B8",
    border: "#E2E8F0",
    sidebar: "#FFFFFF",
    sidebarActive: "#E0F2FE",
    sidebarHover: "#F8FAFC",
    chartPrimary: "#0EA5E9",
    chartSecondary: "#10B981",
    chartTertiary: "#F59E0B",
    shadowSm: "0 2px 4px 0 rgba(15, 23, 42, 0.02), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
    shadowMd: "0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
    shadowLg: "0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
    glow: "0 0 0 1px rgba(14, 165, 233, 0.1)",
    input: "#F8FAFC",
  },
  dark: {
    background: "#030712",    // Deep Black
    surface: "#0B1120",       // Deep Navy
    card: "#0F172A",
    primary: "#38BDF8",       // Neon Sky Blue (No purple)
    primaryHover: "#7DD3FC",
    primaryLight: "#0369A1",
    success: "#10B981",
    successLight: "#064E3B",
    warning: "#F59E0B",
    warningLight: "#78350F",
    danger: "#EF4444",
    dangerLight: "#7F1D1D",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    muted: "#64748B",
    border: "#1E293B",
    sidebar: "#030712",
    sidebarActive: "#0C4A6E",
    sidebarHover: "#0F172A",
    chartPrimary: "#38BDF8",
    chartSecondary: "#34D399",
    chartTertiary: "#FBBF24",
    shadowSm: "0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    shadowMd: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)",
    shadowLg: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
    glow: "0 0 0 1px rgba(56, 189, 248, 0.2)",
    input: "#0F172A",
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
