import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { displayProfileName } from "../../utils/profileDisplay";

const TRACKED_ACTIONS = [
  "unipulse_view_changed",
  "unipulse_view_left",
  "unipulse_route_changed",
  "login",
  "logout",
  "client_error",
  "client_unhandled_rejection",
  "client_render_error",
  "security_suspicious",
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

function eventPayload(log) {
  const details = asObject(log.details);
  const nested = asObject(details.details);
  return { ...details, ...nested };
}

function screenOf(log) {
  const payload = eventPayload(log);
  return payload.screen || log.details?.screen || payload.path || "Bilinmeyen ekran";
}

function pathOf(log) {
  const payload = eventPayload(log);
  return payload.path || log.details?.path || "";
}

function secondsLabel(seconds) {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  if (safe < 60) return `${safe} sn`;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  if (minutes < 60) return rest ? `${minutes} dk ${rest} sn` : `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const min = minutes % 60;
  return min ? `${hours} sa ${min} dk` : `${hours} sa`;
}

function timeAgo(dateString) {
  const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

function StatCard({ label, value, sub, tokens }) {
  return (
    <div style={{
      minWidth: 0,
      background: tokens.card,
      border: `1px solid ${tokens.border}`,
      borderRadius: 10,
      padding: 14,
    }}>
      <div style={{ color: tokens.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: tokens.textPrimary, fontSize: 24, fontWeight: 800, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ color: tokens.textSecondary, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children, tokens }) {
  return (
    <section style={{
      minWidth: 0,
      background: tokens.card,
      border: `1px solid ${tokens.border}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${tokens.border}`,
        color: tokens.textPrimary,
        fontSize: 13,
        fontWeight: 800,
      }}>
        {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </section>
  );
}

export default function AdminBehaviorInsights() {
  const { tokens } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(id, full_name, username, email, role)")
      .in("action", TRACKED_ACTIONS)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(700);

    if (!error) setLogs(data || []);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const insights = useMemo(() => {
    const byUser = new Map();
    const pageTotals = new Map();
    const exitTotals = new Map();
    const risky = logs.filter((log) => ["client_error", "client_unhandled_rejection", "client_render_error", "security_suspicious"].includes(log.action));
    const viewChanges = logs.filter((log) => log.action === "unipulse_view_changed");
    const viewLeaves = logs.filter((log) => log.action === "unipulse_view_left");

    logs.forEach((log) => {
      if (!log.user_id) return;
      const list = byUser.get(log.user_id) || [];
      list.push(log);
      byUser.set(log.user_id, list);
    });

    viewLeaves.forEach((log) => {
      const payload = eventPayload(log);
      const screen = screenOf(log);
      const duration = Number(payload.duration_seconds || 0);
      const page = pageTotals.get(screen) || { screen, path: pathOf(log), visits: 0, seconds: 0 };
      page.visits += 1;
      page.seconds += duration;
      if (!page.path) page.path = pathOf(log);
      pageTotals.set(screen, page);

      if (["pagehide", "beforeunload", "visibility_hidden"].includes(payload.reason)) {
        const exit = exitTotals.get(screen) || { screen, exits: 0, path: pathOf(log) };
        exit.exits += 1;
        if (!exit.path) exit.path = pathOf(log);
        exitTotals.set(screen, exit);
      }
    });

    const users = Array.from(byUser.entries()).map(([userId, userLogs]) => {
      const latestView = userLogs.find((log) => log.action === "unipulse_view_changed");
      const latestLeave = userLogs.find((log) => log.action === "unipulse_view_left" || log.action === "logout");
      const latestLog = userLogs[0];
      const online = Boolean(
        latestView &&
        (!latestLeave || new Date(latestView.created_at) > new Date(latestLeave.created_at)) &&
        Date.now() - new Date(latestView.created_at).getTime() < 15 * 60 * 1000
      );
      const startedAt = latestView ? new Date(latestView.created_at).getTime() : Date.now();
      return {
        userId,
        profile: latestLog.profiles,
        screen: latestView ? screenOf(latestView) : "Bilinmiyor",
        path: latestView ? pathOf(latestView) : "",
        online,
        lastSeen: latestLog.created_at,
        duration: online ? (Date.now() - startedAt) / 1000 : Number(eventPayload(latestLeave || {}).duration_seconds || 0),
        lastAction: latestLog.action,
      };
    }).sort((a, b) => Number(b.online) - Number(a.online) || new Date(b.lastSeen) - new Date(a.lastSeen));

    const topPages = Array.from(pageTotals.values())
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 6);

    const exitPages = Array.from(exitTotals.values())
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 6);

    const avgSeconds = viewLeaves.length
      ? viewLeaves.reduce((sum, log) => sum + Number(eventPayload(log).duration_seconds || 0), 0) / viewLeaves.length
      : 0;

    return {
      users,
      topPages,
      exitPages,
      risky,
      activeUsers: users.filter((item) => item.online).length,
      pageViews: viewChanges.length,
      avgSeconds,
    };
  }, [logs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, color: tokens.textPrimary, fontSize: 22, fontWeight: 850 }}>Kullanıcı Hareketleri</h2>
          <div style={{ color: tokens.textSecondary, fontSize: 12, marginTop: 4 }}>Canlı ekranlar, kalma süreleri, çıkış noktaları ve hata/güvenlik olayları</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
            <option value="30">Son 30 gün</option>
          </select>
          <button
            onClick={fetchLogs}
            style={{
              height: 36,
              borderRadius: 8,
              border: `1px solid ${tokens.border}`,
              background: tokens.surface,
              color: tokens.primary,
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Yenile
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <StatCard label="Aktif kullanıcı" value={loading ? "..." : insights.activeUsers} sub="Son 15 dakikada ekranı açık olanlar" tokens={tokens} />
        <StatCard label="Sayfa geçişi" value={loading ? "..." : insights.pageViews} sub={`${days} günlük hareket`} tokens={tokens} />
        <StatCard label="Ortalama süre" value={loading ? "..." : secondsLabel(insights.avgSeconds)} sub="Ekrandan ayrılma kayıtlarına göre" tokens={tokens} />
        <StatCard label="Hata / atak" value={loading ? "..." : insights.risky.length} sub="İstemci hatası ve güvenlik uyarısı" tokens={tokens} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.9fr)", gap: 16 }}>
        <Panel title="Kim Nerede?" tokens={tokens}>
          {loading ? (
            <div style={{ color: tokens.muted, fontSize: 12 }}>Yükleniyor...</div>
          ) : insights.users.length === 0 ? (
            <div style={{ color: tokens.muted, fontSize: 12 }}>Henüz izlenecek kullanıcı hareketi yok.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.users.slice(0, 10).map((item) => (
                <div key={item.userId} style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(150px, 1fr) minmax(160px, 1fr) 92px 92px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${tokens.border}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: tokens.textPrimary, fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayProfileName(item.profile, "Bilinmeyen kullanıcı")}
                    </div>
                    <div style={{ color: tokens.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.profile?.email || item.userId}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: tokens.textPrimary, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.screen}</div>
                    <div style={{ color: tokens.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.path}</div>
                  </div>
                  <span style={{
                    justifySelf: "start",
                    padding: "4px 8px",
                    borderRadius: 999,
                    color: item.online ? tokens.success : tokens.textSecondary,
                    background: item.online ? `${tokens.success}18` : tokens.surface,
                    fontSize: 11,
                    fontWeight: 800,
                  }}>
                    {item.online ? "Aktif" : "Pasif"}
                  </span>
                  <div style={{ color: tokens.textSecondary, fontSize: 11, textAlign: "right" }}>
                    <div>{secondsLabel(item.duration)}</div>
                    <div style={{ color: tokens.muted }}>{timeAgo(item.lastSeen)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="En Çok Vakit Geçirilen Sayfalar" tokens={tokens}>
            {insights.topPages.length === 0 ? (
              <div style={{ color: tokens.muted, fontSize: 12 }}>Süre kaydı oluşmadı.</div>
            ) : insights.topPages.map((page) => (
              <div key={page.screen} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${tokens.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: tokens.textPrimary, fontSize: 12, fontWeight: 800 }}>{page.screen}</div>
                  <div style={{ color: tokens.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.path}</div>
                </div>
                <div style={{ color: tokens.textSecondary, fontSize: 11, textAlign: "right", flexShrink: 0 }}>
                  <div>{secondsLabel(page.seconds)}</div>
                  <div>{page.visits} ziyaret</div>
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Çıkış Yapılan Ekranlar" tokens={tokens}>
            {insights.exitPages.length === 0 ? (
              <div style={{ color: tokens.muted, fontSize: 12 }}>Çıkış kaydı oluşmadı.</div>
            ) : insights.exitPages.map((page) => (
              <div key={page.screen} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${tokens.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: tokens.textPrimary, fontSize: 12, fontWeight: 800 }}>{page.screen}</div>
                  <div style={{ color: tokens.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.path}</div>
                </div>
                <div style={{ color: tokens.textSecondary, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{page.exits}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
