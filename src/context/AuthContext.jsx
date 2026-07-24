/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { captureEvent, identifyUser, resetPostHogIdentity } from "../utils/clientLogger";

const AuthContext = createContext(null);
const TRUSTED_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "icloud.com", "me.com", "mac.com", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "yahoo.com", "yahoo.com.tr", "yandex.com",
  "yandex.com.tr", "proton.me", "protonmail.com", "zoho.com", "perainc.online",
  "mail.perainc.online", "unipulse.app", "lifeos.app", "komsucep.app",
]);

function cleanAuthCallbackUrl() {
  if (typeof window === "undefined") return;
  const hasTokenHash = /(?:^|[&#])(access_token|refresh_token|provider_token|provider_refresh_token)=/.test(window.location.hash);
  const hasAuthCode = new URLSearchParams(window.location.search).has("code");
  if (!hasTokenHash && !hasAuthCode) return;
  window.history.replaceState({}, document.title, "/");
}

function isTrustedEmail(email) {
  const domain = String(email || "").split("@")[1]?.toLowerCase();
  return Boolean(domain && TRUSTED_EMAIL_DOMAINS.has(domain));
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function usernameFromEmail(email, userId) {
  const localPart = String(email || "").split("@")[0] || "google";
  const clean = localPart.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 24);
  return clean || `google_${String(userId || "").slice(0, 8)}`;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) return true;
    }
    return false;
  });
  const profileRequestRef = useRef(0);
  const inactivityTimerRef = useRef(null);
  const logoutRef = useRef(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        captureEvent("unipulse_logout", { reason: "manual" }, session.user.id);
        await supabase.from("activity_logs").insert({
          user_id: session.user.id,
          action: "logout",
          details: {},
          ip_address: null,
        });
        await supabase.from("profiles").update({ is_online: false }).eq("id", session.user.id);
      }
    } catch {}
    await supabase.auth.signOut();
    resetPostHogIdentity();
    clearAuthState();
  }, [clearAuthState]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      if (logoutRef.current) logoutRef.current();
    }, 15 * 60 * 1000);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer, true));
    resetInactivityTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer, true));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  const signOutMissingProfile = useCallback(async () => {
    clearAuthState();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Oturum kapatma hatası:", err);
    }
  }, [clearAuthState]);

  const ensureProfileForAuthUser = useCallback(async (authUser) => {
    if (!authUser?.id) return null;

    const { data: existingProfile, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existingProfile) return existingProfile;
    if (existingError) throw existingError;

    const metadata = authUser.user_metadata || {};
    const email = authUser.email || metadata.email || "";
    const fullName = metadata.full_name || metadata.name || email.split("@")[0] || "Google Kullanıcısı";
    const username = usernameFromEmail(email, authUser.id);
    const baseProfile = {
      id: authUser.id,
      email,
      full_name: fullName,
      username,
      is_online: true,
      last_login: new Date().toISOString(),
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(baseProfile)
      .select("*")
      .maybeSingle();

    if (!insertError && insertedProfile) return insertedProfile;

    const fallbackProfile = {
      id: authUser.id,
      email,
      full_name: fullName,
      is_online: true,
      last_login: new Date().toISOString(),
    };
    const { data: fallbackInserted, error: fallbackError } = await supabase
      .from("profiles")
      .insert(fallbackProfile)
      .select("*")
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    return fallbackInserted;
  }, []);

  const fetchProfile = useCallback(async (userId, authUser = null) => {
    const requestId = ++profileRequestRef.current;

    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (requestId !== profileRequestRef.current) return null;

      if (error) {
        console.error("Profil yükleme hatası:", error);
        await signOutMissingProfile();
        return null;
      }

      if (!data && authUser) {
        data = await ensureProfileForAuthUser(authUser);
      }

      if (!data) {
        await signOutMissingProfile();
        return null;
      }

      setProfile(data);
      identifyUser(data, authUser || { id: userId, email: data.email });
      setLoading(false);
      return data;
    } catch (err) {
      if (requestId === profileRequestRef.current) {
        console.error("Profil yükleme istisnası:", err);
        await signOutMissingProfile();
      }
      return null;
    }
  }, [ensureProfileForAuthUser, signOutMissingProfile]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (!active) return;
        if (error) {
          console.error("Oturum yükleme hatası:", error);
          cleanAuthCallbackUrl();
          clearAuthState();
          return;
        }

        cleanAuthCallbackUrl();
        setUser(session?.user ?? null);
        if (session?.user) {
          const loadedProfile = await fetchProfile(session.user.id, session.user);
          captureEvent("unipulse_session_loaded", {
            source: "initial",
            email: loadedProfile?.email || session.user.email,
          }, session.user.id);
        }
        else clearAuthState();
      })
      .catch((err) => {
        if (!active) return;
        console.error("Oturum yükleme istisnası:", err);
        clearAuthState();
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        if (_event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        cleanAuthCallbackUrl();
        setUser(session?.user ?? null);
        if (session?.user) {
          const loadedProfile = await fetchProfile(session.user.id, session.user);
          captureEvent("unipulse_auth_state", {
            event: _event,
            email: loadedProfile?.email || session.user.email,
          }, session.user.id);
          if (_event === 'SIGNED_IN') {
            captureEvent("unipulse_login_seen", {
              provider: session.user.app_metadata?.provider || "supabase",
              email: loadedProfile?.email || session.user.email,
            }, session.user.id);
            try {
              await supabase.from("profiles").update({ is_online: true, last_login: new Date().toISOString() }).eq("id", session.user.id);
            } catch {}
          }
        }
        else clearAuthState();
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, fetchProfile]);

  async function register(email, password, fullName, username, deptData = null) {
    const { data, error } = await supabase.functions.invoke("request-registration", {
      body: { email, password, fullName, username, deptData }
    });
    if (error) throw new Error("Kayıt talebi alınamadı. Lütfen daha sonra tekrar deneyin.");
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function login(emailOrName, password) {
    let finalEmail = emailOrName.trim().toLowerCase();
    if (!finalEmail.includes("@")) {
      const { data: foundEmail, error: rpcErr } = await supabase.rpc("get_email_by_full_name", { p_name: emailOrName.trim() });
      if (!foundEmail) {
        const { data: foundEmailLower, error: rpcErrLower } = await supabase.rpc("get_email_by_full_name", { p_name: finalEmail });
        if (rpcErrLower || !foundEmailLower) {
          throw new Error("Bu kullanıcı adında bir hesap bulunamadı.");
        }
        finalEmail = foundEmailLower;
      } else {
        finalEmail = foundEmail;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
    if (error) {
      if (error.message === "Invalid login credentials") {
        throw new Error("E-posta, kullanıcı adı veya şifre hatalı.");
      }
      if (error.message === "Email not confirmed") {
        throw new Error("E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.");
      }
      throw error;
    }
    if (data.user) {
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("is_allowed, theme_preference")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profErr || !prof) {
        await supabase.auth.signOut();
        throw new Error("Profil bulunamadı. Lütfen tekrar giriş yapın.");
      }
      if (prof.is_allowed === false) {
        await supabase.auth.signOut();
        throw new Error("Hesabınız engellenmiştir.");
      }
      if (prof.theme_preference) {
        try { window.localStorage.setItem("unipulse-theme", prof.theme_preference); } catch {}
      }
      try {
        identifyUser({ ...prof, id: data.user.id, email: data.user.email }, data.user);
        captureEvent("unipulse_login", { method: "password", email: data.user.email }, data.user.id);
        await supabase.from("activity_logs").insert({
          user_id: data.user.id,
          action: "login",
          details: { email: data.user.email },
          ip_address: null,
        });
        await supabase.from("profiles").update({ is_online: true }).eq("id", data.user.id);
      } catch {}
    }
    return data;
  }

  async function loginAsDemo() {
    const { data, error } = await supabase.functions.invoke("demo-login");
    if (error || data?.error || !data?.token_hash) {
      throw new Error("Demo giriş işlemi başarısız oldu. Lütfen internet bağlantınızı kontrol edin.");
    }
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });
    if (verifyError) {
      throw new Error("Demo giriş işlemi başarısız oldu. Lütfen tekrar deneyin.");
    }
    if (authData.user) {
      const loadedProfile = await fetchProfile(authData.user.id, authData.user);
      try {
        identifyUser(loadedProfile || {}, authData.user);
        captureEvent("unipulse_login", { method: "demo", email: authData.user.email }, authData.user.id);
        await supabase.from("activity_logs").insert({
          user_id: authData.user.id,
          action: "demo_login",
          details: { email: authData.user.email },
          ip_address: null,
        });
        await supabase.from("profiles").update({ is_online: true, last_login: new Date().toISOString() }).eq("id", authData.user.id);
      } catch {}
    }
    return authData;
  }

  async function loginWithGoogle(credential, nonce) {
    const token = typeof credential === "string" ? credential : credential?.credential;
    const payload = decodeJwtPayload(token);
    if (!token || !payload?.email) {
      throw new Error("Google giriş bilgisi alınamadı. Lütfen tekrar deneyin.");
    }
    if (!isTrustedEmail(payload.email)) {
      throw new Error("Sadece bilinen e-posta sağlayıcıları (gmail, icloud vb.) ve şirket maili kabul edilmektedir.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
      nonce,
    });
    if (error) throw error;
    if (data.user && !isTrustedEmail(data.user.email)) {
      await supabase.auth.signOut();
      throw new Error("Sadece bilinen e-posta sağlayıcıları (gmail, icloud vb.) ve şirket maili kabul edilmektedir.");
    }
    if (data.user) {
      const loadedProfile = await fetchProfile(data.user.id, data.user);
      if (!loadedProfile) {
        await supabase.auth.signOut();
        throw new Error("Profil oluşturulamadı. Lütfen tekrar deneyin.");
      }
      if (loadedProfile.is_allowed === false) {
        await supabase.auth.signOut();
        throw new Error("Hesabınız engellenmiştir.");
      }
      try {
        identifyUser(loadedProfile, data.user);
        captureEvent("unipulse_login", { method: "google", email: data.user.email }, data.user.id);
        await supabase.from("activity_logs").insert({
          user_id: data.user.id,
          action: "google_login",
          details: { email: data.user.email },
          ip_address: null,
        });
        await supabase.from("profiles").update({ is_online: true, last_login: new Date().toISOString() }).eq("id", data.user.id);
      } catch {}
    }
    return data;
  }

  async function resetPassword(email) {
    const redirectUrl = import.meta.env.PROD
      ? 'https://unipulse.perainc.online'
      : window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setIsPasswordRecovery(false);
  }

  async function updateProfile(updates) {
    console.log("[AuthContext] updateProfile çağrıldı:", { user: user?.id, updates });
    if (!user) {
      console.error("[AuthContext] updateProfile: user null!");
      return;
    }
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
    console.log("[AuthContext] DB'ye yazılıyor:", updates);
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*");
    if (error) {
      console.error("[AuthContext] DB update hatası:", error);
      throw error;
    }
    console.log("[AuthContext] DB update sonucu:", data);
    await fetchProfile(user.id);
    console.log("[AuthContext] fetchProfile tamamlandı");
  }

  async function selectDepartment(deptId, facultyId = null) {
    if (!user) return;
    const { data: dept, error: deptErr } = await supabase
      .from("departments")
      .select("id, slug")
      .eq("id", deptId)
      .maybeSingle();
    if (deptErr || !dept) throw deptErr;

    const updates = { department_id: deptId };

    if (facultyId) {
      const { data: fac, error: facErr } = await supabase
        .from("faculties")
        .select("id, university_id")
        .eq("id", facultyId)
        .maybeSingle();
      if (!facErr && fac) {
        updates.faculty_id = fac.id;
        updates.university_id = fac.university_id;
      }
    } else {
      const { data: fdList, error: fdErr } = await supabase
        .from("faculty_departments")
        .select("faculty_id, faculties!inner(id, university_id)")
        .eq("department_slug", dept.slug);

      if (!fdErr && fdList && fdList.length === 1 && fdList[0]?.faculties) {
        updates.faculty_id = fdList[0].faculty_id;
        updates.university_id = fdList[0].faculties.university_id;
      }
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  }

  async function updateUserEmail(targetUserId, newEmail) {
    const { error } = await supabase.rpc("update_user_email", { target_id: targetUserId, new_email: newEmail });
    if (error) throw error;
  }

  async function deleteUser(targetUserId) {
    try {
      // 1. Kullanıcıya ait ilişkili verileri (notlar, loglar vb.) önyüzden temizle
      await supabase.from("student_grades").delete().eq("user_id", targetUserId);
      await supabase.from("activity_logs").delete().eq("user_id", targetUserId);

      // 2. Kullanıcının kendisini sil (RPC fonksiyonu)
      const { error } = await supabase.rpc("delete_user", { target_id: targetUserId });
      if (error) throw error;
    } catch (err) {
      console.error("Hesap silme hatası:", err);
      throw err;
    }
  }

  async function fetchAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at");
    if (error) { console.error("fetchAllProfiles error:", error); return []; }
    return data || [];
  }

  async function fetchAllGrades(userId) {
    const { data: grades, error } = await supabase
      .from("student_grades")
      .select("*")
      .eq("user_id", userId);
    if (error) { console.error("fetchAllGrades error:", error); return []; }
    return grades || [];
  }

  async function fetchUserCourses(departmentId) {
    const { data } = await supabase
      .from("department_courses")
      .select("*")
      .eq("department_id", departmentId)
      .order("donem");
    return data || [];
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, loginAsDemo, loginWithGoogle, logout, resetPassword, updatePassword, isPasswordRecovery, updateProfile, selectDepartment, updateUserEmail, deleteUser, fetchAllProfiles, fetchAllGrades, fetchUserCourses }}>
      {children}
    </AuthContext.Provider>
  );
}
