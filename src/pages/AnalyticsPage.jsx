import { useMemo } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../context/I18nContext";
import GpaHistoryChart from "../components/GpaHistoryChart";
import { hesaplaDönemOrt, hesaplaHarf } from "../hooks/useDersler";

function Card({ title, children }) {
  const { tokens } = useTheme();
  return (
    <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "20px 22px", boxShadow: tokens.shadowSm }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

export default function AnalyticsPage({ dersler, harfNotlari, stats }) {
  const { tokens } = useTheme();
  const { t } = useI18n();

  const donemStats = useMemo(() => {
    const aktifDonemler = new Set(dersler.filter((d) => d.vize > 0 || d.odev > 0 || d.proje > 0 || d.final > 0 || d.harfNotu).map((d) => d.donem));
    const map = new Map();
    dersler.forEach((d) => {
      if (!aktifDonemler.has(d.donem)) return;
      if (!map.has(d.donem)) map.set(d.donem, { kredi: 0, katsayiKredi: 0, dersSayisi: 0, gecen: 0 });
      const e = map.get(d.donem);
      
      const ort = hesaplaDönemOrt(d);
      let harf;
      if (!d.hasGrades) { harf = { harf: "-", katsayi: 0 }; }
      else { harf = d.harfNotu ? (harfNotlari.find((h) => h.harf === d.harfNotu) || { harf: d.harfNotu, katsayi: 0 }) : hesaplaHarf(ort, harfNotlari); }
      
      if (harf.harf !== "EK" && harf.harf !== "-") {
        e.katsayiKredi += harf.katsayi * d.kredi;
        e.kredi += d.kredi;
      }
      e.dersSayisi += 1;
      if (harf.harf !== "FF" && harf.harf !== "EK" && harf.harf !== "-") e.gecen += 1;
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([donem, v]) => ({
      donem, gano: v.kredi ? (v.katsayiKredi / v.kredi).toFixed(2) : "—", dersSayisi: v.dersSayisi, gecen: v.gecen,
    }));
  }, [dersler, harfNotlari]);

  const gradeDistribution = useMemo(() => {
    const aktifDonemler = new Set(dersler.filter((d) => d.vize > 0 || d.odev > 0 || d.proje > 0 || d.final > 0 || d.harfNotu).map((d) => d.donem));
    const counts = {};
    dersler.forEach((d) => {
      if (!aktifDonemler.has(d.donem)) return;
      const ort = hesaplaDönemOrt(d);
      let harf;
      if (!d.hasGrades) { harf = { harf: "-", katsayi: 0 }; }
      else { harf = d.harfNotu ? (harfNotlari.find((h) => h.harf === d.harfNotu) || { harf: d.harfNotu, katsayi: 0 }) : hesaplaHarf(ort, harfNotlari); }
      
      if (harf.harf === "EK" || harf.harf === "-") return;
      counts[harf.harf] = (counts[harf.harf] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    const harfOrder = ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "FF"];
    return harfOrder.filter((h) => counts[h]).map((h) => ({ harf: h, count: counts[h], pct: (counts[h] / max) * 100 }));
  }, [dersler, harfNotlari]);

  const trendData = donemStats.filter((d) => d.gano !== "—").map((d) => ({ label: `D${d.donem}`, value: Number(d.gano) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title={t("GPA Geçmişi")}><GpaHistoryChart data={trendData} /></Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card title={t("Dönem Karşılaştırması")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {donemStats.length === 0 && <div style={{ fontSize: 13, color: tokens.muted }}>{t("Henüz veri yok.")}</div>}
            {donemStats.map((d) => (
              <div key={d.donem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${tokens.border}` }}>
                <span style={{ fontSize: 13, color: tokens.textSecondary }}>{t("Dönem")} {d.donem}</span>
                <span style={{ fontSize: 13, color: tokens.muted }}>{d.gecen}/{d.dersSayisi} {t("geçti")}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: tokens.primary }}>{d.gano}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title={t("Harf Notu Dağılımı")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gradeDistribution.length === 0 && <div style={{ fontSize: 13, color: tokens.muted }}>{t("Henüz veri yok.")}</div>}
            {gradeDistribution.map((g) => (
              <div key={g.harf} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: tokens.textPrimary }}>{g.harf}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 99, background: tokens.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${g.pct}%`, background: tokens.chartPrimary, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, color: tokens.muted, width: 20, textAlign: "right" }}>{g.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title={t("Akademik Performans Metrikleri")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <Metric label={t("Genel GPA")} value={stats.gano} tokens={tokens} />
          <Metric label={t("Alınan Kredi")} value={stats.alinanKredi} tokens={tokens} />
          <Metric label={t("Geçilen Kredi")} value={stats.gecenKredi} tokens={tokens} />
          <Metric label={t("Tamamlanma")} value={`${stats.tamamlanmaOrani}%`} tokens={tokens} />
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, tokens }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: tokens.textPrimary }}>{value}</div>
    </div>
  );
}
