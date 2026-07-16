import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../context/I18nContext";
import { Field, Overlay, useInputStyle, useWindowSize } from "../components/shared.jsx";
import { hesaplaDönemOrt, hesaplaHarf, harfRengi, hesaplaGerekliiFinal } from "../hooks/useDersler";

export default function CoursesPage({ bolum, profile, harfNotlari, harfRenk, siraliDersler, siralama, siralamaDegistir, modal, setModal, form, silOnay, setSilOnay, modalAc, formDegistir, kaydet, sil }) {
  const { tokens } = useTheme();
  const { t, translateName } = useI18n();
  const inputStyle = useInputStyle();
  const w = useWindowSize();
  const mobil = w < 768;
  const [search, setSearch] = useState("");
  const canEdit = profile?.role === "admin" || (bolum && profile?.department_id === bolum.id);
  const filtered = siraliDersler.filter((d) => d.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Ders ara…")} style={{ ...inputStyle, maxWidth: 280 }} />
        {canEdit && <button onClick={() => modalAc("ekle")} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryHover})`, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, boxShadow: `0 4px 12px ${tokens.primary}30`, transition: "all 0.15s", whiteSpace: "nowrap" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${tokens.primary}40`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 12px ${tokens.primary}30`; }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> {t("Ders Ekle")}</button>}
      </div>
      <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, overflow: "hidden", boxShadow: tokens.shadowSm }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: tokens.sidebarHover }}>
                {[[t("Ders Adı"), "left", 220, "ad"], [t("D."), "center", 60, null], [t("Kredi"), "center", 60, null], [t("Saat"), "center", 56, null], [t("Ağırlık"), "center", 140, null], [t("Ort."), "center", 60, null], [t("Harf"), "center", 60, "harf"], [t("Kredi * Not"), "center", 90, null], [t("İşlem"), "center", 110, null]].map(([h, align, colW, sortKey]) => (
                  <th key={h} onClick={sortKey ? () => siralamaDegistir(sortKey) : undefined} style={{ padding: "12px 14px", textAlign: align, width: colW, fontSize: 11, fontWeight: 700, color: tokens.muted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${tokens.border}`, whiteSpace: "nowrap", cursor: sortKey ? "pointer" : "default", userSelect: "none" }}>
                    {h}{sortKey && <span style={{ marginLeft: 4, opacity: siralama.kolon === sortKey ? 1 : 0.3 }}>{siralama.kolon === sortKey ? (siralama.yon === "asc" ? "▲" : "▼") : "▲"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: tokens.muted, fontSize: 13 }}>{t("Ders bulunamadı.")}</td></tr>}
              {filtered.map((d, i) => {
                const ort = hesaplaDönemOrt(d);
                const otomatikHarf = hesaplaHarf(ort, harfNotlari);
                const harf = d.harfNotu ? harfNotlari.find((h) => h.harf === d.harfNotu) || otomatikHarf : otomatikHarf;
                const hr = harfRengi(harf.harf, harfRenk);
                const gFin = hesaplaGerekliiFinal(d);
                return (
                  <tr key={d.id} className="up-row-hover" style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? tokens.surface : "transparent", transition: "background 150ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = tokens.primary + "08"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? tokens.surface : "transparent"; }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 500, color: tokens.textPrimary, fontSize: 13 }}>{d.ad}</div>
                      {d.final === 0 && <div style={{ fontSize: 11, color: tokens.warning, marginTop: 2 }}>{t("Geçmek için final:")} {gFin.toFixed(0)}</div>}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 26, height: 24, padding: "0 8px", borderRadius: 7, background: tokens.primary + "18", color: tokens.primary, fontSize: 12, fontWeight: 700 }}>{d.donem}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: tokens.primary, fontWeight: 700, fontSize: 13 }}>{d.kredi}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: tokens.muted, fontSize: 13 }}>{d.dersSaati}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ fontSize: 11.5, fontWeight: 700, color: tokens.textSecondary, background: tokens.sidebarHover, border: `1px solid ${tokens.border}`, borderRadius: 99, padding: "3px 10px" }}>{d.buteKaldi ? `${(d.vizeYuzde * 100).toFixed(0)} / ${(d.finalYuzde * 100).toFixed(0)}` : `${(d.vizeYuzde * 100).toFixed(0)} / ${(d.odevYuzde * 100).toFixed(0)} / ${(d.projeYuzde * 100).toFixed(0)} / ${(d.finalYuzde * 100).toFixed(0)}`}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><span style={{ fontWeight: 800, fontSize: 14, color: ort >= 70 ? tokens.success : ort >= 60 ? tokens.warning : tokens.danger }}>{ort.toFixed(1)}</span></td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: 30, height: 26, padding: "0 10px", borderRadius: 7,
                        background: hr, color: "#fff",
                        fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
                        boxShadow: `0 2px 6px ${hr}30`,
                        textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                      }}>{harf.harf}</span>
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontSize: 13, fontWeight: 700, color: tokens.textSecondary }}>{(d.kredi * harf.katsayi).toFixed(2)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      {canEdit && <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => modalAc("duzenle", d)} title={t("Düzenle")} style={{ border: `1px solid ${tokens.primary}30`, background: tokens.primary + "10", color: tokens.primary, borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = tokens.primary + "20"; e.currentTarget.style.borderColor = tokens.primary + "50"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = tokens.primary + "10"; e.currentTarget.style.borderColor = tokens.primary + "30"; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setSilOnay(d.id)} title={t("Sil")} style={{ border: `1px solid ${tokens.danger}30`, background: tokens.danger + "10", color: tokens.danger, borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = tokens.danger + "20"; e.currentTarget.style.borderColor = tokens.danger + "50"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = tokens.danger + "10"; e.currentTarget.style.borderColor = tokens.danger + "30"; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
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
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", background: tokens.danger + "12", border: `1px solid ${tokens.danger}25`, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.danger }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>
            <h3 style={{ color: tokens.textPrimary, margin: "0 0 8px", fontSize: 17 }}>{t("Dersi Sil")}</h3>
            <p style={{ color: tokens.muted, fontSize: 13, margin: "0 0 24px" }}>{t("Bu ders kalıcı olarak silinecek. Emin misin?")}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setSilOnay(null)} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{t("İptal")}</button>
              <button onClick={sil} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: tokens.danger, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{t("Sil")}</button>
            </div>
          </div>
        </Overlay>
      )}
      {modal && form && (
        <Overlay onClick={() => setModal(null)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 20, padding: mobil ? 20 : 28, maxWidth: 560, width: "95%", maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: tokens.textPrimary, fontSize: 18, fontWeight: 700 }}>{modal.tip === "ekle" ? t("Yeni Ders Ekle") : t("Dersi Düzenle")}</h2>
              <button onClick={() => setModal(null)} style={{ background: tokens.sidebarHover, border: `1px solid ${tokens.border}`, color: tokens.muted, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <Field label={t("Ders Adı")}><input value={form.ad || ""} onChange={(e) => formDegistir("ad", e.target.value)} onFocus={(e) => setTimeout(() => e.target.select(), 10)} placeholder={t("Ders adını girin…")} style={inputStyle} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: mobil ? "1fr" : "1fr 1fr 1fr 1fr", gap: 12 }}>
                <Field label={t("Dönem")}>
                  <div style={{ position: "relative" }}>
                    <select value={form.donem} onChange={(e) => formDegistir("donem", Number(e.target.value))} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", fontWeight: 600 }}>{Array.from({ length: bolum.toplamDonem }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}. {t("Dönem")}</option>)}</select>
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: tokens.muted }}>▼</div>
                  </div>
                </Field>
                <Field label={t("Kredi")}><input type="number" min="1" max="20" value={form.kredi === 0 ? "" : form.kredi} placeholder="0" onChange={(e) => formDegistir("kredi", Number(e.target.value))} onFocus={(e) => setTimeout(() => e.target.select(), 10)} style={inputStyle} /></Field>
                <Field label={t("Ders Saati")}><input type="number" min="1" max="10" value={form.dersSaati === 0 ? "" : form.dersSaati} placeholder="0" onChange={(e) => formDegistir("dersSaati", Number(e.target.value))} onFocus={(e) => setTimeout(() => e.target.select(), 10)} style={inputStyle} /></Field>
                <Field label={t("Büte Kaldın Mı?")}>
                  <div style={{ position: "relative" }}>
                    <select value={form.buteKaldi ? "evet" : "hayir"} onChange={(e) => formDegistir("buteKaldi", e.target.value === "evet")} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", fontWeight: 600, color: form.buteKaldi ? tokens.danger : tokens.textPrimary }}>
                      <option value="hayir">{t("Hayır")}</option>
                      <option value="evet">{t("Evet")}</option>
                    </select>
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: tokens.muted }}>▼</div>
                  </div>
                </Field>
              </div>
              <div style={{ background: tokens.primary + "0c", border: `1px solid ${tokens.primary}25`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, color: tokens.primary, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>{t("Değerlendirme Ağırlıkları")}</div>
                <div style={{ display: "grid", gridTemplateColumns: mobil ? "1fr 1fr" : (form.buteKaldi ? "1fr 1fr" : "1fr 1fr 1fr 1fr"), gap: 14 }}>
                  {(form.buteKaldi ? [["vizeYuzde", t("Vize")], ["finalYuzde", t("Büt")]] : [["vizeYuzde", t("Vize")], ["odevYuzde", t("Ödev")], ["projeYuzde", t("Proje")], ["finalYuzde", t("Final")]]).map(([alan, label]) => (
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
                <div style={{ fontSize: 11, color: tokens.primary, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>{t("Notlar (0–100)")}</div>
                <div style={{ display: "grid", gridTemplateColumns: mobil ? "repeat(auto-fit, minmax(60px, 1fr))" : (form.buteKaldi ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr 1fr"), gap: 10 }}>
                  {(form.buteKaldi ? [["vize", t("Vize")], ["but", t("Büt")]] : [["vize", t("Vize")], ["odev", t("Ödev")], ["proje", t("Proje")], ["final", t("Final")]]).map(([alan, label]) => (
                    <Field key={alan} label={label}><input type="number" min="0" max="100" value={form[alan] === 0 ? "" : (form[alan] || "")} placeholder="0" onChange={(e) => formDegistir(alan, e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value))))} onFocus={(e) => setTimeout(() => e.target.select(), 10)} style={inputStyle} /></Field>
                  ))}
                  <Field label={t("Harf Notu")}>
                    <div style={{ position: "relative" }}>
                      <select value={form.harfNotu || ""} onChange={(e) => formDegistir("harfNotu", e.target.value || null)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", fontWeight: 700, color: form.harfNotu ? tokens.primary : tokens.textPrimary }}>
                        <option value="">{t("Oto")}</option>{harfNotlari.map((h) => <option key={h.harf} value={h.harf}>{h.harf}</option>)}
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
                    {[[t("DÖNEM ORT."), ort.toFixed(1), ort >= 60 ? tokens.success : tokens.danger], [t("HARF NOTU"), harf.harf, hr], [t("KATSAYI"), harf.katsayi.toFixed(2), tokens.primary]].map(([l, v, c]) => (
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
              <button onClick={() => setModal(null)} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{t("İptal")}</button>
              <button onClick={kaydet} disabled={!form.ad?.trim()} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: !form.ad?.trim() ? tokens.border : tokens.primary, color: !form.ad?.trim() ? tokens.muted : "#fff", cursor: !form.ad?.trim() ? "default" : "pointer", fontWeight: 600, fontSize: 13 }}>{modal.tip === "ekle" ? t("Dersi Ekle") : t("Değişiklikleri Kaydet")}</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
