import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../context/I18nContext";

export default function CreditDonutChart({ gecenKredi, kalanKredi }) {
  const { tokens } = useTheme();
  const { t } = useI18n();
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
                <stop offset="100%" stopColor={tokens.primaryHover} />
              </linearGradient>
            </defs>

            {/* Track */}
            <circle cx="60" cy="60" r={r} fill="none" stroke={tokens.border} strokeWidth="14" opacity="0.6" />

            {/* Progress */}
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="url(#donutGrad)"
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{
                transition: "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            {/* Inner subtle ring */}
            <circle cx="60" cy="60" r="32" fill={tokens.surface} opacity="0.5" />

            <text x="60" y="60" textAnchor="middle" fontSize="22" fontWeight="800" fill={tokens.textPrimary} letterSpacing="-0.5">
              {Math.round(oran * 100)}<tspan fontSize="11" dy="-7" fill={tokens.muted}>%</tspan>
            </text>
            <text x="60" y="74" textAnchor="middle" fontSize="7" fill={tokens.muted} fontWeight="700" letterSpacing="0.8">
              {t("TAMAMLANDI")}
            </text>
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: tokens.primary + "08" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${tokens.chartPrimary}, ${tokens.primaryHover})` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{t("Tamamlanan")}</div>
          </div>
          <div style={{ fontSize: 15, color: tokens.textPrimary, fontWeight: 800 }}>
            {gecenKredi} <span style={{ fontSize: 11, fontWeight: 600, color: tokens.muted }}>{t("kredi")}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: tokens.warning + "08" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: tokens.warning, opacity: 0.6 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{t("Kalan")}</div>
          </div>
          <div style={{ fontSize: 15, color: tokens.textPrimary, fontWeight: 800 }}>
            {kalanKredi} <span style={{ fontSize: 11, fontWeight: 600, color: tokens.muted }}>{t("kredi")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
