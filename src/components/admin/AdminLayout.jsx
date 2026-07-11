import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import Sidebar from "../../layout/Sidebar";
import Header from "../../layout/Header";
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

const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { id: "users", label: "Kullanıcılar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { id: "applications", label: "Başvurular", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
  { id: "universities", label: "Üniversiteler", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>
  )},
  { id: "settings", label: "Ayarlar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
  { id: "reports", label: "Raporlar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { id: "logs", label: "Loglar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  )},
];

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

  const handleUserSelect = (user) => setSelectedUser(user);

  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setSelectedUser(updatedUser);
  };

  const handleBlockUser = async (userToBlock) => {
    const isBlocked = userToBlock.role === "blocked";
    const newRole = isBlocked ? "user" : "blocked";
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userToBlock.id);
    if (error) {
      showToast("İşlem başarısız oldu", "error");
    } else {
      showToast(`Kullanıcı ${isBlocked ? "engeli kaldırıldı" : "engellendi"}`);
      const updated = { ...userToBlock, role: newRole };
      handleUserUpdate(updated);
      logAction(isBlocked ? "unblock_user" : "block_user", { target_id: updated.id, name: updated.full_name });
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    const { error } = await supabase.from("profiles").delete().eq("id", userToDelete.id);
    if (error) {
      showToast("Kullanıcı silinemedi", "error");
    } else {
      showToast("Kullanıcı başarıyla silindi");
      setUsers(users.filter(u => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
      logAction("delete_user", { target_id: userToDelete.id, name: userToDelete.full_name });
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", targetUser.id);
    if (error) {
      showToast("Rol değiştirilemedi", "error");
    } else {
      showToast("Rol başarıyla güncellendi");
      const updated = { ...targetUser, role: newRole };
      handleUserUpdate(updated);
      logAction("change_role", { target_id: targetUser.id, name: targetUser.full_name, new_role: newRole });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.student_id?.toLowerCase().includes(q) ||
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

  const searchBar = (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{
        background: tokens.input,
        border: `1px solid ${tokens.border}`,
        width: 240,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        type="text"
        placeholder="Kullanıcı, e-posta, no ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: tokens.textPrimary,
          fontSize: 13,
          width: "100%",
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: tokens.background, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { navigate(page); setMobileSidebarOpen(false); }}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        customNavItems={ADMIN_NAV_ITEMS}
      />

      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: isMobile ? 0 : sidebarWidth, transition: "margin-left 200ms ease" }}>
        <Header
          sidebarWidth={sidebarWidth}
          onToggleCollapsed={() => setMobileSidebarOpen(true)}
          collapsed={sidebarCollapsed}
          pageTitle={PAGE_TITLES[activePage] || activePage}
          centerContent={["users", "dashboard"].includes(activePage) ? searchBar : null}
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
