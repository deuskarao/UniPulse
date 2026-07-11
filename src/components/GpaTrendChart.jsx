import { useTheme } from "../theme/ThemeProvider";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function GpaTrendChart({ data }) {
  const { tokens } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: tokens.muted, fontSize: 13, gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tokens.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Henüz dönem verisi yok.
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
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.chartPrimary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={tokens.chartPrimary} stopOpacity={0} />
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: tokens.chartPrimary, strokeWidth: 1, strokeDasharray: "4 4", strokeOpacity: 0.4 }} />
          <Area
            type="monotone"
            dataKey="gpa"
            stroke={tokens.chartPrimary}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorGpa)"
            activeDot={{ r: 5, fill: tokens.chartPrimary, stroke: tokens.card, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
