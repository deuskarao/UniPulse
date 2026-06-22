import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext.jsx";

export function hesaplaDönemOrt(ders) {
  return (
    (ders.vize || 0) * (ders.vizeYuzde || 0) +
    (ders.odev || 0) * (ders.odevYuzde || 0) +
    (ders.proje || 0) * (ders.projeYuzde || 0) +
    (ders.final || 0) * (ders.finalYuzde || 0)
  );
}

export function hesaplaHarf(ort, harfNotlari) {
  if (!harfNotlari || harfNotlari.length === 0) {
    return { harf: "-", katsayi: 0.0 };
  }
  const found = harfNotlari.find((h) => ort >= h.min);
  return found ? { harf: found.harf, katsayi: Number(found.katsayi) } : { harf: "FF", katsayi: 0.0 };
}

export function harfRengi(harf, harfRenk) {
  if (harfRenk && harfRenk[harf]) return harfRenk[harf];
  return "#94a3b8";
}

export function ganoRengi(gano, ganoRenkler) {
  const val = parseFloat(gano);
  if (ganoRenkler && ganoRenkler.length > 0) {
    const found = ganoRenkler.find((g) => val >= Number(g.min_gano));
    if (found) return found.renk;
  }
  return "#94a3b8";
}

export function hesaplaGerekliiFinal(ders) {
  const vizeKatkisi = (ders.vize || 0) * (ders.vizeYuzde || 0);
  const odevKatkisi = (ders.odev || 0) * (ders.odevYuzde || 0);
  const projeKatkisi = (ders.proje || 0) * (ders.projeYuzde || 0);
  const gecmeLimiti = 60;
  const finalYuzde = ders.finalYuzde || 0.6;
  if (finalYuzde === 0) return 0;
  return Math.max(0, (gecmeLimiti - vizeKatkisi - odevKatkisi - projeKatkisi) / finalYuzde);
}

/**
 * Bir bölümün ders/not verisini ve CRUD işlemlerini yöneten hook.
 * Bu, App.jsx içindeki eski Dashboard fonksiyonunun veri katmanının
 * birebir taşınmış halidir — Supabase sorguları/realtime davranışı değişmedi.
 */
