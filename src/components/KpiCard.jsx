import { useTheme } from "../theme/ThemeProvider";

export default function KpiCard({ label, value, suffix, accent, icon, iconColor, fraction, fractionTotal }) {
  const { tokens } = useTheme();
  const color = iconColor || accent || tokens.primary;

  // Fraction modu: "19/23" şeklinde gösterim (geçilen/alınan)
  const hasFraction = fraction !== undefined && fractionTotal !== undefined;

  return (
    <div
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: tokens.shadowSm,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadowMd; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = color + "40"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = tokens.shadowSm; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = tokens.border; }}
    >
      {/* Subtle accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: 0.7,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: tokens.muted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        {icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: color + "12",
            color: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        {hasFraction ? (
          <>
            <span style={{ fontSize: 28, fontWeight: 800, color: accent || tokens.textPrimary, letterSpacing: -0.5 }}>
              {fraction}
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: tokens.muted, letterSpacing: -0.3 }}>
              / {fractionTotal}
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 28, fontWeight: 800, color: accent || tokens.textPrimary, letterSpacing: -0.5 }}>
              {value}
            </span>
            {suffix && <span style={{ fontSize: 13, color: tokens.muted, fontWeight: 600 }}>{suffix}</span>}
          </>
        )}
      </div>
    </div>
  );
}
