import { useI18n } from "../../context/I18nContext";
import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { displayProfileName } from "../../utils/profileDisplay";

export default function AdminQuickActions({ user, onBlockUser, onDeleteUser, onRoleChange, showToast }) {
  const { t } = useI18n();
  const { tokens } = useTheme();
  const { resetPassword } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  if (!user) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div style={{ padding: "14px 16px" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.quick_actions")}</span>
        </div>
        <div className="text-center py-6" style={{ color: tokens.muted, fontSize: 12 }}>
          Kullanıcı seçin
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>{t("admin.quick_actions")}</span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors duration-150 text-left"
            style={{
              background: "transparent",
              border: `1px solid ${tokens.border}`,
              color: tokens.textPrimary,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span className="flex items-center justify-center rounded" style={{ width: 28, height: 28, background: tokens.primary + "18", fontSize: 13 }}>👤</span>
            Rol Değiştir
          </button>

          <button
            onClick={() => onBlockUser(user, user.is_allowed !== false)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors duration-150 text-left"
            style={{
              background: "transparent",
              border: `1px solid ${tokens.border}`,
              color: user.is_allowed === false ? tokens.success : tokens.warning,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span className="flex items-center justify-center rounded" style={{ width: 28, height: 28, background: (user.is_allowed === false ? tokens.success : tokens.warning) + "18", fontSize: 13 }}>
              {user.is_allowed === false ? "🔓" : "🔒"}
            </span>
            {user.is_allowed === false ? t("admin.unblock") : t("admin.block")}
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors duration-150 text-left"
            style={{
              background: "transparent",
              border: `1px solid ${tokens.border}`,
              color: "#3B82F6",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span className="flex items-center justify-center rounded" style={{ width: 28, height: 28, background: "#3B82F618", fontSize: 13 }}>🔑</span>
            Şifre Sıfırla
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors duration-150 text-left"
            style={{
              background: "transparent",
              border: `1px solid ${tokens.danger}30`,
              color: tokens.danger,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = tokens.dangerLight}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span className="flex items-center justify-center rounded" style={{ width: 28, height: 28, background: tokens.danger + "18", fontSize: 13 }}>🗑️</span>
            Kullanıcıyı Sil
          </button>
        </div>
      </div>

      {showRoleModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowRoleModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 w-full max-w-sm"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadowLg }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", color: tokens.textPrimary, fontSize: 16, fontWeight: 700 }}>{t("admin.change_role")}</h3>
            <p style={{ fontSize: 13, color: tokens.muted, marginBottom: 16 }}>
              <strong>{displayProfileName(user)}</strong> {t("admin.change_role_desc")}
            </p>
            <div className="flex flex-col gap-2 mb-5">
              {["user", "admin"].map(role => (
                <button
                  key={role}
                  onClick={() => { onRoleChange(user, role); setShowRoleModal(false); }}
                  className="w-full rounded-lg px-4 py-3 text-left font-semibold transition-colors duration-150"
                  style={{
                    background: user.role === role ? tokens.primary + "20" : "transparent",
                    border: `1px solid ${user.role === role ? tokens.primary + "40" : tokens.border}`,
                    color: user.role === role ? tokens.primary : tokens.textPrimary,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {role === "admin" ? t("admin.role_admin") : t("admin.role_user")}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full rounded-lg py-2.5 text-xs font-semibold"
              style={{ border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.muted, cursor: "pointer" }}
            >
              İptal
            </button>
          </motion.div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 w-full max-w-sm text-center"
            style={{ background: tokens.card, border: `1px solid ${tokens.danger}40`, boxShadow: tokens.shadowLg }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: tokens.textPrimary, fontSize: 16 }}>{t("admin.delete_user")}</h3>
            <p style={{ margin: "0 0 20px", color: tokens.muted, fontSize: 13 }}>
              <strong>{displayProfileName(user)}</strong> {t("admin.delete_confirm")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg px-5 py-2.5 text-xs font-semibold"
                style={{ border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer" }}
              >
                İptal
              </button>
              <button
                onClick={() => { onDeleteUser(user); setShowDeleteModal(false); }}
                className="rounded-lg px-5 py-2.5 text-xs font-semibold"
                style={{ background: tokens.danger, color: "#fff", border: "none", cursor: "pointer" }}
              >
                Sil
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowPasswordModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 w-full max-w-sm text-center"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadowLg }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
            <h3 style={{ margin: "0 0 8px", color: tokens.textPrimary, fontSize: 16 }}>{t("admin.reset_password")}</h3>
            <p style={{ margin: "0 0 20px", color: tokens.muted, fontSize: 13 }}>
              <strong>{displayProfileName(user)}</strong> {t("admin.reset_password_desc")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg px-5 py-2.5 text-xs font-semibold"
                style={{ border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.textSecondary, cursor: "pointer" }}
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  setSendingReset(true);
                  try {
                    await resetPassword(user.email);
                    showToast(t("admin.reset_password_sent"));
                    setShowPasswordModal(false);
                  } catch (e) {
                    showToast("Gönderilemedi: " + e.message, "error");
                  }
                  setSendingReset(false);
                }}
                disabled={sendingReset}
                className="rounded-lg px-5 py-2.5 text-xs font-semibold"
                style={{
                  background: sendingReset ? tokens.muted : "#3B82F6",
                  color: "#fff",
                  border: "none",
                  cursor: sendingReset ? "not-allowed" : "pointer",
                }}
              >
                {sendingReset ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
