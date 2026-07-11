import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useWindowSize, Overlay } from "../components/shared.jsx";
import { supabase } from "../lib/supabase";
import { useI18n } from "../context/I18nContext";

export default function DepartmentPage() {
  const { t } = useI18n();
  const { tokens } = useTheme();
  const w = useWindowSize();
  const mobil = w < 768;
  const [bolumler, setBolumler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ad: "", toplamDonem: 8 });
  const [secili, setSecili] = useState(null);
  const [silOnay, setSilOnay] = useState(null);
  const [mesaj, setMesaj] = useState(null);

  useEffect(() => { loadBolumler(); }, []);

  async function loadBolumler() {
    try { const { data, error } = await supabase.from("departments").select("*").order("ad"); if (!error) setBolumler(data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function kaydet() {
    if (!form.ad.trim()) { setMesaj({ tip: "hata", text: "Bölüm adı gerekli" }); return; }
    try {
      if (secili) { const { error } = await supabase.from("departments").update({ ad: form.ad, toplamDonem: form.toplamDonem }).eq("id", secili.id); if (error) throw error; setBolumler((p) => p.map((b) => (b.id === secili.id ? { ...b, ad: form.ad, toplamDonem: form.toplamDonem } : b))); setMesaj({ tip: "basarili", text: "Bölüm güncellendi" }); }
      else { const { data, error } = await supabase.from("departments").insert({ ad: form.ad, toplamDonem: form.toplamDonem }).select(); if (error) throw error; setBolumler((p) => [...p, data[0]]); setMesaj({ tip: "basarili", text: "Bölüm eklendi" }); }
      setModal(null); setForm({ ad: "", toplamDonem: 8 }); setSecili(null);
    } catch (e) { setMesaj({ tip: "hata", text: "Kaydetme başarısız: " + e.message }); }
  }

  async function sil() {
    if (!silOnay) return;
    try { const { error } = await supabase.from("departments").delete().eq("id", silOnay); if (error) throw error; setBolumler((p) => p.filter((b) => b.id !== silOnay)); setMesaj({ tip: "basarili", text: "Bölüm silindi" }); setSecili(null); } catch (e) { setMesaj({ tip: "hata", text: "Silme başarısız: " + e.message }); }
    setSilOnay(null);
  }

  const filtreliBolumler = bolumler.filter((b) => b.ad.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "20px 24px", boxShadow: tokens.shadowSm }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: tokens.textPrimary }}>Departman Yönetimi</h1><p style={{ margin: 0, fontSize: 12, color: tokens.muted }}>Bölüm ve akademik programa sahip</p></div>
          <button onClick={() => { setSecili(null); setForm({ ad: "", toplamDonem: 8 }); setModal("olustur"); }} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: tokens.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Yeni Bölüm</button>
        </div>
      </div>
      <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: tokens.shadowSm }}>
        <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>İstatistik</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: tokens.primary }}>{bolumler.length}</div>
        <div style={{ fontSize: 11, color: tokens.textSecondary, marginTop: 4 }}>toplam bölüm</div>
      </div>
      <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 16, overflow: "hidden", boxShadow: tokens.shadowSm }}>
        <div style={{ padding: "14px 14px", borderBottom: `1px solid ${tokens.border}` }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bölüm ara…" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: tokens.surface, border: `1px solid ${tokens.border}`, color: tokens.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: tokens.muted }}>{t("Yükleniyor…")}</div> : filtreliBolumler.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: tokens.muted }}>{t("Bölüm bulunamadı")}</div> : (
          <div style={{ padding: "12px" }}>
            {filtreliBolumler.map((b) => (
              <div key={b.id} onClick={() => setSecili(b)} style={{ background: secili?.id === b.id ? tokens.primary + "15" : "transparent", border: `1px solid ${secili?.id === b.id ? tokens.primary : tokens.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer", transition: "all 150ms ease" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{b.ad}</div>
                <div style={{ fontSize: 11, color: tokens.muted, marginTop: 4 }}>{b.toplamDonem || 8} dönem</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && (
        <Overlay onClick={() => setModal(null)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 20, padding: "28px", maxWidth: 420, width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>{modal === "olustur" ? "✨ Yeni Bölüm Ekle" : "✏️ Bölümü Düzenle"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
              <div><label style={{ display: "block", fontSize: 10, color: tokens.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Bölüm Adı</label><input value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} placeholder="Bilgisayar Mühendisliği" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: tokens.surface, border: `1px solid ${tokens.border}`, color: tokens.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
              <div><label style={{ display: "block", fontSize: 10, color: tokens.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Toplam Dönem</label><input type="number" min="1" max="12" value={form.toplamDonem} onChange={(e) => setForm((f) => ({ ...f, toplamDonem: Math.max(1, Number(e.target.value)) }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: tokens.surface, border: `1px solid ${tokens.border}`, color: tokens.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>İptal</button>
              <button onClick={kaydet} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tokens.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{modal === "olustur" ? "Ekle" : "Güncelle"}</button>
            </div>
          </div>
        </Overlay>
      )}
      {silOnay && (
        <Overlay onClick={() => setSilOnay(null)}>
          <div style={{ background: tokens.card, border: `1px solid ${tokens.danger}40`, borderRadius: 20, padding: "32px", maxWidth: 360, width: "95%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: tokens.textPrimary, fontSize: 16, fontWeight: 700 }}>Bölümü Sil</h3>
            <p style={{ margin: "0 0 22px", color: tokens.muted, fontSize: 12 }}>Bu işlem geri alınamaz.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setSilOnay(null)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>İptal</button>
              <button onClick={sil} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tokens.danger, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Sil</button>
            </div>
          </div>
        </Overlay>
      )}
      {mesaj && (
        <div onClick={() => setMesaj(null)} style={{ position: "fixed", bottom: 24, right: 24, background: mesaj.tip === "basarili" ? tokens.success + "15" : tokens.danger + "15", border: `1px solid ${mesaj.tip === "basarili" ? tokens.success + "40" : tokens.danger + "40"}`, borderRadius: 12, padding: "12px 18px", zIndex: 9999, cursor: "pointer", boxShadow: tokens.shadowLg, display: "flex", alignItems: "center", gap: 8, maxWidth: 360 }}>
          <span style={{ fontSize: 14 }}>{mesaj.tip === "basarili" ? "✅" : "❌"}</span>
          <span style={{ fontSize: 12, color: mesaj.tip === "basarili" ? tokens.success : tokens.danger, fontWeight: 600 }}>{mesaj.text}</span>
        </div>
      )}
    </div>
  );
}
