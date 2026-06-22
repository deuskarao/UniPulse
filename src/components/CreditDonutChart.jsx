import { useTheme } from "../theme/ThemeProvider";

export default function CreditDonutChart({ gecenKredi, kalanKredi }) {
  const { tokens } = useTheme();
  const toplam = gecenKredi + kalanKredi || 1;
  const oran = gecenKredi / toplam;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * oran;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={tokens.chartPrimary} />
                <stop offset="100%" stopColor={tokens.primary} />
              </linearGradient>
              <filter id="donutGlow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="innerGlow">
                <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx="60" cy="60" r={r} fill="none" stroke={tokens.border} strokeWidth="16" opacity="0.2" />

            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="url(#donutGrad)"
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              filter="url(#donutGlow)"
              style={{
                transition: "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            <circle cx="60" cy="60" r="28" fill={tokens.surface} opacity="0.4" />

            <text x="60" y="62" textAnchor="middle" fontSize="20" fontWeight="900" fill={tokens.textPrimary} letterSpacing="-0.5" filter="url(#innerGlow)">
              %{Math.round(oran * 100)}
            </text>
            <text x="60" y="74" textAnchor="middle" fontSize="7.5" fill={tokens.muted} fontWeight="700" letterSpacing="0.5">
              tamamlandı
            </text>
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingX: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: `linear-gradient(135deg, ${tokens.chartPrimary}, ${tokens.primary})`, boxShadow: `0 0 12px ${tokens.chartPrimary}40` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Tamamlanan</div>
            <div style={{ fontSize: 15, color: tokens.textPrimary, fontWeight: 800, marginTop: 2 }}>
              {gecenKredi} <span style={{ fontSize: 11, fontWeight: 600, color: tokens.muted }}>kredi</span>
            </div>
          </div>
        </div>

        <div style={{ height: "1px", background: tokens.border, opacity: "0.3" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: tokens.border, opacity: "0.4" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Kalan</div>
            <div style={{ fontSize: 15, color: tokens.textPrimary, fontWeight: 800, marginTop: 2 }}>
              {kalanKredi} <span style={{ fontSize: 11, fontWeight: 600, color: tokens.muted }}>kredi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}