export function useDersler({ bolumProp, departmentId }) {
  const { user, profile, updateProfile, logout } = useAuth();
  const { harfNotlari, harfRenk, ganoRenkler, bosDers } = useAppData();

  const [bolum, setBolum] = useState(bolumProp || null);
  const [bolumLoading, setBolumLoading] = useState(!bolumProp && !!departmentId);
  const [dersler, setDersler] = useState([]);
  const [dbLoading, setDbLoading] = useState(!!bolumProp);
  const [aktifDonem, setAktifDonem] = useState("tumu");
  const aktifProgramDonemi = profile?.aktif_program_donemi || 1;
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(() => (bosDers ? { ...bosDers } : null));
  const [silOnay, setSilOnay] = useState(null);
  const [siralama, setSiralama] = useState({ kolon: null, yon: "asc" });

  // Session timeout: 30 dakika inaktivitede logout
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const [lastActivity, setLastActivity] = useState(() => Date.now());

  useEffect(() => {
    const handleActivity = () => setLastActivity(() => Date.now());
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (user && Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [user, lastActivity, logout, SESSION_TIMEOUT]);

  useEffect(() => {
    if (profile?.full_name && bolum?.ad) {
      document.title = `${profile.full_name} — ${bolum.ad}`;
    }
    return () => {
      document.title = "UniPulse";
    };
  }, [profile?.full_name, bolum?.ad]);

  useEffect(() => {
    if (!departmentId || bolumProp) return;
    let cancelled = false;
    supabase
      .from("departments")
      .select("*, department_courses(count)")
      .eq("id", departmentId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Bölüm yükleme hatası:", error);
        if (data) {
          setBolum({
            id: data.id,
            slug: data.slug,
            ad: data.ad,
            emoji: data.ikon || "📚",
            renk: data.renk || "#6366f1",
            aciklama: data.aciklama || "",
            toplamKredi: data.toplam_kredi,
            toplamDonem: data.toplam_donem,
          });
        }
        setBolumLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId, bolumProp]);

  useEffect(() => {
    async function loadData() {
      if (!bolum || !user) return;
      setDbLoading(true);

      const { data: courses } = await supabase
        .from("department_courses")
        .select("*")
        .eq("department_id", bolum.id)
        .order("donem");

      const { data: grades } = await supabase.from("student_grades").select("*").eq("user_id", user.id);

      const gradesMap = new Map((grades || []).map((g) => [g.department_course_id, g]));

      const merged = (courses || []).map((c) => {
        const g = gradesMap.get(c.id);
        return {
          id: c.id,
          legacy_id: c.legacy_id,
          ad: c.ad,
          kredi: Number(c.kredi),
          dersSaati: Number(c.ders_saati),
          vizeYuzde: Number(c.vize_yuzde) || 0,
          odevYuzde: Number(c.odev_yuzde) || 0,
          projeYuzde: Number(c.proje_yuzde) || 0,
          finalYuzde: Number(c.final_yuzde) || 0,
          donem: c.donem,
          vize: g ? Number(g.vize) : 0,
          odev: g ? Number(g.odev) : 0,
          proje: g ? Number(g.proje) : 0,
          final: g ? Number(g.final) : 0,
          harfNotu: g?.harf_notu || null,
        };
      });

      setDersler(merged);
      setDbLoading(false);
    }
    loadData();

    const gradesChannel = supabase
      .channel("grades-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_grades", filter: `user_id=eq.${user?.id}` },
        () => loadData()
      )
      .subscribe();

    const coursesChannel = supabase
      .channel("courses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "department_courses", filter: `department_id=eq.${bolum?.id}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gradesChannel);
      supabase.removeChannel(coursesChannel);
    };
  }, [bolum, user]);

  const siralamaDegistir = useCallback((kolon) => {
    setSiralama((s) => {
      if (s.kolon !== kolon) return { kolon, yon: "asc" };
      return { kolon, yon: s.yon === "asc" ? "desc" : "asc" };
    });
  }, []);

  async function notKaydet(dersId, alan, deger) {
    const ders = dersler.find((d) => d.id === dersId);
    if (!ders) return;
    const yeniDers = { ...ders, [alan]: deger };
    setDersler((p) => p.map((d) => (d.id === dersId ? { ...d, [alan]: deger } : d)));
    try {
      const { data: mevcut } = await supabase
        .from("student_grades")
        .select("id")
        .eq("user_id", user.id)
        .eq("department_course_id", dersId)
        .maybeSingle();
      const payload = {
        user_id: user.id,
        department_course_id: dersId,
        vize: yeniDers.vize,
        odev: yeniDers.odev,
        proje: yeniDers.proje,
        final: yeniDers.final,
        harf_notu: yeniDers.harfNotu,
      };
      if (mevcut) {
        await supabase.from("student_grades").update(payload).eq("id", mevcut.id);
      } else {
        await supabase.from("student_grades").insert(payload);
      }
    } catch (e) {
      console.error("notKaydet exception:", e);
    }
  }

  async function donemKaydet(deger) {
    await updateProfile({ aktif_program_donemi: deger });
  }

  const filtreliDersler = useMemo(() => {
    const programFiltreli = dersler.filter((d) => d.donem <= aktifProgramDonemi);
    return aktifDonem === "tumu" ? programFiltreli : programFiltreli.filter((d) => d.donem === Number(aktifDonem));
  }, [dersler, aktifDonem, aktifProgramDonemi]);

  const siraliDersler = useMemo(() => {
    if (!siralama.kolon) return filtreliDersler;
    const yonCarpan = siralama.yon === "asc" ? 1 : -1;
    return [...filtreliDersler].sort((a, b) => {
      if (siralama.kolon === "ad") return a.ad.localeCompare(b.ad, "tr") * yonCarpan;
      if (siralama.kolon === "harf") {
        const ortA = hesaplaDönemOrt(a),
          ortB = hesaplaDönemOrt(b);
        const harfA = a.harfNotu ? (harfNotlari.find((h) => h.harf === a.harfNotu) || { harf: a.harfNotu, katsayi: 0 }) : hesaplaHarf(ortA, harfNotlari);
        const harfB = b.harfNotu ? (harfNotlari.find((h) => h.harf === b.harfNotu) || { harf: b.harfNotu, katsayi: 0 }) : hesaplaHarf(ortB, harfNotlari);
        return (harfA.katsayi - harfB.katsayi) * yonCarpan;
      }
      return 0;
    });
  }, [filtreliDersler, siralama, harfNotlari]);

  const stats = useMemo(() => {
    const aktifDonemler = new Set(dersler.filter((d) => d.vize > 0 || d.odev > 0 || d.proje > 0 || d.final > 0 || d.harfNotu).map((d) => d.donem));
    const list = dersler
      .filter((d) => aktifDonemler.has(d.donem) && d.donem <= aktifProgramDonemi)
      .map((d) => {
        const ort = hesaplaDönemOrt(d);
        const harf = d.harfNotu ? (harfNotlari.find((h) => h.harf === d.harfNotu) || { harf: d.harfNotu, katsayi: 0 }) : hesaplaHarf(ort, harfNotlari);
        return { ...d, ort, harf };
      });
    const ganoList = list.filter((d) => d.harf.harf !== "EK");
    const tk = ganoList.reduce((a, d) => a + d.kredi, 0);
    const gano = ganoList.reduce((a, d) => a + d.harf.katsayi * d.kredi, 0) / (tk || 1);
    const tumDersler = dersler.map((d) => {
      const ort = hesaplaDönemOrt(d);
      const harf = d.harfNotu ? (harfNotlari.find((h) => h.harf === d.harfNotu) || { harf: d.harfNotu, katsayi: 0 }) : hesaplaHarf(ort, harfNotlari);
      return { ...d, ort, harf };
    });
    const gecenDersler = tumDersler.filter((d) => {
      const h = d.harf.harf;
      if (h === "FF") return false;
      if ((h === "DD" || h === "DC") && gano < 2.0) return false;
      return true;
    });
    const gecenKredi = gecenDersler.reduce((a, d) => a + d.kredi, 0);
    const seciliListe = aktifDonem === "tumu" ? null : list.filter((d) => d.donem === Number(aktifDonem));
    const seciliGanoList = seciliListe ? seciliListe.filter((d) => d.harf.harf !== "EK") : null;
    const seciliKredi = seciliGanoList ? seciliGanoList.reduce((a, d) => a + d.kredi, 0) : 0;
    const secilDonemGano = seciliGanoList ? seciliGanoList.reduce((a, d) => a + d.harf.katsayi * d.kredi, 0) / (seciliKredi || 1) : 0;

    const riskli = tumDersler.filter((d) => d.ort > 0 && d.ort < 60 && d.final === 0).sort((a, b) => a.ort - b.ort);
    const yaklasan = tumDersler.filter((d) => d.ort >= 50 && d.ort < 60 && d.final === 0);
    const guclu = tumDersler.filter((d) => d.ort >= 85).sort((a, b) => b.ort - a.ort);
    const enYuksek = [...tumDersler].filter((d) => d.ort > 0).sort((a, b) => b.ort - a.ort)[0] || null;
    const enDusuk = [...tumDersler].filter((d) => d.ort > 0).sort((a, b) => a.ort - b.ort)[0] || null;

    return {
      gano: gano.toFixed(2),
      gano100: ((gano / 4) * 100).toFixed(1),
      alinanKredi: tk,
      gecenKredi,
      kalanKredi: Math.max(0, (bolum?.toplamKredi || 0) - gecenKredi),
      gecen: gecenDersler.length,
      toplam: list.length,
      secilDonemGano: aktifDonem === "tumu" ? null : secilDonemGano.toFixed(2),
      riskli,
      yaklasan,
      guclu,
      enYuksek,
      enDusuk,
      tamamlanmaOrani: bolum?.toplamKredi ? ((gecenKredi / bolum.toplamKredi) * 100).toFixed(0) : 0,
    };
  }, [dersler, bolum?.toplamKredi, aktifProgramDonemi, aktifDonem, harfNotlari]);

  function modalAc(tip, ders = null) {
    setForm(ders ? { ...ders } : { ...bosDers, id: null });
    setModal({ tip });
  }

  function formDegistir(alan, deger) {
    setForm((f) => {
      if (!f) return f;
      const y = { ...f, [alan]: deger };
      if (alan === "vizeYuzde" || alan === "odevYuzde" || alan === "projeYuzde") {
        const k = 1 - (alan === "vizeYuzde" ? +deger : f.vizeYuzde) - (alan === "odevYuzde" ? +deger : f.odevYuzde) - (alan === "projeYuzde" ? +deger : f.projeYuzde);
        y.finalYuzde = Math.max(0, Math.round(k * 100) / 100);
      }
      return y;
    });
  }

  async function notlariKaydet(dersId, formVerisi) {
    const { data: mevcut } = await supabase
      .from("student_grades")
      .select("id")
      .eq("user_id", user.id)
      .eq("department_course_id", dersId)
      .maybeSingle();
    const payload = {
      user_id: user.id,
      department_course_id: dersId,
      vize: formVerisi.vize || 0,
      odev: formVerisi.odev || 0,
      proje: formVerisi.proje || 0,
      final: formVerisi.final || 0,
      harf_notu: formVerisi.harfNotu || null,
    };
    if (mevcut) {
      await supabase.from("student_grades").update(payload).eq("id", mevcut.id);
    } else {
      await supabase.from("student_grades").insert(payload);
    }
  }

  async function kaydet() {
    if (!form || !form.ad?.trim()) return;
    if (modal.tip === "ekle") {
      const { data, error } = await supabase
        .from("department_courses")
        .insert({
          department_id: bolum.id,
          ad: form.ad,
          kredi: form.kredi,
          ders_saati: form.dersSaati,
          vize_yuzde: form.vizeYuzde,
          odev_yuzde: form.odevYuzde,
          proje_yuzde: form.projeYuzde,
          final_yuzde: form.finalYuzde,
          donem: form.donem,
          legacy_id: 0,
        })
        .select()
        .maybeSingle();
      if (error) {
        console.error("Ders ekleme hatası:", error);
        alert("Ekleme hatası: " + error.message);
        return;
      }
      if (data) {
        if (form.vize || form.odev || form.proje || form.final || form.harfNotu) {
          await notlariKaydet(data.id, form);
        }
        const { data: courses } = await supabase
          .from("department_courses")
          .select("*, student_grades(vize, odev, proje, final, harf_notu, user_id)")
          .eq("department_id", bolum.id);
        if (courses) {
          setDersler(
            courses.map((c) => {
              const g = (c.student_grades || []).find((sg) => sg.user_id === user.id);
              return {
                id: c.id,
                ad: c.ad,
                kredi: Number(c.kredi),
                dersSaati: Number(c.ders_saati),
                vizeYuzde: Number(c.vize_yuzde) || 0,
                odevYuzde: Number(c.odev_yuzde) || 0,
                projeYuzde: Number(c.proje_yuzde) || 0,
                finalYuzde: Number(c.final_yuzde) || 0,
                donem: c.donem,
                vize: g?.vize || 0,
                odev: g?.odev || 0,
                proje: g?.proje || 0,
                final: g?.final || 0,
                harfNotu: g?.harf_notu || null,
              };
            })
          );
        }
      }
    } else {
      const { error } = await supabase
        .from("department_courses")
        .update({
          ad: form.ad,
          kredi: form.kredi,
          ders_saati: form.dersSaati,
          vize_yuzde: form.vizeYuzde,
          odev_yuzde: form.odevYuzde,
          proje_yuzde: form.projeYuzde,
          final_yuzde: form.finalYuzde,
          donem: form.donem,
        })
        .eq("id", form.id);
      if (error) {
        console.error("Ders düzenleme hatası:", error);
        alert("Düzenleme kaydedilemedi: " + error.message);
        return;
      }
      try {
        await notlariKaydet(form.id, form);
      } catch (e) {
        console.error("Not kaydetme hatası:", e);
      }
      setDersler((p) => p.map((d) => (d.id === form.id ? { ...d, ...form } : d)));
    }
    setModal(null);
  }

  async function sil() {
    if (!silOnay) return;
    await supabase.from("student_grades").delete().eq("department_course_id", silOnay);
    const { error } = await supabase.from("department_courses").delete().eq("id", silOnay);
    if (error) {
      console.error("Ders silme hatası:", error);
      setSilOnay(null);
      return;
    }
    setDersler((p) => p.filter((d) => d.id !== silOnay));
    setSilOnay(null);
  }

  return {
    user, profile, harfNotlari, harfRenk, ganoRenkler,
    bolum, bolumLoading, dersler, dbLoading,
    aktifDonem, setAktifDonem, aktifProgramDonemi, donemKaydet,
    modal, setModal, form, setForm, silOnay, setSilOnay,
    siralama, siralamaDegistir,
    filtreliDersler, siraliDersler, stats,
    modalAc, formDegistir, kaydet, sil, notKaydet,
  };
}