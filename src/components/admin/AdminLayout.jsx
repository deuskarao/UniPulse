import React, { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { supabase } from "../../lib/supabase";
import { AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

// Admin components
import AdminDashboard from "./AdminDashboard";
import AdminUsersList from "./AdminUsersList";
import AdminUserDetails from "./AdminUserDetails";
import AdminQuickActions from "./AdminQuickActions";
import AdminNotes from "./AdminNotes";
import AdminActivityTimeline from "./AdminActivityTimeline";
import AdminUniversities from "./AdminUniversities";
import AdminClasses from "./AdminClasses";
import AdminSettings from "./AdminSettings";
import AdminReports from "./AdminReports";

const TABS = [
  { id: "dashboard", label: "admin.dashboard" },
  { id: "users", label: "admin.users" },
  { id: "classes", label: "admin.classes" },
  { id: "universities", label: "admin.universities" },
  { id: "reports", label: "admin.reports" },
  { id: "logs", label: "admin.logs" },
  { id: "settings", label: "admin.settings" }
];

export default function AdminLayout() {
  const { tokens, mode } = useTheme();
  const { profile, logout } = useAuth();
  const { t } = useI18n();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Sync tab with URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TABS.find(t => t.id === hash)) {
      setActiveTab(hash);
    } else {
      window.location.hash = "dashboard";
    }
  }, []);

  const handleTabChange = (id) => {
    setActiveTab(id);
    window.location.hash = id;
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logAction = async (action, details = null, targetUserId = null) => {
    try {
      await supabase.from("activity_logs").insert([{
        user_id: profile.id,
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
      setUsers(data || []);
      if (selectedUser) {
        const updated = data.find(u => u.id === selectedUser.id);
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

  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  const handleBlockUser = async (user, isBlocked) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_allowed: !isBlocked })
        .eq("id", user.id);
      if (error) throw error;
      
      const updatedUser = { ...user, is_allowed: !isBlocked };
      handleUserUpdate(updatedUser);
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
      
      const updatedUser = { ...user, role: newRole };
      handleUserUpdate(updatedUser);
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
        return <AdminDashboard users={users} loading={loading} />;
      case "users":
        return (
          <div style={{ display: "flex", gap: 24, height: "calc(100vh - 160px)", minHeight: 600 }}>
            <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminUsersList 
                users={users} 
                loading={loading}
                selectedUser={selectedUser}
                onSelect={setSelectedUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
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
            <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 4, paddingBottom: 40 }}>
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
        );
      case "classes":
        return <AdminClasses onUserSelect={(u) => { setSelectedUser(u); handleTabChange("users"); }} />;
      case "universities":
        return <AdminUniversities />;
      case "reports":
        return <AdminReports />;
      case "logs":
        return <AdminActivityTimeline isFullPage={true} />;
      case "settings":
        return <AdminSettings showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 24px", paddingTop: 24, paddingBottom: 40 }}>
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
      `}</style>

      {/* TABS HEADER */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${tokens.border}`, 
        marginBottom: 24
      }}>
        <div style={{ 
          display: "flex", 
          gap: 8, 
          overflowX: "auto",
          scrollbarWidth: "none"
        }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? tokens.primary : "transparent"}`,
                color: isActive ? tokens.primary : tokens.textSecondary,
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if(!isActive) e.target.style.color = tokens.textPrimary;
              }}
              onMouseLeave={(e) => {
                if(!isActive) e.target.style.color = tokens.textSecondary;
              }}
            >
              {t(tab.label)}
            </button>
          );
        })}
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: tokens.danger, background: "transparent", border: "none", cursor: "pointer", paddingRight: 8 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = tokens.danger + "15";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={16} />
          {t("app.logout")}
        </button>
      </div>

      {/* CONTENT */}
      {renderContent()}
    </div>
  );
}
