import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";

export function Field({ label, children }) {
  const { tokens } = useTheme();
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: tokens.textSecondary,
          fontWeight: 600,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function Overlay({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}

export function hexToRgb(hex) {
  if (!hex || typeof hex !== "string" || hex.length < 7) return "124,58,237";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function useWindowSize() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

export function useInputStyle() {
  const { tokens } = useTheme();
  return {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    background: tokens.surface,
    border: `1px solid ${tokens.border}`,
    color: tokens.textPrimary,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };
}