import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../context/I18nContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function GpaHistoryChart({ data }) {
  const { tokens } = useTheme();
  const { t } = useI18n();

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: tokens.muted, fontSize: 13, gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tokens.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        {t("Henüz veri yok.")}
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: d.label,
    gpa: d.value ? parseFloat(d.value.toFixed(2)) : 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 10, padding: "8px 12px", boxShadow: tokens.shadowLg
        }}>
          <div style={{ fontSize: 11, color: tokens.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: tokens.chartPrimary, display: "flex", alignItems: "baseline", gap: 4 }}>
            {payload[0].value.toFixed(2)}
            <span style={{ fontSize: 11, color: tokens.muted, fontWeight: 600 }}>GPA</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.chartPrimary} stopOpacity={1} />
              <stop offset="100%" stopColor={tokens.chartPrimary} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.border} opacity={0.5} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tokens.muted, fontSize: 11, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: tokens.muted, fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens.primary, opacity: 0.05 }} />
          <Bar dataKey="gpa" radius={[6, 6, 0, 0]} maxBarSize={42} animationDuration={600}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="url(#barGrad)"
                style={{ cursor: "pointer", transition: "opacity 150ms ease" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
