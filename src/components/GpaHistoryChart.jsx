import { useTheme } from "../theme/ThemeProvider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function GpaHistoryChart({ data }) {
  const { tokens } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.muted, fontSize: 13 }}>
        Henüz veri yok.
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
          borderRadius: 12, padding: "8px 12px", boxShadow: tokens.shadowLg
        }}>
          <div style={{ fontSize: 11, color: tokens.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: tokens.chartPrimary }}>
            GPA: {payload[0].value.toFixed(2)}
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
              <stop offset="100%" stopColor={tokens.primary} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.border} opacity={0.4} />
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens.surface, opacity: 0.4 }} />
          <Bar dataKey="gpa" radius={[6, 6, 0, 0]} maxBarSize={45}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="url(#barGrad)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}