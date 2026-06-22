import { useTheme } from "../theme/ThemeProvider";

export default function KpiCard({ label, value, suffix, accent, icon }) {
  const { tokens } = useTheme();
  return (
    <div
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: tokens.shadowSm,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: tokens.muted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </span>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: accent || tokens.textPrimary, letterSpacing: -0.5 }}>
          {value}
        </span>
        {suffix && <span style={{ fontSize: 13, color: tokens.muted, fontWeight: 600 }}>{suffix}</span>}
      </div>
    </div>
  );
}