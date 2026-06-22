import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminHeader({ onOpenMobileSidebar, pageTitle, onBackToUser, searchQuery, onSearchChange }) {
  const { tokens, mode, toggleTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  const initial = ((profile?.full_name || user?.email || "?")[0] || "?").toUpperCase();

  useEffect(() => {
    async function loadNotifs() {
      if (!user) return;
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    }
    loadNotifs();
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (notifOpen || menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen, menuOpen]);

  async function markAllRead() {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("user_notifications").update({ is_read: true }).in("id", unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }

  const themeIcon = mode === "dark" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  );

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between"
      style={{
        height: 64,
        padding: "0 24px",
        background: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            border: `1px solid ${tokens.border}`,
            background: "transparent",
            color: tokens.textPrimary,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary }}>{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
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
            placeholder="Kullanıcı ara..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: tokens.textPrimary, border: "none" }}
          />
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-lg transition-colors duration-150"
          style={{
            width: 36,
            height: 36,
            border: `1px solid ${tokens.border}`,
            background: "transparent",
            color: tokens.textSecondary,
            cursor: "pointer",
          }}
        >
          {themeIcon}
        </button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{
              width: 36,
              height: 36,
              border: `1px solid ${tokens.border}`,
              background: notifOpen ? tokens.primary + "15" : "transparent",
              color: notifOpen ? tokens.primary : tokens.textSecondary,
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unreadCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: 99,
                  background: tokens.danger,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 overflow-hidden"
                style={{
                  top: "calc(100% + 8px)",
                  width: 300,
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  boxShadow: tokens.shadowLg,
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "12px 14px", borderBottom: `1px solid ${tokens.border}` }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Bildirimler</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ fontSize: 11, color: tokens.primary, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                    >
                      Tümünü okundu işaretle
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 13 }}>
                      Bildirim bulunmuyor
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding: "12px 14px",
                          borderBottom: `1px solid ${tokens.border}`,
                          background: n.read ? "transparent" : tokens.primary + "08",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontSize: 12.5, color: tokens.textPrimary, fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: tokens.muted, marginTop: 4 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              border: `1px solid ${tokens.border}`,
              background: tokens.primary + "20",
              color: tokens.primary,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {initial}
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40" />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 overflow-hidden"
                  style={{
                    top: "calc(100% + 8px)",
                    width: 220,
                    background: tokens.card,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 14,
                    boxShadow: tokens.shadowLg,
                    zIndex: 50,
                  }}
                >
                  <div style={{ padding: "12px 14px", borderBottom: `1px solid ${tokens.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{profile?.full_name || "Admin"}</div>
                    <div style={{ fontSize: 11, color: tokens.muted, marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left"
                    style={{
                      padding: "10px 14px",
                      background: "transparent",
                      border: "none",
                      color: tokens.danger,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Çıkış Yap
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
