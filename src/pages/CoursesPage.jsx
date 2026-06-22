import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { Field, Overlay, useInputStyle, useWindowSize } from "../components/shared.jsx";
import { hesaplaDönemOrt, hesaplaHarf, harfRengi, hesaplaGerekliiFinal } from "../hooks/useDersler";

export default function CoursesPage({ bolum, profile, harfNotlari, harfRenk, siraliDersler, siralama, siralamaDegistir, modal, setModal, form, silOnay, setSilOnay, modalAc, formDegistir, kaydet, sil }) {
  const { tokens } = useTheme();
  const inputStyle = useInputStyle();
  const w = useWindowSize();
  const mobil = w < 768;
  const [search, setSearch] = useState("");
  const canEdit = profile?.role === "admin" || (bolum && profile?.department_id === bolum.id);
  const filtered = siraliDersler.filter((d) => d.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ders ara…" style={{ ...inputStyle, maxWidth: 280 }} />
        {canEdit && !mobil && <button onClick={() => modalAc("ekle")} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: tokens.primary, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+ Ders Ekle</button>}
      </div>
      <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, overflow: "hidden", boxShadow: tokens.shadowSm }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: tokens.sidebarHover }}>
                {[["Ders Adı", "left", 220, "ad"], ["D.", "center", 60, null], ["Kredi", "center", 60, null], ["Saat", "center", 56, null], ["Ağırlık", "center", 140, null], ["Ort.", "center", 60, null], ["Harf", "center", 60, "harf"], ["Kredi * Not", "center", 90, null], ["İşlem", "center", 110, null]].map(([h, align, colW, sortKey]) => (
                  <th key={h} onClick={sortKey ? () => siralamaDegistir(sortKey) : undefined} style={{ padding: "12px 14px", textAlign: align, width: colW, fontSize: 11, fontWeight: 700, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${tokens.border}`, whiteSpace: "nowrap", cursor: sortKey ? "pointer" : "default", userSelect: "none" }}>
                    {h}{sortKey && <span style={{ marginLeft: 4, opacity: siralama.kolon === sortKey ? 1 : 0.3 }}>{siralama.kolon === sortKey ? (siralama.yon === "asc" ? "▲" : "▼") : "▲"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: tokens.muted, fontSize: 13 }}>Ders bulunamadı.</td></tr>}
              {filtered.map((d, i) => {
                const ort = hesaplaDönemOrt(d);
                const otomatikHarf = hesaplaHarf(ort, harfNotlari);
                const harf = d.harfNotu ? harfNotlari.find((h) => h.harf === d.harfNotu) || otomatikHarf : otomatikHarf;
                const hr = harfRengi(harf.harf, harfRenk);
                const gFin = hesaplaGerekliiFinal(d);
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? tokens.surface : "transparent" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 500, color: tokens.textPrimary, fontSize: 13 }}>{d.ad}</div>
                      {d.final === 0 && <div style={{ fontSize: 11, color: tokens.warning, marginTop: 2 }}>Geçmek için final: {gFin.toFixed(0)}</div>}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 26, height: 24, padding: "0 8px", borderRadius: 7, background: tokens.primary + "18", color: tokens.primary, fontSize: 12, fontWeight: 700 }}>{d.donem}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: tokens.primary, fontWeight: 700, fontSize: 13 }}>{d.kredi}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: tokens.muted, fontSize: 13 }}>{d.dersSaati}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.textSecondary, background: tokens.sidebarHover, border: `1px solid ${tokens.border}`, borderRadius: 99, padding: "3px 10px" }}>{(d.vizeYuzde * 100).toFixed(0)} / {(d.odevYuzde * 100).toFixed(0)} / {(d.projeYuzde * 100).toFixed(0)} / {(d.finalYuzde * 100).toFixed(0)}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ fontWeight: 800, fontSize: 14, color: ort >= 70 ? tokens.success : ort >= 60 ? tokens.warning : tokens.danger }}>{ort.toFixed(1)}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 26, height: 24, padding: "0 8px", borderRadius: 7, background: hr + "18", color: hr, fontSize: 12, fontWeight: 700 }}>{harf.harf}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontSize: 13, fontWeight: 700, color: tokens.textSecondary }}>{(d.kredi * harf.katsayi).toFixed(2)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      {canEdit && <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => modalAc("duzenle", d)} style={{ border: `1px solid ${tokens.primary}30`, background: tokens.primary + "12", color: tokens.primary, borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 12 }}>✏️</button>
                        <button onClick={() => setSilOnay(d.id)} style={{ border: `1px solid ${tokens.danger}30`, background: tokens.danger + "12", color: tokens.danger, borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 12 }}>🗑</button>
                      </div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {silOnay && (
        <Overlay onClick={() => setSilOnay(null)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.danger}40`, borderRadius: 18, padding: "32px 28px", maxWidth: 340, width: "90%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: tokens.textPrimary, margin: "0 0 8px", fontSize: 17 }}>Dersi Sil</h3>
            <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 24px" }}>Bu ders kalıcı olarak silinecek. Emin misin?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setSilOnay(null)} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>İptal</button>
              <button onClick={sil} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: tokens.danger, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Sil</button>
            </div>
          </div>
        </Overlay>
      )}
      {modal && form && (
        <Overlay onClick={() => setModal(null)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 20, padding: 28, maxWidth: 560, width: "95%", maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: tokens.textPrimary, fontSize: 18, fontWeight: 700 }}>{modal.tip === "ekle" ? "Yeni Ders Ekle" : "Dersi Düzenle"}</h2>
              <button onClick={() => setModal(null)} style={{ background: tokens.sidebarHover, border: `1px solid ${tokens.border}`, color: tokens.muted, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="Ders Adı"><input value={form.ad || ""} onChange={(e) => formDegistir("ad", e.target.value)} onFocus={(e) => setTimeout(() => e.target.select(), 10)} placeholder="Ders adını girin…" style={inputStyle} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Dönem">
                  <div style={{ position: "relative" }}>
                    <select value={form.donem} onChange={(e) => formDegistir("donem", Number(e.target.value))} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", fontWeight: 600 }}>{Array.from({ length: bolum.toplamDonem }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}. Dönem</option>)}</select>
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: tokens.muted }}>▼</div>
                  </div>
                </Field>
                <Field label="Kredi"><input type="number" min="1" max="20" value={form.kredi === 0 ? "" : form.kredi} placeholder="0" onChange={(e) => formDegistir("kredi", Number(e.target.value))} onFocus={(e) => setTimeout(() => e.target.select(), 10)} style={inputStyle} /></Field>
                <Field label="Ders Saati"><input type="number" min="1" max="10" value={form.dersSaati === 0 ? "" : form.dersSaati} placeholder="0" onChange={(e) => formDegistir("dersSaati", Number(e.target.value))} onFocus={(e) => setTimeout(() => e.target.select(), 10)} style={inputStyle} /></Field>
              </div>
              <div style={{ background: tokens.primary + "0c", border: `1px solid ${tokens.primary}25`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, color: tokens.primary, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>Değerlendirme Ağırlıkları</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                  {[["vizeYuzde", "Vize"], ["odevYuzde", "Ödev"], ["projeYuzde", "Proje"], ["finalYuzde", "Final"]].map(([alan, label]) => (
                    <div key={alan}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: tokens.muted, fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 12, color: tokens.primary, fontWeight: 700 }}>{((form[alan] || 0) * 100).toFixed(0)}%</span>
                      </div>
                      {alan === "finalYuzde" ? <div style={{ height: 6, borderRadius: 99, background: tokens.primary, width: `${(form[alan] || 0) * 100}%`, minWidth: 4 }} /> : <input type="range" min="0" max="100" step="5" value={Math.round((form[alan] || 0) * 100)} onChange={(e) => formDegistir(alan, Number(e.target.value) / 100)} style={{ width: "100%", accentColor: tokens.primary, cursor: "pointer" }} />}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: tokens.sidebarHover, border: `1px solid ${tokens.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, color: tokens.primary, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>Notlar (0–100)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                  {[["vize", "Vize"], ["odev", "Ödev"], ["proje", "Proje"], ["final", "Final"]].map(([alan, label]) => (
                    <Field key={alan} label={label}><input type="number" min="0" max="100" value={form[alan] === 0 ? "" : (form[alan] || "")} placeholder="0" onChange={(e) => formDegistir(alan, e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value))))} onFocus={(e) => setTimeout(() => e.target.select(), 10)} style={inputStyle} /></Field>
                  ))}
                  <Field label="Harf Notu">
                    <div style={{ position: "relative" }}>
                      <select value={form.harfNotu || ""} onChange={(e) => formDegistir("harfNotu", e.target.value || null)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", fontWeight: 700, color: form.harfNotu ? tokens.primary : tokens.textPrimary }}>
                        <option value="">Oto</option>{harfNotlari.map((h) => <option key={h.harf} value={h.harf}>{h.harf}</option>)}
                      </select>
                      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: tokens.muted }}>▼</div>
                    </div>
                  </Field>
                </div>
              </div>
              {(() => {
                const ort = hesaplaDönemOrt(form);
                const otomatikHarf = hesaplaHarf(ort, harfNotlari);
                const harf = form.harfNotu ? (harfNotlari.find((h) => h.harf === form.harfNotu) || otomatikHarf) : otomatikHarf;
                const hr = harfRengi(harf.harf, {});
                return (
                  <div style={{ background: tokens.primary + "0c", border: `1px solid ${hr}30`, borderRadius: 14, padding: "14px 20px", display: "flex", justifyContent: "space-around" }}>
                    {[["DÖNEM ORT.", ort.toFixed(1), ort >= 60 ? tokens.success : tokens.danger], ["HARF NOTU", harf.harf, hr], ["KATSAYI", harf.katsayi.toFixed(2), tokens.primary]].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: tokens.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>İptal</button>
              <button onClick={kaydet} disabled={!form.ad?.trim()} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: !form.ad?.trim() ? tokens.border : tokens.primary, color: !form.ad?.trim() ? tokens.muted : "#fff", cursor: !form.ad?.trim() ? "default" : "pointer", fontWeight: 600, fontSize: 13 }}>{modal.tip === "ekle" ? "Dersi Ekle" : "Değişiklikleri Kaydet"}</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
