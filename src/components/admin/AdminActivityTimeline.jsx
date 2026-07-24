import { useI18n } from "../../context/I18nContext";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import { displayProfileName } from "../../utils/profileDisplay";

const ACTION_ICONS = {
  login: { icon: "🔑", color: "#22C55E" },
  logout: { icon: "🚪", color: "#94A3B8" },
  client_error: { icon: "⚠️", color: "#EF4444" },
  client_unhandled_rejection: { icon: "⚠️", color: "#EF4444" },
  client_render_error: { icon: "⚠️", color: "#EF4444" },
  security_suspicious: { icon: "🛡️", color: "#F59E0B" },
  client_event: { icon: "🌐", color: "#3B82F6" },
  unipulse_user_identified: { icon: "👤", color: "#38BDF8" },
  unipulse_view_changed: { icon: "🧭", color: "#38BDF8" },
  unipulse_view_left: { icon: "⏱️", color: "#F59E0B" },
  unipulse_route_changed: { icon: "🧭", color: "#38BDF8" },
  unipulse_login_seen: { icon: "🔑", color: "#22C55E" },
  unipulse_session_loaded: { icon: "🔄", color: "#38BDF8" },
  user_updated: { icon: "✏️", color: "#3B82F6" },
  user_blocked: { icon: "🔒", color: "#EF4444" },
  user_unblocked: { icon: "🔓", color: "#22C55E" },
  user_deleted: { icon: "🗑️", color: "#EF4444" },
  role_changed: { icon: "👤", color: "#8B5CF6" },
  note_added: { icon: "📝", color: "#F59E0B" },
  note_deleted: { icon: "🗑️", color: "#EF4444" },
  grade_updated: { icon: "📊", color: "#3B82F6" },
  profile_updated: { icon: "✏️", color: "#3B82F6" },
};

const ACTION_LABELS = {
  login: "Giriş yaptı",
  logout: "Çıkış yaptı",
  client_error: "İstemci hatası",
  client_unhandled_rejection: "İstemci hatası",
  client_render_error: "Ekran hatası",
  security_suspicious: "Güvenlik uyarısı",
  client_event: "İstemci olayı",
  unipulse_user_identified: "Kullanıcı tanındı",
  unipulse_view_changed: "Ekran açıldı",
  unipulse_view_left: "Ekrandan ayrıldı",
  unipulse_route_changed: "Sayfa değişti",
  unipulse_login_seen: "Giriş görüldü",
  unipulse_session_loaded: "Oturum yüklendi",
  user_updated: "Kullanıcı güncellendi",
  user_blocked: "Kullanıcı engellendi",
  user_unblocked: "Kullanıcı engeli kaldırıldı",
  user_deleted: "Kullanıcı silindi",
  role_changed: "Rol değiştirildi",
  note_added: "Not eklendi",
  note_deleted: "Not silindi",
  grade_updated: "Not güncellendi",
  profile_updated: "Profil güncellendi",
};

function asObject(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : { message: parsed };
    } catch {
      return { message: value };
    }
  }
  return { value };
}

function textValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function eventPayload(log) {
  const details = asObject(log.details);
  const nested = asObject(details.details);
  return { ...details, ...nested };
}

function DetailChip({ label, value, tokens }) {
  const text = textValue(value);
  if (!text) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        maxWidth: "100%",
        padding: "3px 7px",
        borderRadius: 6,
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        color: tokens.muted,
        fontSize: 10,
      }}
    >
      <strong style={{ color: tokens.textSecondary }}>{label}</strong>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </span>
  );
}

