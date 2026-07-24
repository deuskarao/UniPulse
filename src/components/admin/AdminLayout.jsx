import React, { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { supabase } from "../../lib/supabase";
import { AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";

// Admin components
import AdminDashboard from "./AdminDashboard";
import AdminUsersList from "./AdminUsersList";
import AdminUserDetails from "./AdminUserDetails";
import AdminQuickActions from "./AdminQuickActions";
import AdminNotes from "./AdminNotes";
import AdminActivityTimeline from "./AdminActivityTimeline";
import AdminBehaviorInsights from "./AdminBehaviorInsights";
import AdminAcademicCenter from "./AdminAcademicCenter";
import AdminSecurityCenter from "./AdminSecurityCenter";
import AdminSettings from "./AdminSettings";
import AdminReports from "./AdminReports";
import { displayProfileName, sanitizeProfileUpdates } from "../../utils/profileDisplay";
import { replaceHashRoute, resolveAdminRoute, setHashRoute } from "../../utils/routeState";

const TABS = [
  { id: "dashboard", label: "Genel Bakış", description: "Sistem sağlığı, kayıtlar ve veri tutarlılığı", icon: LayoutDashboard },
  { id: "users", label: "Kullanıcılar", description: "Profil, rol, notlar ve son hareketler", icon: Users },
  { id: "logs", label: "Canlı Hareket", description: "Kim nerede, nereden çıktı, nerede vakit geçiriyor", icon: Activity },
  { id: "academic", label: "Akademik Veri", description: "Sınıf, üniversite, fakülte, bölüm ve ders bağlantıları", icon: GraduationCap },
  { id: "reports", label: "Raporlar", description: "GANO, harf notu, kayıt ve sistem dağılımları", icon: BarChart3 },
  { id: "security", label: "Güvenlik", description: "Rate-limit, şüpheli istekler ve hata kayıtları", icon: ShieldCheck },
  { id: "settings", label: "Ayarlar", description: "Dil, tema, roller ve admin tercihleri", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { tokens, mode, setMode } = useTheme();
  const { profile, user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const syncAdminRoute = () => {
      const route = resolveAdminRoute();
      setActiveTab(route.tab);
      if (route.shouldReplace) {
        replaceHashRoute(route.canonical);
      }
    };
    window.addEventListener("hashchange", syncAdminRoute);
    syncAdminRoute();
    return () => window.removeEventListener("hashchange", syncAdminRoute);
  }, []);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setHashRoute(`admin/${id}`);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logAction = async (action, details = null, targetUserId = null) => {
    try {
      await supabase.from("activity_logs").insert([{
        user_id: profile?.id || user?.id,
        target_user_id: targetUserId,
        action,
        details
      }]);
    } catch (err) {
      console.error("Failed to log action:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          department:departments(ad),
          faculty:faculties(ad),
          university:universities(ad)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(u => ({
        ...u,
        full_name: displayProfileName(u, ""),
        department_name: u.department?.ad || null,
        faculty_name: u.faculty?.ad || null,
        university_name: u.university?.ad || null
      }));
      
      setUsers(mappedData);
      if (selectedUser) {
        const updated = mappedData.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      console.error("Kullanıcılar yüklenirken hata:", err);
      showToast(t("admin.error_failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserUpdate = async (userId, updates) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(sanitizeProfileUpdates(updates))
        .eq("id", userId);
      if (error) throw error;
      
      await fetchUsers();
      showToast(t("admin.user_updated") || "Kullanıcı güncellendi");
      logAction("Kullanıcı bilgileri güncellendi", null, userId);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      showToast(t("admin.error_failed"), "error");
    }
  };

  const handleBlockUser = async (user, isBlocked) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_allowed: !isBlocked })
        .eq("id", user.id);
      if (error) throw error;
      
      await fetchUsers();
      showToast(isBlocked ? t("admin.user_blocked") : t("admin.user_unblocked"));
      logAction(isBlocked ? "Kullanıcı engellendi" : "Kullanıcı engeli kaldırıldı", null, user.id);
    } catch (err) {
      console.error("Engelleme hatası:", err);
      showToast(t("admin.error_failed"), "error");
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      const { error } = await supabase.rpc("delete_user_admin", { target_uid: user.id });
      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      showToast(t("admin.user_deleted"));
      logAction("Kullanıcı silindi", user.email, null);
    } catch (err) {
      console.error("Silme hatası:", err);
      showToast(t("admin.error_failed"), "error");
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);
      if (error) throw error;
      
      await fetchUsers();
      showToast(t("admin.role_updated"));
      logAction("Rol değiştirildi", `Yeni rol: ${newRole}`, user.id);
    } catch (err) {
      console.error("Rol değiştirme hatası:", err);
      showToast(t("admin.error_failed"), "error");
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <AdminDashboard 
            users={users} 
            loading={loading} 
            onUserSelect={(u) => {
              if (u) setSelectedUser(u);
              handleTabChange("users");
            }} 
          />
        );
      case "users":
        return (
          <div className="admin-users-workspace">
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminUsersList 
                users={users} 
                loading={loading}
                selectedUser={selectedUser}
                onSelect={setSelectedUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <AdminUserDetails 
                user={selectedUser}
                onUserUpdate={handleUserUpdate}
                onBlockUser={handleBlockUser}
                onDeleteUser={handleDeleteUser}
                onRoleChange={handleRoleChange}
                showToast={showToast}
                logAction={logAction}
              />
            </div>
            <div style={{ minWidth: 0, height: "100%", overflowY: "auto", paddingRight: 4, paddingBottom: 40 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <AdminQuickActions 
                  user={selectedUser}
                  onBlockUser={handleBlockUser}
                  onDeleteUser={handleDeleteUser}
                  onRoleChange={handleRoleChange}
                  showToast={showToast}
                />
                <AdminNotes 
                  userId={selectedUser?.id}
                  showToast={showToast}
                  logAction={logAction}
                />
                <AdminActivityTimeline userId={selectedUser?.id} />
              </div>
            </div>
          </div>
        );
      case "academic":
        return <AdminAcademicCenter onUserSelect={(u) => { setSelectedUser(u); handleTabChange("users"); }} />;
      case "reports":
        return <AdminReports />;
      case "logs":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <AdminBehaviorInsights />
            <AdminActivityTimeline isFullPage={true} />
          </div>
        );
      case "security":
        return <AdminSecurityCenter />;
      case "settings":
        return <AdminSettings showToast={showToast} />;
      default:
        return null;
    }
  };

  const activeMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const activeUsers = users.filter((item) => item.role !== "admin" && item.is_allowed !== false).length;
  const totalStudents = users.filter((item) => item.role !== "admin").length;
  const blockedUsers = users.filter((item) => item.role !== "admin" && item.is_allowed === false).length;

  return (
    <div style={{ width: "100%", maxWidth: 1560, margin: "0 auto", padding: "18px 20px 34px" }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: toast.type === "error" ? tokens.danger : tokens.success,
            color: "#fff", padding: "12px 20px", borderRadius: 12,
            boxShadow: tokens.shadowLg, fontSize: 14, fontWeight: 500,
            animation: "slideIn 0.3s ease"
          }}>
            {toast.message}
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes slideIn { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .admin-redesign-shell {
          display: grid;
          grid-template-columns: 238px minmax(0, 1fr);
          min-height: calc(100vh - 92px);
          border: 1px solid ${tokens.border};
          border-radius: 8px;
          overflow: hidden;
          background: ${tokens.card};
          box-shadow: ${tokens.shadowMd};
        }
        .admin-redesign-sidebar {
          background: ${tokens.sidebar};
          border-right: 1px solid ${tokens.border};
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .admin-redesign-main {
          min-width: 0;
          background:
            linear-gradient(135deg, ${tokens.primary}10 0%, transparent 34%),
            ${tokens.background};
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .admin-redesign-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .admin-redesign-nav-button {
          width: 100%;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          align-items: center;
          gap: 9px;
          padding: 9px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: ${tokens.textSecondary};
          cursor: pointer;
          text-align: left;
          transition: all 0.16s ease;
        }
        .admin-redesign-nav-button:hover {
          background: ${tokens.sidebarHover};
          color: ${tokens.textPrimary};
        }
        .admin-redesign-nav-button.is-active {
          background: ${tokens.primary}18;
          color: ${tokens.primary};
          border-color: ${tokens.primary}38;
        }
        .admin-redesign-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: ${tokens.surface};
          border: 1px solid ${tokens.border};
        }
        .admin-redesign-nav-button.is-active .admin-redesign-icon {
          background: ${tokens.primary}22;
          border-color: ${tokens.primary}3d;
        }
        .admin-redesign-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 2px 2px 0;
        }
        .admin-redesign-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .admin-icon-button {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid ${tokens.border};
          background: ${tokens.card};
          color: ${tokens.textPrimary};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .admin-action-button {
          height: 36px;
          border-radius: 8px;
          border: 1px solid ${tokens.border};
          background: ${tokens.card};
          color: ${tokens.textPrimary};
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .admin-users-workspace {
          display: grid;
          grid-template-columns: minmax(260px, 320px) minmax(0, 1fr) minmax(260px, 300px);
          gap: 16px;
          min-height: 620px;
          height: calc(100vh - 180px);
        }
        @media (max-width: 1200px) {
          .admin-users-workspace {
            grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
            height: auto;
          }
          .admin-users-workspace > div:nth-child(3) {
            grid-column: 1 / -1;
            height: auto !important;
          }
        }
        @media (max-width: 920px) {
          .admin-redesign-shell {
            grid-template-columns: 1fr;
          }
          .admin-redesign-sidebar {
            border-right: 0;
            border-bottom: 1px solid ${tokens.border};
          }
          .admin-redesign-nav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .admin-users-workspace {
            grid-template-columns: 1fr;
            min-height: 0;
          }
        }
        @media (max-width: 560px) {
          .admin-redesign-main {
            padding: 12px;
          }
          .admin-redesign-nav {
            grid-template-columns: 1fr;
          }
          .admin-redesign-header {
            align-items: stretch;
          }
          .admin-redesign-toolbar {
            width: 100%;
          }
        }
      `}</style>

      <section className="admin-redesign-shell">
        <aside className="admin-redesign-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                background: tokens.primary,
                color: "#fff",
                fontWeight: 900,
                letterSpacing: 0,
                flexShrink: 0,
              }}
            >
              UP
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: tokens.textPrimary, fontWeight: 900, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                UniPulse Admin
              </div>
              <div style={{ color: tokens.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Kontrol merkezi
              </div>
            </div>
          </div>

          <nav className="admin-redesign-nav" aria-label="Admin menüsü">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`admin-redesign-nav-button ${isActive ? "is-active" : ""}`}
                  title={tab.description}
                >
                  <span className="admin-redesign-icon"><Icon size={17} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab.label}</span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 10, color: isActive ? tokens.primary : tokens.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            style={{
              marginTop: "auto",
              border: `1px solid ${tokens.border}`,
              background: tokens.surface,
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ color: tokens.textPrimary, fontSize: 12, fontWeight: 850 }}>{displayProfileName(profile, "Admin")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                ["Toplam", totalStudents],
                ["Aktif", activeUsers],
                ["Risk", blockedUsers],
              ].map(([label, value]) => (
                <div key={label} style={{ minWidth: 0 }}>
                  <div style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 900 }}>{value}</div>
                  <div style={{ color: tokens.muted, fontSize: 10 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="admin-redesign-main">
          <header className="admin-redesign-header">
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, color: tokens.textPrimary, fontSize: 24, fontWeight: 900, letterSpacing: 0 }}>
                {activeMeta.label}
              </h1>
              <p style={{ margin: "5px 0 0", color: tokens.textSecondary, fontSize: 13 }}>
                {activeMeta.description}
              </p>
            </div>

            <div className="admin-redesign-toolbar">
              <button className="admin-action-button" onClick={fetchUsers} title="Verileri yenile">
                <RefreshCw size={15} />
                Yenile
              </button>
              <button
                onClick={() => {
                  const newMode = mode === 'dark' ? 'light' : 'dark';
                  setMode(newMode);
                  if (user?.id) supabase.from("profiles").update({ theme_preference: newMode }).eq("id", user.id).then(()=>{}).catch(()=>{});
                }}
                className="admin-icon-button"
                title={t("admin.theme_preference")}
              >
                {mode === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  height: 36,
                  borderRadius: 8,
                  border: `1px solid ${tokens.border}`,
                  background: tokens.card,
                  color: tokens.textPrimary,
                  padding: "0 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
                title="Dil seçimi"
              >
                 <option value="tr">TR</option>
                 <option value="en">EN</option>
                 <option value="es">ES</option>
                 <option value="it">IT</option>
                 <option value="ru">RU</option>
              </select>
              <button
                onClick={logout}
                className="admin-action-button"
                style={{ color: tokens.danger, borderColor: `${tokens.danger}42` }}
                title="Çıkış yap"
              >
                <LogOut size={15} />
                {t("app.logout")}
              </button>
            </div>
          </header>

          <div style={{ minWidth: 0 }}>
            {renderContent()}
          </div>
        </main>
      </section>
    </div>
  );
}
