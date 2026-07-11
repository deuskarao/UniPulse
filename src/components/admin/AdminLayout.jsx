import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminDashboard from "./AdminDashboard";
import AdminUsersList from "./AdminUsersList";
import AdminUserDetails from "./AdminUserDetails";
import AdminNotes from "./AdminNotes";
import AdminActivityTimeline from "./AdminActivityTimeline";
import AdminQuickActions from "./AdminQuickActions";
import AdminApplications from "./AdminApplications";
import AdminUniversities from "./AdminUniversities";
import AdminReports from "./AdminReports";
import AdminSettings from "./AdminSettings";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel({ onBackToUser }) {
  const { tokens } = useTheme();
  const { user, profile } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace("#/", "").replace("#", "");
    return ["dashboard", "users", "applications", "universities", "settings", "reports", "logs"].includes(hash) ? hash : "dashboard";
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#/", "").replace("#", "");
      if (["dashboard", "users", "applications", "universities", "settings", "reports", "logs"].includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    if (!window.location.hash) window.location.hash = `/${activePage}`;
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (page) => {
    window.location.hash = `/${page}`;
    setActivePage(page);
  };
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, departments(ad), faculties(ad), universities(ad)")
      .order("created_at", { ascending: false });
    if (!error && data) {
      // department_name, faculty_name, university_name alanlarını düzleştir
      const enriched = data.map(u => ({
        ...u,
        department_name: u.departments?.ad || null,
        faculty_name: u.faculties?.ad || null,
        university_name: u.universities?.ad || null,
      }));
      setUsers(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const logAction = useCallback(async (action, details = {}, targetUserId = null) => {
    try {
      await supabase.from("activity_logs").insert({
        user_id: targetUserId || user?.id,
        action,
        details,
        ip_address: null,
      });
    } catch (e) {
      console.error("Activity log error:", e);
    }
  }, [user?.id]);

  const handleUserSelect = useCallback((u) => {
    setSelectedUser(u);
    setActivePage("users");
  }, []);

  const handleUserUpdate = useCallback(async (userId, updates) => {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      setSelectedUser(prev => prev?.id === userId ? { ...prev, ...updates } : prev);
      showToast("Kullanıcı güncellendi");
      logAction("user_updated", { target_user_id: userId, updates }, userId);
    } else {
      showToast("Güncelleme başarısız", "error");
    }
  }, [showToast, logAction]);

  const handleBlockUser = useCallback(async (userId, blocked) => {
    await handleUserUpdate(userId, { is_allowed: !blocked });
    logAction(blocked ? "user_blocked" : "user_unblocked", { target_user_id: userId }, userId);
  }, [handleUserUpdate, logAction]);

  const handleDeleteUser = useCallback(async (userId) => {
    try {
      const { error } = await supabase.rpc("delete_user", { target_id: userId });
      if (!error) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSelectedUser(null);
        showToast("Kullanıcı silindi");
        logAction("user_deleted", { target_user_id: userId }, userId);
      }
    } catch (e) {
      showToast("Silme işlemi başarısız", "error");
    }
  }, [showToast, logAction]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    await handleUserUpdate(userId, { role: newRole });
    logAction("role_changed", { target_user_id: userId, new_role: newRole }, userId);
  }, [handleUserUpdate, logAction]);

  const filteredUsers = users.filter(u => {
    if (u.role === "admin") return false;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? 72 : 240;

  const PAGE_TITLES = {
    dashboard: "Dashboard",
    users: "Kullanıcılar",
    applications: "Başvurular",
    universities: "Üniversiteler",
    settings: "Ayarlar",
    reports: "Raporlar",
    logs: "Loglar",
  };

  return (
    <div className="min-h-screen flex" style={{ background: tokens.background, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AdminSidebar
        activePage={activePage}
        onNavigate={(page) => { navigate(page); setMobileSidebarOpen(false); }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: isMobile ? 0 : sidebarWidth, transition: "margin-left 200ms ease" }}>
        <AdminHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          pageTitle={PAGE_TITLES[activePage] || activePage}
          onBackToUser={onBackToUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 overflow-auto" style={{ padding: isMobile ? "16px" : "24px 28px" }}>
          <AnimatePresence mode="wait">
            {activePage === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <AdminDashboard users={users} onUserSelect={handleUserSelect} />
              </motion.div>
            )}

            {activePage === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="flex gap-5 h-full" style={{ minHeight: "calc(100vh - 160px)" }}>
                <div className="flex-shrink-0" style={{ width: isMobile ? "100%" : "25%" }}>
                  <AdminUsersList users={filteredUsers} loading={loading} selectedUser={selectedUser} onSelect={handleUserSelect} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                </div>
                {!isMobile && (
                  <div className="flex-1 min-w-0">
                    <AdminUserDetails user={selectedUser} onUserUpdate={handleUserUpdate} onBlockUser={handleBlockUser} onDeleteUser={handleDeleteUser} onRoleChange={handleRoleChange} showToast={showToast} logAction={logAction} />
                  </div>
                )}
                {!isMobile && (
                  <div className="flex-shrink-0" style={{ width: "25%" }}>
                    <div className="flex flex-col gap-5">
                      <AdminQuickActions user={selectedUser} onBlockUser={handleBlockUser} onDeleteUser={handleDeleteUser} onRoleChange={handleRoleChange} showToast={showToast} />
                      <AdminNotes userId={selectedUser?.id} showToast={showToast} logAction={logAction} />
                      <AdminActivityTimeline userId={selectedUser?.id} />
                    </div>
                  </div>
                )}
                {isMobile && selectedUser && (
                  <div className="fixed inset-0 z-50" style={{ background: tokens.background }}>
                    <AdminUserDetails user={selectedUser} onUserUpdate={handleUserUpdate} onBlockUser={handleBlockUser} onDeleteUser={handleDeleteUser} onRoleChange={handleRoleChange} showToast={showToast} logAction={logAction} isMobile={true} onBack={() => setSelectedUser(null)} />
                  </div>
                )}
              </motion.div>
            )}

            {activePage === "applications" && (
              <motion.div key="applications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <AdminApplications onUserSelect={handleUserSelect} />
              </motion.div>
            )}

            {activePage === "universities" && (
              <motion.div key="universities" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <AdminUniversities />
              </motion.div>
            )}

            {activePage === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <AdminSettings showToast={showToast} />
              </motion.div>
            )}

            {activePage === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <AdminReports />
              </motion.div>
            )}

            {activePage === "logs" && (
              <motion.div key="logs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <AdminActivityTimeline userId={null} isFullPage={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl flex items-center gap-3 cursor-pointer"
            style={{ background: toast.type === "error" ? tokens.dangerLight : tokens.successLight, border: `1px solid ${toast.type === "error" ? tokens.danger + "40" : tokens.success + "40"}`, color: toast.type === "error" ? tokens.danger : tokens.success, fontWeight: 600, fontSize: 13, boxShadow: tokens.shadowLg }}
            onClick={() => setToast(null)}
          >
            <span>{toast.type === "error" ? "✕" : "✓"}</span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
