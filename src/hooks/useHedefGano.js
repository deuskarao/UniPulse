import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "unipulse-hedef-gano";
const DEFAULT_HEDEF = 3.00;

function parse(v) {
  const n = parseFloat(v);
  if (isNaN(n) || n < 0 || n > 4) return null;
  return Math.round(n * 100) / 100;
}

function readLocalStorage() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return parse(stored);
  } catch {
    return null;
  }
}

function writeLocalStorage(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
}

function clearLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Kullanıcının Hedef GPA'sını yönetir.
 *
 * Strateji:
 * 1. Kaynak: profiles.hedef_gano (Supabase)
 * 2. Fallback: localStorage (kullanıcı giriş yapmadıysa veya DB hatası olursa)
 * 3. Default: 3.00
 *
 * Yazma: önce Supabase'e yazılır (eğer kullanıcı girişliyse),
 *        başarılı olursa local cache de güncellenir.
 *        Offline/error durumunda sadece localStorage'a yazılır.
 */
export function useHedefGano() {
  const { user, profile, updateProfile } = useAuth();
  const [hedefGano, setHedefGanoState] = useState(() => {
    // İlk render: localStorage'dan oku (DB'den henüz gelmedi)
    const local = readLocalStorage();
    return local !== null ? local : DEFAULT_HEDEF;
  });
  const [isLoading, setIsLoading] = useState(false);
  const lastRemoteRef = useRef(null);

  // profile geldiğinde state'i senkronla (sadece ilk yükleme veya DB değişimi)
  useEffect(() => {
    if (!profile) return;
    const remote = profile.hedef_gano;
    const remoteParsed = remote != null ? parse(remote) : null;
    if (remoteParsed !== null && remoteParsed !== lastRemoteRef.current) {
      lastRemoteRef.current = remoteParsed;
      setHedefGanoState(remoteParsed);
      writeLocalStorage(remoteParsed);
    } else if (remoteParsed === null) {
      // DB'de null/undefined → localStorage'daki değeri kullan ama DB'ye yazma (lazy)
      const local = readLocalStorage();
      if (local !== null && local !== lastRemoteRef.current) {
        lastRemoteRef.current = local;
        setHedefGanoState(local);
      }
    }
  }, [profile]);

  // Cross-tab localStorage sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== STORAGE_KEY) return;
      const parsed = parse(e.newValue);
      if (parsed !== null && parsed !== hedefGano) {
        setHedefGanoState(parsed);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [hedefGano]);

  const setHedefGano = useCallback(async (value) => {
    const parsed = parse(value);
    if (parsed === null) return false;

    // Optimistik: önce state'i güncelle
    setHedefGanoState(parsed);
    writeLocalStorage(parsed);
    lastRemoteRef.current = parsed;

    // Supabase'e yaz (eğer kullanıcı girişliyse)
    if (user && updateProfile) {
      setIsLoading(true);
      try {
        await updateProfile({ hedef_gano: parsed });
      } catch (err) {
        console.error("Hedef GPA DB'ye yazılamadı, localStorage'a kaydedildi:", err);
        // LocalStorage zaten yazıldı, kullanıcı bir sonraki girişinde tekrar deneyecek
      } finally {
        setIsLoading(false);
      }
    }
    return true;
  }, [user, updateProfile]);

  const resetHedefGano = useCallback(async () => {
    setHedefGanoState(DEFAULT_HEDEF);
    writeLocalStorage(DEFAULT_HEDEF);
    lastRemoteRef.current = DEFAULT_HEDEF;
    clearLocalStorage();
    if (user && updateProfile) {
      try {
        await updateProfile({ hedef_gano: DEFAULT_HEDEF });
      } catch (err) {
        console.error("Hedef GPA sıfırlanamadı:", err);
      }
    }
  }, [user, updateProfile]);

  return { hedefGano, setHedefGano, resetHedefGano, defaultHedef: DEFAULT_HEDEF, isLoading };
}