export default function AdminActivityTimeline({ userId, isFullPage }) {
  const { t } = useI18n();
  const { tokens } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(isFullPage ? "7" : "3");
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    let query = supabase
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(full_name, email)")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(isFullPage ? 200 : 10);

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (action !== "all") {
      query = query.eq("action", action);
    }

    const { data, error } = await query;
    if (!error && data) {
      const needle = search.trim().toLocaleLowerCase("tr-TR");
      const filtered = needle
        ? data.filter((item) => {
            const details = eventPayload(item);
            return [
              item.action,
              item.ip_address,
              displayProfileName(item.profiles, ""),
              item.profiles?.email,
              textValue(details.message),
              textValue(details.path),
              textValue(details.reason),
              textValue(details.scope),
            ].some((value) => textValue(value).toLocaleLowerCase("tr-TR").includes(needle));
          })
        : data;
      setActivities(filtered);
    }
    setLoading(false);
  }, [userId, isFullPage, days, action, search]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const actionOptions = Array.from(new Set(["all", ...Object.keys(ACTION_LABELS), ...activities.map((item) => item.action)])).filter(Boolean);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}` }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
          {isFullPage ? "Tüm Aktivite Logları" : "Son Aktiviteler"}
        </span>
        <button
          onClick={fetchActivities}
          className="rounded px-2 py-1 text-xs"
          style={{ background: "transparent", border: "none", color: tokens.primary, cursor: "pointer", fontWeight: 600 }}
        >
          Yenile
        </button>
      </div>
      {isFullPage && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px, 1fr) 150px 160px",
            gap: 8,
            padding: "12px 16px",
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kullanıcı, IP, path veya detay ara"
            style={{
              minWidth: 0,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${tokens.border}`,
              background: tokens.input,
              color: tokens.textPrimary,
              padding: "0 10px",
              fontSize: 12,
            }}
          />
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            style={{
              height: 36,
              borderRadius: 8,
              border: `1px solid ${tokens.border}`,
              background: tokens.input,
              color: tokens.textPrimary,
              padding: "0 10px",
              fontSize: 12,
            }}
          >
            {actionOptions.map((option) => (
              <option key={option} value={option}>{option === "all" ? "Tüm işlemler" : ACTION_LABELS[option] || option}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(event) => setDays(event.target.value)}
            style={{
              height: 36,
              borderRadius: 8,
              border: `1px solid ${tokens.border}`,
              background: tokens.input,
              color: tokens.textPrimary,
              padding: "0 10px",
              fontSize: 12,
            }}
          >
            <option value="1">Son 24 saat</option>
            <option value="3">Son 3 gün</option>
            <option value="7">Son 7 gün</option>
            <option value="14">Son 14 gün</option>
            <option value="30">Son 30 gün</option>
          </select>
        </div>
      )}

      <div style={{ maxHeight: isFullPage ? "calc(100vh - 200px)" : "none", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>{t("admin.loading")}</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>{t("admin.no_activity_found")}</div>
        ) : (
          activities.map((a, i) => {
            const actionInfo = ACTION_ICONS[a.action] || { icon: "📋", color: "#94A3B8" };
            const label = ACTION_LABELS[a.action] || a.action;
            const details = eventPayload(a);
            const summary = textValue(details.message || details.screen || details.reason || details.scope || details.path);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="flex gap-3 transition-colors duration-150"
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${tokens.border}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="flex-shrink-0 relative">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 32,
                      height: 32,
                      background: actionInfo.color + "18",
                      fontSize: 14,
                    }}
                  >
                    {actionInfo.icon}
                  </div>
                  {i < activities.length - 1 && (
                    <div
                      className="absolute"
                      style={{
                        left: 15,
                        top: 36,
                        width: 2,
                        height: "calc(100% + 8px)",
                        background: tokens.border,
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, color: tokens.textPrimary, fontWeight: 500 }}>
                    {label}
                  </div>
                  {isFullPage && a.profiles && (
                    <div style={{ fontSize: 11, color: tokens.muted, marginTop: 2 }}>
                      {displayProfileName(a.profiles)}
                    </div>
                  )}
                  {summary && (
                    <div style={{ fontSize: 11, color: tokens.textSecondary, marginTop: 4, overflowWrap: "anywhere" }}>
                      {summary}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    <DetailChip label="path" value={details.path} tokens={tokens} />
                    <DetailChip label="screen" value={details.screen} tokens={tokens} />
                    <DetailChip label="duration" value={details.duration_seconds ? `${details.duration_seconds} sn` : ""} tokens={tokens} />
                    <DetailChip label="method" value={details.method} tokens={tokens} />
                    <DetailChip label="scope" value={details.scope} tokens={tokens} />
                    <DetailChip label="reason" value={details.reason} tokens={tokens} />
                    <DetailChip label="ip" value={a.ip_address} tokens={tokens} />
                  </div>
                  {details.userAgent && (
                    <div style={{ fontSize: 10, color: tokens.muted, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      UA: {textValue(details.userAgent)}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: tokens.muted, marginTop: 2 }}>
                    {new Date(a.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
