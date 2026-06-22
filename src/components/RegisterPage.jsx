import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const inputStyle = {
  width: "100%", height: 38, padding: "0 12px", borderRadius: 8,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#F8FAFC", fontSize: 12, outline: "none", boxSizing: "border-box",
  transition: "all 0.3s ease", fontFamily: "inherit",
};

const labelStyle = {
  display: "block", fontSize: 11, color: "rgba(248,250,252,0.5)",
  fontWeight: 500, marginBottom: 5, letterSpacing: "0.3px",
};

const focusProps = {
  onFocus: (e) => { e.target.style.borderColor = "rgba(124,58,237,0.4)"; e.target.style.background = "rgba(124,58,237,0.08)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; },
  onBlur: (e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.boxShadow = "none"; },
};

// ——— Mini bölüm seçici (kayıt içi) ———
function InlineSelector({ universities, faculties, departments, facultyDepartments, onSelect }) {
  const [step, setStep] = useState("uni"); // "uni" | "fac" | "dept"
  const [selUni, setSelUni] = useState(null);
  const [selFac, setSelFac] = useState(null);
  const [selDept, setSelDept] = useState(null);

  const facForUni = selUni ? faculties.filter(f => f.university_id === selUni.id) : [];
  const deptForFac = selFac
    ? departments.filter(d =>
        facultyDepartments.filter(fd => fd.faculty_id === selFac.id).map(fd => fd.department_id).includes(d.id)
      )
    : [];

  function pickUni(u) { setSelUni(u); setSelFac(null); setSelDept(null); setStep("fac"); }
  function pickFac(f) { setSelFac(f); setSelDept(null); setStep("dept"); }
  function pickDept(d) {
    setSelDept(d);
    onSelect({ university_id: selUni.id, faculty_id: selFac.id, department_id: d.id });
  }
  function goBack() {
    if (step === "dept") { setStep("fac"); setSelFac(null); setSelDept(null); }
    else if (step === "fac") { setStep("uni"); setSelUni(null); }
  }

  const stepLabel = {
    uni: "Üniversite seçin",
    fac: selUni?.ad || "Fakülte seçin",
    dept: selFac?.ad || "Bölüm seçin",
  }[step];

  const items = step === "uni" ? universities : step === "fac" ? facForUni : deptForFac;

  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
      background: "rgba(255,255,255,0.02)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ fontSize: 11, color: "rgba(248,250,252,0.5)", fontWeight: 500 }}>
          {stepLabel}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Breadcrumb dots */}
          {["uni","fac","dept"].map((s, i) => (
            <span key={s} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: s === step ? "#7C3AED" : (
                (step === "fac" && i === 0) || (step === "dept" && i <= 1)
                  ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.15)"
              ),
              transition: "all 0.2s",
            }} />
          ))}
          {step !== "uni" && (
            <button onClick={goBack} style={{
              background: "none", border: "none", color: "#8B5CF6",
              fontSize: 11, cursor: "pointer", padding: "2px 6px",
              fontFamily: "inherit", fontWeight: 600,
            }}>← Geri</button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 160, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ padding: "14px 12px", fontSize: 11, color: "rgba(248,250,252,0.3)", textAlign: "center" }}>
            {step === "fac" ? "Bu üniversiteye bağlı fakülte bulunamadı" : "Bu fakülteye bağlı bölüm bulunamadı"}
          </div>
        ) : items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => step === "uni" ? pickUni(item) : step === "fac" ? pickFac(item) : pickDept(item)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", background: "transparent", border: "none",
              color: "#F8FAFC", cursor: "pointer", fontFamily: "inherit",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 16 }}>{item.emoji || item.ikon || (step === "dept" ? "📚" : "🏛️")}</span>
            <span style={{ fontSize: 12, fontWeight: 500, textAlign: "left" }}>{item.ad}</span>
            {step !== "dept" && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(248,250,252,0.3)" }}>›</span>
            )}
          </button>
        ))}
      </div>

      {/* Selected dept badge */}
      {selDept && (
        <div style={{
          padding: "8px 12px", background: "rgba(124,58,237,0.12)",
          borderTop: "1px solid rgba(124,58,237,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>
            ✓ {selUni?.ad} › {selFac?.ad} › {selDept.ad}
          </div>
          <button
            type="button"
            onClick={() => { setSelDept(null); onSelect(null); setStep("dept"); }}
            style={{ background: "none", border: "none", color: "rgba(248,250,252,0.4)", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit" }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [basarili, setBasarili] = useState(false);

  // Bölüm seçimi
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyDepartments, setFacultyDepartments] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedDeptData, setSelectedDeptData] = useState(null); // { university_id, faculty_id, department_id }

  useEffect(() => {
    async function loadData() {
      const [uniRes, facRes, deptRes, fdRes] = await Promise.all([
        supabase.from("universities").select("*").order("ad"),
        supabase.from("faculties").select("*").order("ad"),
        supabase.from("departments").select("*").order("ad"),
        supabase.from("faculty_departments").select("*"),
      ]);
      if (uniRes.data) setUniversities(uniRes.data);
      if (facRes.data) setFaculties(facRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (fdRes.data) setFacultyDepartments(fdRes.data);
      setDataLoading(false);
    }
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (!terms) {
      setError("Kullanım koşullarını kabul etmeniz gerekiyor");
      return;
    }

    if (!selectedDeptData) {
      setError("Lütfen üniversite › fakülte › bölüm seçimini tamamlayın");
      return;
    }

    setLoading(true);
    try {
      const data = await register(email, password, fullName, selectedDeptData);
      if (data.session) {
        // Otomatik giriş yapıldı
      } else {
        setBasarili(true);
      }
    } catch (err) {
      setError(err.message === "User already registered" ? "Bu e-posta adresi zaten kayıtlı" : err.message);
    } finally {
      setLoading(false);
    }
  }

  if (basarili) {
    return (
      <div style={{
        minHeight: "100vh", background: "#020617",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 800, height: 800, borderRadius: "50%", background: "#7C3AED", filter: "blur(150px)", opacity: 0.5 }} />
          <div style={{ position: "absolute", bottom: "-150px", right: "-150px", width: 600, height: 600, borderRadius: "50%", background: "#06B6D4", filter: "blur(150px)", opacity: 0.5 }} />
        </div>
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 180, fontWeight: 700, letterSpacing: 30, color: "white", opacity: 0.03, whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none", zIndex: 0 }}>UNIPULSE</div>

        <div style={{
          width: 380, background: "rgba(10,15,35,0.45)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 32px", position: "relative", zIndex: 1,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px rgba(124,58,237,0.1)",
          textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 20px",
          }}>✉️</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, color: "#F8FAFC" }}>Hesabınız Oluşturuldu!</h1>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(248,250,252,0.6)", lineHeight: 1.5 }}>
            <strong style={{ color: "#F8FAFC" }}>{email}</strong> adresine doğrulama e-postası gönderdik.
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(248,250,252,0.4)", lineHeight: 1.5 }}>
            E-posta kutunuzu kontrol edin ve doğrulama bağlantısına tıklayın.
          </p>
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 500 }}>💡 E-posta gelen kutunuzda görünmüyorsa spam klasörünü kontrol edin.</div>
          </div>
          <button onClick={onSwitch} style={{
            width: "100%", height: 44, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
            color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14,
            fontFamily: "inherit", boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
          }}>Giriş Yap</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#020617",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-200px", left: "-200px", width: 800, height: 800, borderRadius: "50%", background: "#7C3AED", filter: "blur(150px)", opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: "-150px", right: "-150px", width: 600, height: 600, borderRadius: "50%", background: "#06B6D4", filter: "blur(150px)", opacity: 0.5 }} />
      </div>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 180, fontWeight: 700, letterSpacing: 30, color: "white", opacity: 0.03, whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none", zIndex: 0 }}>UNIPULSE</div>

      {/* Card */}
      <div style={{
        width: 440, background: "rgba(10,15,35,0.45)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 28px", position: "relative", zIndex: 1,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px rgba(124,58,237,0.1)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            display: "inline-flex", justifyContent: "center", alignItems: "center",
            width: 44, height: 44, background: "#0f172a",
            borderRadius: 12, marginBottom: 10, border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#a78bfa"/>
                </linearGradient>
              </defs>
              <polyline points="6,34 16,34 22,20 28,48 34,26 38,38 44,30 50,34 58,34"
                fill="none" stroke="url(#lg)" strokeWidth="4.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            margin: "0 0 4px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #F8FAFC 0%, rgba(248,250,252,0.8) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>UniPulse</h1>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(248,250,252,0.5)" }}>
            Üniversite hayatının kontrol merkezi
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Ad Soyad */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Ad Soyad</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" required style={inputStyle} {...focusProps} />
          </div>

          {/* E-posta */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@university.edu.tr" required style={inputStyle} {...focusProps} />
          </div>

          {/* Şifre / Şifre Tekrar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Şifre</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} {...focusProps} />
            </div>
            <div>
              <label style={labelStyle}>Şifre Tekrar</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} {...focusProps} />
            </div>
          </div>

          {/* Üniversite / Fakülte / Bölüm Seçimi */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Üniversite › Fakülte › Bölüm</label>
            {dataLoading ? (
              <div style={{
                height: 44, borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", display: "flex",
                alignItems: "center", paddingLeft: 12, fontSize: 12, color: "rgba(248,250,252,0.3)",
              }}>
                Veriler yükleniyor...
              </div>
            ) : (
              <InlineSelector
                universities={universities}
                faculties={faculties}
                departments={departments}
                facultyDepartments={facultyDepartments}
                onSelect={setSelectedDeptData}
              />
            )}
          </div>

          {/* Agreement */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(248,250,252,0.5)", cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ display: "none" }} />
              <span style={{
                width: 15, height: 15, border: "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 4, display: "flex", justifyContent: "center", alignItems: "center",
                transition: "all 0.2s ease", background: "rgba(255,255,255,0.04)", flexShrink: 0,
                ...(terms ? { background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", borderColor: "transparent" } : {}),
              }}>
                {terms && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span>Kullanım koşullarını kabul ediyorum</span>
            </label>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, color: "#f87171", fontSize: 11 }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", height: 40, borderRadius: 10, border: "none",
            background: loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
            color: "#fff", cursor: loading ? "default" : "pointer",
            fontWeight: 600, fontSize: 13, fontFamily: "inherit",
            transition: "all 0.3s ease",
            boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.35)",
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(124,58,237,0.45)"; }}}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.35)"; }}}
          >{loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}</button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ padding: "0 12px", fontSize: 11, color: "rgba(248,250,252,0.4)" }}>veya</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Google Button */}
        <button style={{
          width: "100%", height: 38, borderRadius: 10,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#F8FAFC", cursor: "pointer", fontSize: 12, fontWeight: 500,
          fontFamily: "inherit", transition: "all 0.3s ease",
          display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google ile Devam Et
        </button>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(248,250,252,0.5)" }}>
          Zaten hesabın var mı?{" "}
          <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "#8B5CF6", cursor: "pointer", fontWeight: 500, fontSize: 12, padding: 0, fontFamily: "inherit" }}
            onMouseEnter={(e) => e.target.style.color = "#06B6D4"}
            onMouseLeave={(e) => e.target.style.color = "#8B5CF6"}
          >Giriş Yap</button>
        </div>
      </div>
    </div>
  );
}
