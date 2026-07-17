import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "general", labelKey: "admin.tab_general", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
  { id: "applications", labelKey: "admin.tab_applications", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: "activities", labelKey: "admin.tab_activities", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: "system", labelKey: "admin.tab_system", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
];

function InfoRow({ label, value, tokens, color }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
      <span style={{ fontSize: 12, color: tokens.muted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: color || tokens.textPrimary, fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

export default function AdminUserDetails({ user, onUserUpdate, onBlockUser, onDeleteUser, onRoleChange, showToast, logAction, isMobile, onBack }) {
  const { t, language } = useI18n();
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [grades, setGrades] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", department_id: "", enrollment_year: null });
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    async function loadRefData() {
      const [deptRes, facRes, uniRes, clsRes] = await Promise.all([
        supabase.from("departments").select("*").order("ad"),
        supabase.from("faculties").select("*").order("ad"),
        supabase.from("universities").select("*").order("ad"),
        supabase.from("classes").select("id, name, department_id").order("name")
      ]);

      const mapAd = (data) => {
        if (!data) return data;
        return data.map(item => {
          const translation = language !== "tr" && item[`ad_${language}`];
          return { ...item, ad: translation ? translation : item.ad };
        });
      };

      if (deptRes.data) setDepartments(mapAd(deptRes.data));
      if (facRes.data) setFaculties(mapAd(facRes.data));
      if (uniRes.data) setUniversities(mapAd(uniRes.data));
      if (clsRes.data) setClasses(clsRes.data);
    }
    loadRefData();
  }, [language]);

  useEffect(() => {
    if (!user) return;
    setEditing(false);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      department_id: user.department_id || "",
      enrollment_year: user.enrollment_year || null
    });
    setActiveTab("general");
  }, [user?.id]);

  useEffect(() => {
    if (!user || activeTab !== "applications") return;
    async function loadGrades() {
      setLoadingGrades(true);
      const { data } = await supabase
        .from("student_grades")
        .select("*, department_courses!inner(ad, kredi, donem)")
        .eq("user_id", user.id);
      if (data) setGrades(data);
      setLoadingGrades(false);
    }
    loadGrades();
  }, [user?.id, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== "activities") return;
    async function loadActivities() {
      setLoadingActivities(true);
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setActivities(data);
      setLoadingActivities(false);
    }
    loadActivities();
  }, [user?.id, activeTab]);

  async function handleSave() {
    if (!editForm.full_name.trim()) {
      showToast(t("admin.name_cannot_be_empty"), "error");
      return;
    }
    await onUserUpdate(user.id, {
      full_name: editForm.full_name,
      department_id: editForm.department_id || null,
      enrollment_year: editForm.enrollment_year || null
    });
    setEditing(false);
  }

  if (!user) {
    return (
      <div
        className="rounded-xl flex items-center justify-center h-full"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
          minHeight: 400,
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>👤</div>
          <div style={{ fontSize: 14, color: tokens.muted }}>{t("admin.select_user_from_list")}</div>
        </div>
      </div>
    );
  }

  // Using names mapped in AdminLayout.jsx
  // Removed local find because it relies on async loading which might cause flash of Belirlenmemiş

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        height: isMobile ? "100vh" : "calc(100vh - 160px)",
      }}
    >
      <div style={{ padding: "20px", borderBottom: `1px solid ${tokens.border}` }}>
        <div className="flex items-start gap-4">
          {isMobile && (
            <button
              onClick={onBack}
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                border: `1px solid ${tokens.border}`,
                background: "transparent",
                color: tokens.textPrimary,
                cursor: "pointer",
              }}
            >
              ←
            </button>
          )}
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 56,
              height: 56,
              background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primary}cc)`,
              color: "#fff",
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            {user.full_name?.[0] || user.email?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18, fontWeight: 700, color: tokens.textPrimary }}>
                {user.full_name || t("admin.anonymous_user")}
              </span>
              {user.role === "admin" && (
                <span
                  className="rounded px-2 py-0.5"
                  style={{ fontSize: 10, fontWeight: 700, background: tokens.primary + "20", color: tokens.primary }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: tokens.muted, marginTop: 2 }}>{user.email}</div>
            <div className="flex items-center gap-3 mt-2">
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: user.is_allowed === false ? tokens.dangerLight : tokens.successLight,
                  color: user.is_allowed === false ? tokens.danger : tokens.success,
                }}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: user.is_allowed === false ? tokens.danger : tokens.success,
                  }}
                />
                {user.is_allowed === false ? "Engelli" : "Aktif"}
              </span>
              {user.department_name && (
                <span style={{ fontSize: 11, color: tokens.muted }}>📚 {user.department_name}</span>
              )}
              {user.university_name && (
                <span style={{ fontSize: 11, color: tokens.muted }}>🏛️ {user.university_name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!editing && (
              <button
                onClick={() => {
                  let u_id = ""; let f_id = "";
                  if (user.department_id) {
                    const d = departments.find(x => x.id === user.department_id);
                    if (d) {
                      f_id = d.faculty_id || "";
                      const f = faculties.find(x => x.id === f_id);
                      if (f) u_id = f.university_id || "";
                    }
                  }
                  setEditForm(prev => ({ ...prev, university_id: u_id, faculty_id: f_id }));
                  setEditing(true);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{
                  border: `1px solid ${tokens.border}`,
                  background: "transparent",
                  color: tokens.textSecondary,
                  cursor: "pointer",
                }}
              >
                Düzenle
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex" style={{ borderBottom: `1px solid ${tokens.border}` }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors duration-150"
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${tokens.primary}` : "2px solid transparent",
              color: activeTab === tab.id ? tokens.primary : tokens.muted,
              cursor: "pointer",
            }}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "20px" }}>
        <AnimatePresence mode="wait">
          {activeTab === "general" && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {editing ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: tokens.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{t("admin.full_name")}</label>
                    <input
                      value={editForm.full_name}
                      onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2.5 outline-none text-sm"
                      style={{ background: tokens.input, border: `1px solid ${tokens.border}`, color: tokens.textPrimary }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: tokens.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{t("admin.university")}</label>
                    <select
                      value={editForm.university_id || ""}
                      onChange={e => setEditForm(f => ({ ...f, university_id: e.target.value, faculty_id: "", department_id: "" }))}
                      className="w-full rounded-lg px-3 py-2.5 outline-none text-sm"
                      style={{ background: tokens.input, border: `1px solid ${tokens.border}`, color: tokens.textPrimary }}
                    >
                      <option value="">Üniversite Seçin</option>
                      {universities.map(u => <option key={u.id} value={u.id}>{u.ad}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: tokens.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{t("admin.faculty")}</label>
                    <select
                      value={editForm.faculty_id || ""}
                      onChange={e => setEditForm(f => ({ ...f, faculty_id: e.target.value, department_id: "" }))}
                      className="w-full rounded-lg px-3 py-2.5 outline-none text-sm"
                      style={{ background: tokens.input, border: `1px solid ${tokens.border}`, color: tokens.textPrimary }}
                      disabled={!editForm.university_id}
                    >
                      <option value="">Fakülte Seçin</option>
                      {faculties.filter(f => f.university_id === editForm.university_id).map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: tokens.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{t("admin.department")}</label>
                    <select
                      value={editForm.department_id || ""}
                      onChange={e => setEditForm(f => ({ ...f, department_id: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2.5 outline-none text-sm"
                      style={{ background: tokens.input, border: `1px solid ${tokens.border}`, color: tokens.textPrimary }}
                      disabled={!editForm.faculty_id}
                    >
                      <option value="">{t("admin.no_department")}</option>
                      {departments.filter(d => d.faculty_id === editForm.faculty_id).map(d => <option key={d.id} value={d.id}>{d.ad}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: tokens.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>Kayıt Yılı</label>
                    <input
                      type="number"
                      placeholder="Örn: 2024"
                      value={editForm.enrollment_year || ""}
                      onChange={e => setEditForm(f => ({ ...f, enrollment_year: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full rounded-lg px-3 py-2.5 outline-none text-sm"
                      style={{ background: tokens.input, border: `1px solid ${tokens.border}`, color: tokens.textPrimary }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded-lg px-4 py-2 text-xs font-semibold"
                      style={{ border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer" }}
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-lg px-4 py-2 text-xs font-semibold"
                      style={{ border: "none", background: tokens.primary, color: "#fff", cursor: "pointer" }}
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <InfoRow label="Ad Soyad" value={user.full_name} tokens={tokens} />
                  <InfoRow label={t("admin.email")} value={user.email} tokens={tokens} />
                  <InfoRow label={t("admin.university")} value={user.university_name || "Belirlenmemiş"} tokens={tokens} />
                  <InfoRow label={t("admin.faculty")} value={user.faculty_name || "Belirlenmemiş"} tokens={tokens} />
                  <InfoRow label={t("admin.department")} value={user.department_name || "Belirlenmemiş"} tokens={tokens} />
                  <InfoRow label={t("admin.register_date")} value={new Date(user.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })} tokens={tokens} />
                  <InfoRow label={t("admin.last_login")} value={user.last_login ? new Date(user.last_login).toLocaleDateString("tr-TR") : "Hiç giriş yapmadı"} tokens={tokens} />
                  <InfoRow label={t("admin.role")} value={user.role === "admin" ? "Admin" : "Kullanıcı"} tokens={tokens} color={user.role === "admin" ? tokens.primary : tokens.textPrimary} />
                  <InfoRow label={t("admin.status")} value={user.is_allowed === false ? "Engelli" : "Aktif"} tokens={tokens} color={user.is_allowed === false ? tokens.danger : tokens.success} />
                  <InfoRow label={t("admin.email_verified")} value={user.email_confirmed_at ? "Doğrulanmış" : "Doğrulanmamış"} tokens={tokens} color={user.email_confirmed_at ? tokens.success : tokens.warning} />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "applications" && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {loadingGrades ? (
                <div className="text-center py-10" style={{ color: tokens.muted }}>{t("admin.loading")}</div>
              ) : grades.length === 0 ? (
                <div className="text-center py-10" style={{ color: tokens.muted }}>{t("admin.no_applications")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: tokens.sidebarHover }}>
                        {["Ders", "Dönem", "Kredi", "Vize", "Ödev", "Proje", "Final", "Harf"].map(h => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 12px",
                              textAlign: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              color: tokens.muted,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              borderBottom: `1px solid ${tokens.border}`,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((g, i) => (
                        <tr key={g.id} style={{ borderBottom: `1px solid ${tokens.border}`, background: i % 2 === 0 ? tokens.surface : "transparent" }}>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: tokens.textPrimary, fontWeight: 500 }}>
                            {g.department_courses?.ad || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span
                              className="inline-flex items-center justify-center rounded"
                              style={{
                                width: 24,
                                height: 24,
                                background: tokens.primary + "20",
                                color: tokens.primary,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {g.department_courses?.donem}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", color: tokens.primary, fontWeight: 700, fontSize: 13 }}>
                            {g.department_courses?.kredi}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{g.vize || "—"}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{g.odev || "—"}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{g.proje || "—"}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13, color: tokens.textPrimary }}>{g.final || "—"}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: tokens.primary }}>{g.harf_notu || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "activities" && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {loadingActivities ? (
                <div className="text-center py-10" style={{ color: tokens.muted }}>{t("admin.loading")}</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-10" style={{ color: tokens.muted }}>{t("admin.no_activity_found")}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activities.map(a => (
                    <div
                      key={a.id}
                      className="rounded-lg p-3"
                      style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>{a.action}</span>
                        <span style={{ fontSize: 10, color: tokens.muted }}>
                          {new Date(a.created_at).toLocaleDateString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {a.details && Object.keys(a.details).length > 0 && (
                        <div style={{ fontSize: 11, color: tokens.muted, marginTop: 4 }}>
                          {JSON.stringify(a.details)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "system" && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <InfoRow label={t("admin.user_id")} value={user.id} tokens={tokens} />
              <InfoRow label={t("admin.email_verified")} value={user.email_confirmed_at ? "Evet" : "Hayır"} tokens={tokens} />
              <InfoRow label={t("admin.phone_verified")} value={user.phone_confirmed_at ? "Evet" : "Hayır"} tokens={tokens} />
              <InfoRow label={t("admin.last_login")} value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("tr-TR") : "—" } tokens={tokens} />
              <InfoRow label={t("admin.theme_preference")} value={user.theme_preference || "Varsayılan (dark)"} tokens={tokens} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
