/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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
    }, 30 * 60 * 1000);
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

  const fetchProfile = useCallback(async (userId) => {
    const requestId = ++profileRequestRef.current;

    try {
      const { data, error } = await supabase
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

      if (!data) {
        await signOutMissingProfile();
        return null;
      }

      setProfile(data);
      setLoading(false);
      return data;
    } catch (err) {
      if (requestId === profileRequestRef.current) {
        console.error("Profil yükleme istisnası:", err);
        await signOutMissingProfile();
      }
      return null;
    }
  }, [signOutMissingProfile]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return;
        if (error) {
          console.error("Oturum yükleme hatası:", error);
          clearAuthState();
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
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
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          if (_event === 'SIGNED_IN') {
            try {
              await supabase.from("profiles").update({ is_online: true }).eq("id", session.user.id);
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username } }
    });
    if (error) throw error;

    if (data.user) {
      const profileUpdates = {};
      if (username) profileUpdates.username = username;
      if (deptData?.department_id) profileUpdates.department_id = deptData.department_id;
      if (deptData?.faculty_id) profileUpdates.faculty_id = deptData.faculty_id;
      if (deptData?.university_id) profileUpdates.university_id = deptData.university_id;

      if (Object.keys(profileUpdates).length > 0) {
        await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", data.user.id);
      }
    }

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
    // Edge Function yerine sabit bir demo hesabı kullanıyoruz (Seçenek 2)
    // Şifreyi kodda tutmak demo hesapları için kabul edilebilir bir risktir.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@unipulse.com',
      password: 'DemoUser123!',
    });

    if (error) {
      console.error("Demo giriş hatası:", error);
      throw new Error("Demo giriş işlemi başarısız oldu. Lütfen internet bağlantınızı kontrol edin.");
    }
    
    if (data.user) {
      try {
        await supabase.from("profiles").update({ is_online: true }).eq("id", data.user.id);
      } catch {}
    }
    
    return data;
  }

  async function loginWithGoogle() {
    const redirectUrl = import.meta.env.PROD 
      ? 'https://unipulse.perainc.online'
      : window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) throw error;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/UniPulse/`,
    });
    if (error) throw error;
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
    <AuthContext.Provider value={{ user, profile, loading, register, login, loginAsDemo, loginWithGoogle, logout, resetPassword, updateProfile, selectDepartment, updateUserEmail, deleteUser, fetchAllProfiles, fetchAllGrades, fetchUserCourses }}>
      {children}
    </AuthContext.Provider>
  );
}
