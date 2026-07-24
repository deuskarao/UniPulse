import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, AlertTriangle, Activity, MailCheck } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { displayProfileName } from "../../utils/profileDisplay";

const SECURITY_ACTIONS = [
  "security_suspicious",
  "client_error",
  "client_unhandled_rejection",
  "client_render_error",
];

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

function payloadOf(log) {
  const details = asObject(log.details);
  return { ...details, ...asObject(details.details) };
}

function Stat({ icon: Icon, label, value, tone, tokens }) {
  return (
    <div
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        borderRadius: 8,
        padding: 14,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ color: tokens.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
          <div style={{ color: tokens.textPrimary, fontSize: 24, fontWeight: 850, marginTop: 6 }}>{value}</div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: `${tone}18`,
            color: tone,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSecurityCenter() {
  const { tokens } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(full_name, username, email)")
      .in("action", SECURITY_ACTIONS)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(120);
    if (!error) setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const stats = useMemo(() => {
    const suspicious = logs.filter((log) => log.action === "security_suspicious").length;
    const errors = logs.filter((log) => log.action !== "security_suspicious").length;
    return { suspicious, errors, total: logs.length };
  }, [logs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Stat icon={ShieldCheck} label="Rate-limit" value="Aktif" tone={tokens.success} tokens={tokens} />
        <Stat icon={MailCheck} label="Mail aralığı" value="60 sn" tone={tokens.primary} tokens={tokens} />
        <Stat icon={AlertTriangle} label="Şüpheli istek" value={loading ? "..." : stats.suspicious} tone={tokens.warning} tokens={tokens} />
        <Stat icon={Activity} label="Hata kaydı" value={loading ? "..." : stats.errors} tone={tokens.danger} tokens={tokens} />
      </div>

      <section
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "13px 15px",
            borderBottom: `1px solid ${tokens.border}`,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: tokens.textPrimary, fontSize: 15, fontWeight: 850 }}>Güvenlik Olayları</h2>
            <p style={{ margin: "3px 0 0", color: tokens.textSecondary, fontSize: 11 }}>Son 7 gün, istemci hataları ve şüpheli URL denemeleri</p>
          </div>
          <button
            onClick={fetchLogs}
            style={{
              height: 34,
              padding: "0 12px",
              borderRadius: 8,
              border: `1px solid ${tokens.border}`,
              background: tokens.surface,
              color: tokens.primary,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Yenile
          </button>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div style={{ color: tokens.muted, fontSize: 12, padding: 20, textAlign: "center" }}>Yükleniyor...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: tokens.muted, fontSize: 12, padding: 20, textAlign: "center" }}>Son 7 günde güvenlik olayı yok.</div>
          ) : logs.map((log) => {
            const payload = payloadOf(log);
            const dangerous = log.action === "security_suspicious";
            return (
              <div
                key={log.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(150px, 1fr) minmax(180px, 1.1fr) 120px",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 8,
                  border: `1px solid ${tokens.border}`,
                  background: tokens.surface,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: tokens.textPrimary, fontSize: 13, fontWeight: 800 }}>{dangerous ? "Şüpheli İstek" : "İstemci Hatası"}</div>
                  <div style={{ color: tokens.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayProfileName(log.profiles, "Bilinmeyen kullanıcı")}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: tokens.textSecondary, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {payload.message || payload.reason || payload.pattern || log.action}
                  </div>
                  <div style={{ color: tokens.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {payload.path || payload.screen || "-"}
                  </div>
                </div>
                <div style={{ color: tokens.muted, fontSize: 11, textAlign: "right" }}>
                  {new Date(log.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
