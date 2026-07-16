import { useI18n } from "../../context/I18nContext";
import { useState, useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 12;

export default function AdminUsersList({ users, loading, selectedUser, onSelect, searchQuery, onSearchChange }) {
  const { t } = useI18n();
  const { tokens } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (statusFilter === "active") return u.is_allowed !== false;
      if (statusFilter === "blocked") return u.is_allowed === false;
      return true;
    });
  }, [users, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        height: "calc(100vh - 160px)",
      }}
    >
      <div style={{ padding: "16px", borderBottom: `1px solid ${tokens.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
            Kullanıcılar ({filteredUsers.length})
          </span>
        </div>
        <div className="flex gap-2">
          {["all", "active", "blocked"].map(f => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
              style={{
                background: statusFilter === f ? tokens.primary + "20" : "transparent",
                color: statusFilter === f ? tokens.primary : tokens.muted,
                border: `1px solid ${statusFilter === f ? tokens.primary + "40" : tokens.border}`,
                cursor: "pointer",
              }}
            >
              {f === "all" ? t("admin.all") : f === "active" ? t("admin.status_active") : t("admin.status_blocked")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "8px" }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg mb-2 animate-pulse"
              style={{ height: 60, background: tokens.border + "40" }}
            />
          ))
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-10" style={{ color: tokens.muted, fontSize: 13 }}>
            Kullanıcı bulunamadı
          </div>
        ) : (
          paginatedUsers.map((u, i) => {
            const active = selectedUser?.id === u.id;
            return (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => onSelect(u)}
                className="w-full flex items-center gap-3 rounded-lg mb-1 transition-all duration-150 text-left"
                style={{
                  padding: "10px 12px",
                  background: active ? tokens.sidebarActive : "transparent",
                  color: active ? tokens.primary : tokens.textSecondary,
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = tokens.sidebarHover; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 36,
                      height: 36,
                      background: tokens.primary + "20",
                      color: tokens.primary,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {u.full_name?.[0] || u.email?.[0] || "?"}
                  </div>
                  <div
                    className="absolute rounded-full"
                    style={{
                      top: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: u.is_allowed === false ? tokens.danger : (u.is_online ? tokens.success : tokens.muted),
                      border: `2px solid ${tokens.card}`,
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold"
                    style={{
                      fontSize: 13,
                      color: tokens.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.full_name || t("admin.anonymous")}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: tokens.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.department_name || u.email}
                  </div>
                </div>
                {u.role === "admin" && (
                  <span
                    className="flex-shrink-0 rounded px-1.5 py-0.5"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: tokens.primary + "20",
                      color: tokens.primary,
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between"
          style={{ padding: "12px 16px", borderTop: `1px solid ${tokens.border}` }}
        >
          <span style={{ fontSize: 11, color: tokens.muted }}>
            Sayfa {currentPage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 text-xs font-semibold"
              style={{
                background: "transparent",
                border: `1px solid ${tokens.border}`,
                color: currentPage === 1 ? tokens.muted : tokens.textPrimary,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              ←
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded px-2 py-1 text-xs font-semibold"
              style={{
                background: "transparent",
                border: `1px solid ${tokens.border}`,
                color: currentPage === totalPages ? tokens.muted : tokens.textPrimary,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
