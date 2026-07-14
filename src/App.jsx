import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from './lib/supabase';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import AdminPage from './pages/AdminPage';
import { AppDataProvider, useAppData } from './context/AppDataContext.jsx';
import { useWindowSize, hexToRgb, Overlay } from './components/shared.jsx';
import AppShell from './layout/AppShell';
import { ThemeProvider } from './theme/ThemeProvider';
import { useI18n } from './context/I18nContext';

const LoadingScreen = ({ text = "Yükleniyor..." }) => {
  const isDark = typeof window !== "undefined" && window.localStorage.getItem("unipulse-theme") === "light" ? false : true;
  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#0A0F1C" : "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 14, fontWeight: 500 }}>{text}</div>
    </div>
  );
};

function BolumSecim({ onSecim }) {
  const { user, profile, logout } = useAuth();
  const { universities, faculties, facultyDepartments } = useAppData();
  const [hoverId, setHoverId] = useState(null);
  const [bolumler, setBolumler] = useState([]);
  const [seciliUni, setSeciliUni] = useState(null);
  const [seciliFakulte, setSeciliFakulte] = useState(null);
  const [loading, setLoading] = useState(true);
  const w = useWindowSize();
  const mobil = w < 768;

  useEffect(() => {
    document.title = `${profile?.full_name || "Kullanıcı"} — Bölüm Seç`;
    return () => { document.title = "UniPulse"; };
  }, [profile?.full_name]);

  useEffect(() => {
    async function loadData() {
      const depData = await supabase.from("departments").select("*, department_courses(count)").order("slug");
      if (depData?.data) {
        const mapped = depData.data.map(d => ({
          id: d.id, slug: d.slug, ad: d.ad, kisaAd: d.ad.length > 20 ? d.ad.split(" ").slice(0,2).join(" ") : d.ad,
          emoji: d.ikon || "📚", renk: d.renk || "#6366f1", aciklama: d.aciklama || "",
          toplamKredi: d.toplam_kredi, toplamDonem: d.toplam_donem,
          dersSayisi: d.department_courses?.[0]?.count || 0,
        }));
        setBolumler(mapped);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Üniversiteye göre fakülteler
  const uniFakulteler = seciliUni
    ? faculties.filter(f => f.university_id === seciliUni.id)
    : [];

  // Fakülteye göre bölümler
  const fakulteBolumleri = seciliFakulte
    ? bolumler.filter(b =>
        facultyDepartments
          .filter(fd => fd.faculty_id === seciliFakulte.id)
          .map(fd => fd.department_slug)
          .includes(b.slug)
      )
    : [];

  function goBack() {
    setHoverId(null);
    if (seciliFakulte) { setSeciliFakulte(null); }
    else if (seciliUni) { setSeciliUni(null); }
  }

  // Adım başlığı
  const stepTitle = seciliFakulte
    ? seciliFakulte.ad
    : seciliUni
      ? seciliUni.ad
      : t("app.select_university");

  const stepSubtitle = seciliFakulte
    ? t("app.select_department")
    : seciliUni
      ? t("app.select_faculty")
      : null;

  const { t } = useI18n();
  if (loading) return <LoadingScreen text={t("Bölümler yükleniyor...")} />;

  return (
    <div style={{ minHeight:"100vh", background:"#080d1a", fontFamily:"'Inter', system-ui, sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding: mobil ? "60px 12px 40px" : "40px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-10%", left:"-5%", width:500, height:500, borderRadius:"50%", background:"rgba(99,102,241,0.06)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:600, height:600, borderRadius:"50%", background:"rgba(168,85,247,0.05)", filter:"blur(100px)" }} />
      </div>
      {/* Navbar */}
      <div style={{ position:"fixed", top:0, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding: mobil ? "10px 14px" : "12px 28px", background:"rgba(8,10,22,0.85)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.04)", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0, boxShadow:"0 2px 12px rgba(99,102,241,0.3)" }}>{((profile?.full_name || user?.email || "?")[0] || "?").toUpperCase()}</div>
          <div><div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", letterSpacing:-0.2 }}>{profile?.full_name || "Kullanıcı"}</div></div>
        </div>
        <button onClick={logout} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", padding:"7px 16px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:500, transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "#f87171"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Çıkış
        </button>
      </div>

      {/* Başlık + breadcrumb */}
      <div style={{ textAlign:"center", marginBottom: mobil ? 30 : 50, position:"relative", zIndex:1, marginTop:60 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
          {/* Adım göstergesi */}
          {["uni","fac","dept"].map((s, i) => {
            const done = (s === "uni" && (seciliUni || seciliFakulte)) || (s === "fac" && seciliFakulte);
            const active = (s === "uni" && !seciliUni) || (s === "fac" && seciliUni && !seciliFakulte) || (s === "dept" && seciliFakulte);
            return (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700,
                  background: done ? "#6366f1" : active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  border: active ? "1.5px solid #6366f1" : done ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: done || active ? "#f1f5f9" : "#334155",
                  transition:"all 0.3s",
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize:11, color: active ? "#818cf8" : done ? "#6366f1" : "#334155", fontWeight:600 }}>
                  {s === "uni" ? t("app.university") : s === "fac" ? t("app.faculty") : t("app.department")}
                </span>
                {i < 2 && <span style={{ color:"#1e293b", fontSize:14 }}>›</span>}
              </div>
            );
          })}
        </div>

        {(seciliUni || seciliFakulte) ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            <button onClick={goBack} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", color:"#818cf8", padding:"6px 14px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.22)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}>{t("app.back")}</button>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize: mobil ? 22 : 32, fontWeight:900, color:"#f1f5f9", letterSpacing:-1 }}>{stepTitle}</div>
              {stepSubtitle && <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{stepSubtitle}</div>}
            </div>
          </div>
        ) : (
          <h1 style={{ margin:0, fontSize: mobil ? 26 : "clamp(28px, 5vw, 48px)", fontWeight:900, color:"#f1f5f9", letterSpacing:-1, lineHeight:1.1 }}>Üniversiteni Seç</h1>
        )}
      </div>

      {/* İçerik */}
      {!seciliUni ? (
        /* Üniversite listesi */
        <div style={{ display:"grid", gridTemplateColumns: mobil ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: mobil ? 14 : 20, maxWidth:1100, width:"100%", position:"relative", zIndex:1 }}>
          {universities.map((u) => {
            const aktif = hoverId === u.id;
            const renk = u.renk || "#6366f1";
            return (
              <button key={u.id} onClick={() => { setSeciliUni(u); setHoverId(null); }} onMouseEnter={() => setHoverId(u.id)} onMouseLeave={() => setHoverId(null)}
                style={{ background: aktif ? `rgba(99,102,241,0.12)` : "rgba(10,14,30,0.8)", border: `1.5px solid ${aktif ? "#6366f170" : "rgba(99,102,241,0.15)"}`, borderRadius: mobil ? 16 : 20, padding: mobil ? "22px 18px" : "28px 24px", cursor:"pointer", textAlign:"left", transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transform: aktif ? "translateY(-6px) scale(1.01)" : "none", boxShadow: aktif ? "0 24px 64px rgba(99,102,241,0.25)" : "0 4px 20px rgba(0,0,0,0.3)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:52, height:52, borderRadius:14, fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", background: aktif ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)", border: `1px solid ${aktif ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.2)"}`, transition:"all 0.3s", transform: aktif ? "scale(1.08)" : "none", flexShrink:0 }}>{u.emoji || "🏛️"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize: mobil ? 15 : 17, fontWeight:800, color: aktif ? "#818cf8" : "#f1f5f9", marginBottom:4, lineHeight:1.2, transition:"color 0.3s" }}>{u.ad}</div>
                    <div style={{ fontSize:12, color:"#475569" }}>{faculties.filter(f => f.university_id === u.id).length} fakülte</div>
                  </div>
                  <div style={{ fontSize:20, color: aktif ? "#818cf8" : "#334155", transition:"all 0.3s", transform: aktif ? "translateX(4px)" : "none" }}>→</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : !seciliFakulte ? (
        /* Fakülte listesi */
        <div style={{ display:"grid", gridTemplateColumns: mobil ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: mobil ? 14 : 20, maxWidth:1100, width:"100%", position:"relative", zIndex:1 }}>
          {uniFakulteler.length === 0 ? (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:60, color:"#475569" }}>{t("app.no_faculty")}</div>
          ) : uniFakulteler.map((f) => {
            const aktif = hoverId === f.id;
            const renk = f.renk || "#6366f1";
            return (
              <button key={f.id} onClick={() => { setSeciliFakulte(f); setHoverId(null); }} onMouseEnter={() => setHoverId(f.id)} onMouseLeave={() => setHoverId(null)}
                style={{ background: aktif ? `rgba(99,102,241,0.12)` : "rgba(10,14,30,0.8)", border: `1.5px solid ${aktif ? "#6366f170" : "rgba(99,102,241,0.15)"}`, borderRadius: mobil ? 16 : 20, padding: mobil ? "22px 18px" : "28px 24px", cursor:"pointer", textAlign:"left", transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transform: aktif ? "translateY(-6px) scale(1.01)" : "none", boxShadow: aktif ? "0 24px 64px rgba(99,102,241,0.25)" : "0 4px 20px rgba(0,0,0,0.3)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:52, height:52, borderRadius:14, fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", background: aktif ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)", border: `1px solid ${aktif ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.2)"}`, transition:"all 0.3s", transform: aktif ? "scale(1.08)" : "none", flexShrink:0 }}>{f.emoji || "🏛️"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize: mobil ? 15 : 17, fontWeight:800, color: aktif ? "#818cf8" : "#f1f5f9", marginBottom:4, lineHeight:1.2, transition:"color 0.3s" }}>{f.ad}</div>
                    <div style={{ fontSize:12, color:"#475569" }}>{facultyDepartments.filter(fd => fd.faculty_id === f.id).length} bölüm</div>
                  </div>
                  <div style={{ fontSize:20, color: aktif ? "#818cf8" : "#334155", transition:"all 0.3s", transform: aktif ? "translateX(4px)" : "none" }}>→</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Bölüm listesi */
        <div style={{ maxWidth:1100, width:"100%", position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns: mobil ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: mobil ? 14 : 24, width:"100%" }}>
            {fakulteBolumleri.length === 0 ? (
              <div style={{ gridColumn:"1/-1", textAlign:"center", padding:60, color:"#475569" }}>{t("app.no_department")}</div>
            ) : fakulteBolumleri.map((b) => {
              const aktif = hoverId === b.slug;
              const fRenk = seciliFakulte?.renk || "#6366f1";
              return (
                <button key={b.slug} onClick={() => onSecim(b, seciliFakulte)} onMouseEnter={() => setHoverId(b.slug)} onMouseLeave={() => setHoverId(null)} style={{ background: aktif ? `rgba(${hexToRgb(fRenk)}, 0.12)` : "rgba(10,14,30,0.8)", border: `1.5px solid ${aktif ? fRenk + "70" : "rgba(99,102,241,0.15)"}`, borderRadius: mobil ? 16 : 20, padding: mobil ? "22px 18px" : "28px 24px", cursor:"pointer", textAlign:"left", transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transform: aktif ? "translateY(-6px) scale(1.01)" : "none", boxShadow: aktif ? `0 24px 64px ${fRenk}25, 0 0 0 1px ${fRenk}20, inset 0 1px 0 rgba(255,255,255,0.06)` : "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"relative", zIndex:1 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                      <div style={{ width:50, height:50, borderRadius:14, fontSize:26, display:"flex", alignItems:"center", justifyContent:"center", background: `rgba(${hexToRgb(fRenk)}, ${aktif ? 0.25 : 0.15})`, border: `1px solid rgba(${hexToRgb(fRenk)}, ${aktif ? 0.4 : 0.25})`, transition:"all 0.3s", transform: aktif ? "scale(1.08)" : "none" }}>{b.emoji}</div>
                      <div style={{ fontSize:10, color: aktif ? fRenk : "#334155", border:`1px solid ${aktif ? fRenk + "40" : "rgba(255,255,255,0.06)"}`, borderRadius:99, padding:"3px 10px", fontWeight:600, background: aktif ? `rgba(${hexToRgb(fRenk)}, 0.12)` : "transparent", transition:"all 0.3s", letterSpacing:0.5 }}>{b.slug}</div>
                    </div>
                    <div style={{ fontSize: mobil ? 16 : 19, fontWeight:800, color: aktif ? fRenk : "#f1f5f9", marginBottom:6, lineHeight:1.2, transition:"color 0.3s" }}>{b.ad}</div>
                    <div style={{ fontSize:12, color:"#475569", marginBottom:18, lineHeight:1.5 }}>{b.aciklama}</div>
                    <div style={{ display:"flex", gap:10 }}>
                      {[{ l:"Ders", v: b.dersSayisi }, { l:"Kredi", v: b.toplamKredi }, { l:"Dönem", v: b.toplamDonem }].map((s) => (
                        <div key={s.l} style={{ flex:1, background: aktif ? `rgba(${hexToRgb(fRenk)}, 0.08)` : "rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 8px", border:`1px solid ${aktif ? fRenk + "25" : "rgba(255,255,255,0.06)"}`, textAlign:"center", transition:"all 0.3s" }}>
                          <div style={{ fontSize:16, fontWeight:800, color: aktif ? fRenk : "#94a3b8", transition:"color 0.3s" }}>{s.v}</div>
                          <div style={{ fontSize:9, color:"#334155", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


function Dashboard({ bolum: bolumProp, departmentId }) {
  return <AppShell bolumProp={bolumProp} departmentId={departmentId} />;
}

export default function App() {
  const { user, profile, loading: authLoading, logout, selectDepartment } = useAuth();
  const [authPage, setAuthPage] = useState("login");
  const [aktifBolum, setAktifBolum] = useState(null);

  const { t } = useI18n();
  if (authLoading) return <LoadingScreen text={t("Yükleniyor...")} />;

  if (!user) {
    return <ThemeWrapper><AuthPage initialMode={authPage} /></ThemeWrapper>;
  }

  if (profile && profile.is_allowed === false) return (
    <ThemeWrapper>
      <div style={{ minHeight:"100vh", background:"#080d1a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign:"center", maxWidth:400, padding:40 }}>
          <div style={{ fontSize:64, marginBottom:20 }}>🚫</div>
          <h1 style={{ margin:"0 0 12px", fontSize:22, fontWeight:800, color:"#f1f5f9" }}>{t("app.access_denied")}</h1>
          <p style={{ margin:"0 0 24px", fontSize:14, color:"#475569", lineHeight:1.6 }}>{t("app.account_disabled")}</p>
          <button onClick={logout} style={{ padding:"10px 24px", borderRadius:10, border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.08)", color:"#f87171", cursor:"pointer", fontWeight:600, fontSize:13 }}>{t("app.logout")}</button>
        </div>
      </div>
    </ThemeWrapper>
  );

  return (
    <ThemeWrapper>
      <AppDataProvider>
        <AppDataGate>
          <AuthenticatedApp profile={profile} selectDepartment={selectDepartment} aktifBolum={aktifBolum} setAktifBolum={setAktifBolum} />
        </AppDataGate>
      </AppDataProvider>
    </ThemeWrapper>
  );
}

function AppDataGate({ children }) {
  const { appDataLoading, appDataError, harfNotlari, bosDers } = useAppData();
  const { t } = useI18n();
  if (appDataLoading) return <LoadingScreen text={t("Uygulama verileri yükleniyor...")} />;
  if (appDataError || harfNotlari.length === 0 || !bosDers) return <div style={{ minHeight:"100vh", background:"#080d1a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif", padding:24 }}><div style={{ textAlign:"center", maxWidth:420 }}><h1 style={{ margin:"0 0 12px", color:"#f1f5f9", fontSize:22 }}>{t("app.data_missing")}</h1><p style={{ margin:0, color:"#64748b", fontSize:14, lineHeight:1.6 }}>{appDataError || t("app.supabase_error")}</p></div></div>;
  return children;
}

function ThemeWrapper({ children }) {
  const { profile } = useAuth()
  return <ThemeProvider initialTheme={profile?.theme_preference}>{children}</ThemeProvider>
}

function AuthenticatedApp({ profile, selectDepartment, aktifBolum, setAktifBolum }) {
  const { t } = useI18n();
  if (profile?.role === "admin") return <AdminPanel onBackToUser={() => setAktifBolum(null)} />;
  if (!profile) return <LoadingScreen text={t("Profil yükleniyor...")} />;
  if (aktifBolum) return <Dashboard bolum={aktifBolum} />;
  if (profile.department_id) return <Dashboard departmentId={profile.department_id} />;
  return <BolumSecim onSecim={async (b, fakulte) => { try { await selectDepartment(b.id, fakulte?.id || null); setAktifBolum(b); } catch (err) { console.error("Bölüm seçilirken hata:", err); } }} />;
}

function AdminPanel({ onBackToUser }) {
  return <AdminPage onBackToUser={onBackToUser} />;
}
