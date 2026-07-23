import { useMemo } from "react";
import { useTheme } from "../theme/ThemeProvider";
import KpiCard from "../components/KpiCard";
import GpaTrendChart from "../components/GpaTrendChart";
import CreditDonutChart from "../components/CreditDonutChart";
import { hesaplaDönemOrt, hesaplaHarf } from "../hooks/useDersler";
import { useHedefGano } from "../hooks/useHedefGano";
import { useI18n } from "../context/I18nContext";

// Mini sparkline — "Bu Dönem" kartında seçili dönem notlarını gösterir
function MiniSparkline({ dersler, color, height = 28 }) {
  const { tokens } = useTheme();
  const { t } = useI18n();
  if (!dersler || dersler.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: tokens.muted, fontStyle: "italic" }}>
        {t("Bu dönem için not yok")}
      </div>
    );
  }
  const values = dersler.map(d => Math.min(100, Math.max(0, d.ort)));
  const max = 100;
  const w = 100;
  const h = height;
  const padding = 2;
  const stepX = (w - padding * 2) / Math.max(1, values.length - 1);
  const points = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = h - padding - (v / max) * (h - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${padding + (values.length - 1) * stepX},${h - padding} L ${padding},${h - padding} Z`;
  const lastIdx = values.length - 1;
  const lastX = padding + lastIdx * stepX;
  const lastY = h - padding - (values[lastIdx] / max) * (h - padding * 2);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Hedef çizgisi (60 = geçme barajı) */}
      <line
        x1={padding} y1={h - padding - (60 / max) * (h - padding * 2)}
        x2={w - padding} y2={h - padding - (60 / max) * (h - padding * 2)}
        stroke={tokens.border} strokeWidth="0.5" strokeDasharray="2 2"
      />
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} stroke={tokens.card} strokeWidth="1" />
    </svg>
  );
}

function SectionCard({ title, subtitle, children }) {
  const { tokens } = useTheme();
  return (
    <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: tokens.shadowSm, transition: "box-shadow 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 14, background: `linear-gradient(180deg, ${tokens.primary}, ${tokens.primaryHover})`, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: tokens.textPrimary, letterSpacing: -0.1 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: tokens.muted, marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

const ICONS = {
  term: (color = "currentColor") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  overall: (color = "currentColor") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
    </svg>
  ),
  courses: (color = "currentColor") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  credits: (color = "currentColor") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  target: (color = "currentColor") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  activity: (color = "currentColor") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  book: (color = "currentColor") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  alert: (color = "currentColor") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

export default function DashboardPage({ dersler, stats, harfNotlari, bolum, aktifDonem: aktifDonemProp }) {
  const { tokens } = useTheme();
  const { hedefGano } = useHedefGano();
  const { t } = useI18n();

  const gpaTrendData = useMemo(() => {
    const aktifDonemler = new Set(dersler.filter((d) => d.vize > 0 || d.odev > 0 || d.proje > 0 || d.final > 0 || d.harfNotu).map((d) => d.donem));
    const donemMap = new Map();

    dersler.forEach((d) => {
      if (!aktifDonemler.has(d.donem)) return;
      const ort = hesaplaDönemOrt(d);
      let harf;
      if (!d.hasGrades) { harf = { harf: "-", katsayi: 0 }; }
      else { harf = d.harfNotu ? (harfNotlari.find((h) => h.harf === d.harfNotu) || { harf: d.harfNotu, katsayi: 0 }) : hesaplaHarf(ort, harfNotlari); }
      
      if (harf.harf === "EK" || harf.harf === "-") return;

      if (!donemMap.has(d.donem)) donemMap.set(d.donem, { katsayiKredi: 0, kredi: 0 });
      const entry = donemMap.get(d.donem);
      entry.katsayiKredi += harf.katsayi * d.kredi;
      entry.kredi += d.kredi;
    });

    const sonDonem = bolum?.toplamDonem || Math.max(1, ...Array.from(donemMap.keys(), Number), ...dersler.map((d) => d.donem));
    return Array.from({ length: sonDonem }, (_, i) => i + 1).map((donem) => {
      const entry = donemMap.get(donem);
      return { label: `D${donem}`, value: entry && entry.kredi ? entry.katsayiKredi / entry.kredi : 0 };
    });
  }, [dersler, harfNotlari, bolum]);

  // Seçili dönemin ders listesi (sparkline için)
  const seciliDonemDersler = useMemo(() => {
    if (!aktifDonemProp || aktifDonemProp === "tumu") return [];
    return dersler
      .filter((d) => d.donem === Number(aktifDonemProp))
      .map((d) => ({ ...d, ort: hesaplaDönemOrt(d) }))
      .filter((d) => d.ort > 0);
  }, [dersler, aktifDonemProp]);

  const { riskli, yaklasan, guclu } = stats;

  // Hedef hesaplamaları
  const genelGano = parseFloat(stats.gano) || 0;
  const hedefMesafesi = Math.max(0, hedefGano - genelGano).toFixed(2);

  // "Bu dönem için öneri" — son aktif döneme göre akıllı ipucu
  const sonDonemGano = stats.secilDonemGano ? parseFloat(stats.secilDonemGano) : null;
  const donemYon = sonDonemGano === null ? null : sonDonemGano >= genelGano ? "yukari" : "asagi";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* === KPI Kartları — Yeni Sıra === */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <KpiCard
          label={t("Dönem Ortalaması")}
          value={stats.secilDonemGano ?? "—"}
          suffix={stats.secilDonemGano ? "/ 4.00" : ""}
          accent={tokens.primary}
          iconColor={tokens.primary}
          icon={ICONS.term(tokens.primary)}
        />
        <KpiCard
          label={t("Genel Ortalama")}
          value={stats.gano}
          suffix="/ 4.00"
          accent={genelGano >= hedefGano ? tokens.success : tokens.warning}
          iconColor={genelGano >= hedefGano ? tokens.success : tokens.warning}
          icon={ICONS.overall(genelGano >= hedefGano ? tokens.success : tokens.warning)}
        />
        <KpiCard
          label={t("Kredi (Kazanılan / Toplam)")}
          fraction={stats.gecenKredi}
          fractionTotal={stats.alinanKredi}
          accent={tokens.primary}
          iconColor={tokens.textSecondary}
          icon={ICONS.credits(tokens.textSecondary)}
        />
        <KpiCard
          label={t("Dersler (Geçilen / Toplam)")}
          fraction={stats.gecen}
          fractionTotal={stats.toplam}
          accent={tokens.success}
          iconColor={tokens.success}
          icon={ICONS.courses(tokens.success)}
        />
      </div>

      {/* === Grafikler === */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <SectionCard title={t("GPA Trendi")} subtitle={t("Dönem bazında ortalama gelişimi")}>
          <GpaTrendChart data={gpaTrendData} />
        </SectionCard>
        <SectionCard title={t("Kredi Tamamlama")} subtitle={`${stats.tamamlanmaOrani}% ${t("toplam ilerleme")}`}>
          <CreditDonutChart gecenKredi={stats.gecenKredi} kalanKredi={stats.kalanKredi} />
        </SectionCard>
      </div>

      {/* === Hedef Takibi === */}
      <SectionCard
        title={t("Hedef Takibi")}
        subtitle={`${t("Onur derecesi için")} ${hedefGano.toFixed(2)} ${t("hedefi")}`}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {/* Hedef kartı */}
          <div style={{
            padding: "16px 18px",
            borderRadius: 12,
            background: tokens.primary + "08",
            border: `1px solid ${tokens.primary}20`,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: tokens.primary + "15", color: tokens.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ICONS.target(tokens.primary)}
              </div>
              <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{t("Hedef GPA")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: tokens.primary }}>{hedefGano.toFixed(2)}</span>
              <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 600 }}>/ 4.00</span>
            </div>
            <div style={{ fontSize: 11.5, color: tokens.textSecondary, fontWeight: 500 }}>
              {genelGano >= hedefGano
                ? `${t("Hedefe ulaştın, tebrikler!")} ${genelGano.toFixed(2)} / ${hedefGano.toFixed(2)}`
                : `${t("Hedefe")} ${hedefMesafesi} ${t("puan kaldı")}`}
            </div>
          </div>

          {/* İlerleme çubuğu — çift işaretçi (mevcut + hedef) */}
          <div style={{
            padding: "16px 18px",
            borderRadius: 12,
            background: tokens.surface,
            border: `1px solid ${tokens.border}`,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            {/* Üst legend: İlerleme % • Mevcut • Hedef */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{t("İlerleme")}</span>
              <div style={{ display: "flex", gap: 10, fontSize: 11, fontWeight: 700 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: tokens.primary }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: tokens.primary, display: "inline-block" }} />
                  {genelGano.toFixed(2)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: tokens.success }}>
                  <span style={{ width: 8, height: 8, borderRadius: 1, background: tokens.success, display: "inline-block" }} />
                  {hedefGano.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bar — iki işaretçi ile */}
            <div style={{ position: "relative", height: 14, padding: "0 4px" }}>
              {/* Track */}
              <div style={{
                position: "absolute", left: 4, right: 4, top: 2, bottom: 2,
                borderRadius: 99, background: tokens.border, overflow: "hidden",
              }}>
                {/* Mevcut ilerleme dolgusu */}
                <div style={{
                  height: "100%",
                  width: `${(genelGano / 4) * 100}%`,
                  background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.primaryHover})`,
                  borderRadius: 99,
                  transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                }} />
              </div>

              {/* Hedef çizgisi (yeşil dikey çizgi) */}
              <div style={{
                position: "absolute",
                left: `calc(${(hedefGano / 4) * 100}% + 4px - 1.5px)`,
                top: -2, bottom: -2,
                width: 3,
                background: tokens.success,
                borderRadius: 99,
                boxShadow: `0 0 0 1px ${tokens.surface}`,
              }} />

              {/* Mevcut GPA noktası (primary daire) */}
              <div style={{
                position: "absolute",
                left: `calc(${(genelGano / 4) * 100}% + 4px - 6px)`,
                top: 1,
                width: 12, height: 12,
                borderRadius: "50%",
                background: tokens.primary,
                border: `2px solid ${tokens.card}`,
                boxShadow: `0 2px 6px ${tokens.primary}50`,
                transition: "left 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>

            {/* Alt etiketler: sadece 0.00 ve 4.00 */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: tokens.muted, fontWeight: 600 }}>
              <span>0.00</span>
              {genelGano >= hedefGano && (
                <span style={{ color: tokens.success, fontWeight: 700 }}>✓ {t("Hedef geçildi")}</span>
              )}
              <span>4.00</span>
            </div>
          </div>

          {/* Bu dönem özeti */}
          <div style={{
            padding: "16px 18px",
            borderRadius: 12,
            background: (donemYon === "yukari" ? tokens.success : donemYon === "asagi" ? tokens.warning : tokens.surface) + "08",
            border: `1px solid ${(donemYon === "yukari" ? tokens.success : donemYon === "asagi" ? tokens.warning : tokens.border)}25`,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: (donemYon === "yukari" ? tokens.success : donemYon === "asagi" ? tokens.warning : tokens.primary) + "15",
                color: donemYon === "yukari" ? tokens.success : donemYon === "asagi" ? tokens.warning : tokens.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {ICONS.activity(donemYon === "yukari" ? tokens.success : donemYon === "asagi" ? tokens.warning : tokens.primary)}
              </div>
              <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {stats.secilDonemGano ? t("Bu Dönem") : t("Dönem Seçilmedi")}
              </span>
            </div>
            {sonDonemGano !== null ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: tokens.textPrimary }}>{sonDonemGano.toFixed(2)}</span>
                  <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 600 }}>/ 4.00</span>
                </div>
                <div style={{ fontSize: 11.5, color: tokens.textSecondary, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  {donemYon === "yukari" ? (
                    <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tokens.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg> {t("Genelden")} {Math.abs(sonDonemGano - genelGano).toFixed(2)} {t("yukarıda")}</>
                  ) : (
                    <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tokens.warning} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> {t("Genelden")} {Math.abs(sonDonemGano - genelGano).toFixed(2)} {t("aşağıda")}</>
                  )}
                </div>
                {/* Mini sparkline — bu dönemki ders ortalamaları */}
                {seciliDonemDersler.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 10, color: tokens.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      {t("Ders Ortalamaları")} · {seciliDonemDersler.length} {t("ders")}
                    </div>
                    <MiniSparkline
                      dersler={seciliDonemDersler}
                      color={donemYon === "yukari" ? tokens.success : tokens.warning}
                      height={32}
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: tokens.muted, fontWeight: 500 }}>
                {t("Dönem seçerek detaylı karşılaştırma gör")}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* === Ders Performansı (eski Performans Analizi yerine) === */}
      <SectionCard
        title={t("Ders Performansı")}
        subtitle={t("Not durumuna göre kategorize edilmiş dersler")}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <PerformanceList
            title={t("Riskli Dersler")}
            subtitle={`${riskli.length} ${t("ders dikkat gerektiriyor")}`}
            items={riskli}
            tone="danger"
            emptyText={t("Riskli ders yok, harika gidiyorsun")}
            icon={ICONS.alert(tokens.danger)}
            tokens={tokens}
          />
          <PerformanceList
            title={t("Geçmeye Yakın")}
            subtitle={`${yaklasan.length} ${t("ders sınırda")}`}
            items={yaklasan}
            tone="warning"
            emptyText={t("Bu kategoride ders yok")}
            icon={ICONS.alert(tokens.warning)}
            tokens={tokens}
          />
          <PerformanceList
            title={t("Güçlü Dersler")}
            subtitle={`${guclu.length} ${t("ders 85+ ortalama")}`}
            items={guclu}
            tone="success"
            emptyText={t("Henüz güçlü ders yok")}
            icon={ICONS.book(tokens.success)}
            tokens={tokens}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function PerformanceList({ title, subtitle, items, tone, emptyText, icon, tokens }) {
  const { t } = useI18n();
  const color = tokens[tone];
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 12,
      background: color + "06",
      border: `1px solid ${color}15`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "15", color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color }}>{title}</div>
          <div style={{ fontSize: 10.5, color: tokens.muted, marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 11.5, color: tokens.muted, padding: "4px 0", fontStyle: "italic" }}>{emptyText}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.slice(0, 5).map((d) => (
            <div key={d.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: 12, padding: "6px 10px", borderRadius: 7,
              background: tokens.card, border: `1px solid ${tokens.border}`,
            }}>
              <span style={{ color: tokens.textPrimary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{d.ad}</span>
              <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{d.ort.toFixed(1)}</span>
            </div>
          ))}
          {items.length > 5 && (
            <div style={{ fontSize: 10.5, color: tokens.muted, textAlign: "center", padding: "6px 0", fontWeight: 500 }}>
              +{items.length - 5} {t("ders daha")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
