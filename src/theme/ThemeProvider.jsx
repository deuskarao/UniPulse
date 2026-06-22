import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const THEME_TOKENS = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    primary: "#7C3AED",
    primaryHover: "#6D28D9",
    primaryLight: "#F3E8FF",
    success: "#22C55E",
    successLight: "#F0FDF4",
    warning: "#F59E0B",
    warningLight: "#FFFBEB",
    danger: "#EF4444",
    dangerLight: "#FEF2F2",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    muted: "#64748B",
    border: "#E2E8F0",
    sidebar: "#FFFFFF",
    sidebarActive: "#F3E8FF",
    sidebarHover: "#F8FAFC",
    chartPrimary: "#7C3AED",
    shadowSm: "0 1px 3px rgba(0,0,0,.08)",
    shadowMd: "0 4px 12px rgba(0,0,0,.06)",
    shadowLg: "0 8px 24px rgba(0,0,0,.06)",
    glow: "none",
    input: "#F1F5F9",
  },
  dark: {
    background: "#070B14",
    surface: "#0F172A",
    card: "#111827",
    primary: "#8B5CF6",
    primaryHover: "#A78BFA",
    primaryLight: "#1E1B4B",
    success: "#22C55E",
    successLight: "#052E16",
    warning: "#F59E0B",
    warningLight: "#451A03",
    danger: "#EF4444",
    dangerLight: "#450A0A",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    muted: "#94A3B8",
    border: "#1E293B",
    sidebar: "#0B1220",
    sidebarActive: "#1E1B4B",
    sidebarHover: "#111827",
    chartPrimary: "#8B5CF6",
    shadowSm: "0 1px 3px rgba(0,0,0,.4)",
    shadowMd: "0 4px 12px rgba(0,0,0,.3)",
    shadowLg: "0 8px 24px rgba(0,0,0,.35)",
    glow: "0 0 20px rgba(139,92,246,.15)",
    input: "#1E293B",
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
