import { supabase } from '../lib/supabase';
import { displayProfileName, displayUsername } from './profileDisplay';

const SUSPICIOUS_PATTERNS = [
  /\.\./,
  /<script/i,
  /union\s+select/i,
  /information_schema/i,
  /\/wp-admin/i,
  /\/phpmyadmin/i,
  /\/\.env/i,
  /eyJ[a-zA-Z0-9_-]{20,}/,
];

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');
const POSTHOG_APP = import.meta.env.VITE_POSTHOG_APP || 'unipulse';
let installed = false;
let currentIdentity = null;
let currentView = null;
let lastViewClosedAt = 0;

const SCREEN_LABELS = {
  dashboard: 'Dashboard',
  users: 'Kullanıcılar',
  classes: 'Sınıflar',
  universities: 'Üniversiteler',
  reports: 'Raporlar',
  logs: 'Loglar',
  settings: 'Ayarlar',
  courses: 'Dersler',
  leaderboard: 'Liderlik Tablosu',
  profile: 'Profil',
};

function getAnonymousId() {
  try {
    const key = 'unipulse_distinct_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID?.() || `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, next);
    return next;
  } catch {
    return 'anonymous';
  }
}

function safeTarget(target) {
  if (!target || !(target instanceof Element)) return {};
  const text = (target.getAttribute('aria-label') || target.getAttribute('title') || target.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return {
    tag: target.tagName.toLowerCase(),
    id: target.id || undefined,
    role: target.getAttribute('role') || undefined,
    name: target.getAttribute('name') || undefined,
    type: target.getAttribute('type') || undefined,
    href: target instanceof HTMLAnchorElement ? target.pathname + target.hash : undefined,
    text: text || undefined,
  };
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function currentScreenName() {
  const raw = (window.location.hash || window.location.pathname || 'dashboard')
    .replace(/^#\/?/, '')
    .replace(/^\//, '')
    .split(/[/?&]/)[0] || 'dashboard';
  return SCREEN_LABELS[raw] || raw || 'Ana Ekran';
}

function publicIdentity(profile = {}, authUser = {}) {
  const id = profile.id || authUser.id || currentIdentity?.id;
  const email = profile.email || authUser.email || currentIdentity?.email;
  const name = displayProfileName(profile, '') || authUser.user_metadata?.full_name || email || undefined;
  const username = displayUsername(profile) || authUser.user_metadata?.user_name || undefined;
  return {
    id,
    email,
    name,
    username,
    role: profile.role || undefined,
    department: profile.department_name || profile.department?.ad || undefined,
  };
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function storeLocal(entry) {
  try {
    const key = 'unipulse_dev_logs';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    logs.unshift(entry);
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 100)));
  } catch {}
}

function sendPostHog(type, entry, userId) {
  if (!POSTHOG_KEY) return;
  const distinctId = userId || currentIdentity?.id || getAnonymousId();
  const identityProps = currentIdentity
    ? compactObject({
        email: currentIdentity.email,
        name: currentIdentity.name,
        username: currentIdentity.username,
        role: currentIdentity.role,
        department: currentIdentity.department,
        app: POSTHOG_APP,
        platform: 'web',
      })
    : null;
  const body = JSON.stringify({
    api_key: POSTHOG_KEY,
    event: type,
    distinct_id: distinctId,
    properties: {
      app: POSTHOG_APP,
      platform: 'web',
      source: 'client',
      env: import.meta.env.MODE || 'development',
      path: entry.path,
      screen: entry.screen || currentScreenName(),
      page: entry.screen || currentScreenName(),
      url: window.location.href,
      $current_url: window.location.href,
      $pathname: window.location.pathname,
      $host: window.location.host,
      $screen_name: entry.screen || currentScreenName(),
      $referrer: document.referrer || undefined,
      referrer: document.referrer || undefined,
      userAgent: entry.userAgent,
      details: entry.details,
      ...(identityProps ? { $set: identityProps } : {}),
    },
  });

  navigator.sendBeacon?.(`${POSTHOG_HOST}/capture/`, new Blob([body], { type: 'application/json' })) ||
    fetch(`${POSTHOG_HOST}/capture/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

function persistActivity(type, entry, userId) {
  const resolvedUserId = userId || currentIdentity?.id;
  if (!resolvedUserId) return;
  supabase
    .from('activity_logs')
    .insert({
      user_id: resolvedUserId,
      action: type,
      details: entry,
      ip_address: null,
    })
    .then(() => {})
    .catch(() => {});
}

export function identifyUser(profile = {}, authUser = {}) {
  currentIdentity = publicIdentity(profile, authUser);
  if (currentIdentity?.id) {
    try {
      localStorage.setItem('unipulse_distinct_id', currentIdentity.id);
    } catch {}
    captureEvent('unipulse_user_identified', {
      email: currentIdentity.email,
      name: currentIdentity.name,
      username: currentIdentity.username,
      role: currentIdentity.role,
    }, currentIdentity.id);
    if (currentView) {
      captureEvent('unipulse_view_changed', {
        screen: currentView.screen,
        path: currentView.path,
        reason: 'identity_attached',
      }, currentIdentity.id, { persist: true });
    }
  }
}

export async function logClientEvent(type, details = {}) {
  const entry = {
    time: new Date().toISOString(),
    project: 'UniPulse',
    type,
    path: currentPath(),
    screen: currentScreenName(),
    userAgent: navigator.userAgent,
    details,
  };
  storeLocal(entry);
  console[type === 'client_error' || type === 'client_unhandled_rejection' ? 'error' : 'warn']('[UniPulse]', entry);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    sendPostHog(type, entry, session?.user?.id);
    if (!session?.user) return;
    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      action: type,
      details: entry,
      ip_address: null,
    });
  } catch {
    sendPostHog(type, entry);
  }
}

export function captureEvent(type, details = {}, userId, options = {}) {
  const entry = {
    time: new Date().toISOString(),
    project: 'UniPulse',
    type,
    path: currentPath(),
    screen: details.screen || currentScreenName(),
    userAgent: navigator.userAgent,
    details,
  };
  storeLocal(entry);
  sendPostHog(type, entry, userId);
  if (options.persist) persistActivity(type, entry, userId);
}

function startView(reason = 'start') {
  currentView = {
    screen: currentScreenName(),
    path: currentPath(),
    startedAt: Date.now(),
  };
  captureEvent('unipulse_view_changed', {
    screen: currentView.screen,
    path: currentView.path,
    reason,
  }, undefined, { persist: true });
}

function closeView(reason = 'leave') {
  if (!currentView) return;
  const now = Date.now();
  if (now - lastViewClosedAt < 500 && reason !== 'route_change') return;
  const durationMs = Math.max(0, now - currentView.startedAt);
  lastViewClosedAt = now;
  captureEvent('unipulse_view_left', {
    screen: currentView.screen,
    path: currentView.path,
    reason,
    duration_ms: durationMs,
    duration_seconds: Math.round(durationMs / 1000),
  }, undefined, { persist: true });
}

export function installClientLogger() {
  if (installed) return;
  installed = true;

  const inspectUrl = () => {
    const raw = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const matched = SUSPICIOUS_PATTERNS.find((pattern) => pattern.test(raw));
    if (matched) {
      logClientEvent('security_suspicious', {
        reason: 'client_url_pattern',
        pattern: String(matched),
      });
    }
  };

  window.addEventListener('error', (event) => {
    logClientEvent('client_error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logClientEvent('client_unhandled_rejection', {
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    });
  });

  window.addEventListener('popstate', inspectUrl);
  window.addEventListener('hashchange', () => {
    closeView('route_change');
    startView('hashchange');
    captureEvent('$pageview', { hash: window.location.hash, screen: currentScreenName() });
    captureEvent('unipulse_route_changed', { hash: window.location.hash, screen: currentScreenName() });
    inspectUrl();
  });
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button,a,[role="button"],input,select,textarea') : null;
    if (!target) return;
    captureEvent('unipulse_click', safeTarget(target));
  }, true);
  document.addEventListener('submit', (event) => {
    captureEvent('unipulse_form_submit', safeTarget(event.target));
  }, true);
  document.addEventListener('visibilitychange', () => {
    captureEvent('unipulse_visibility_changed', { state: document.visibilityState, screen: currentScreenName() });
    if (document.visibilityState === 'hidden') {
      closeView('visibility_hidden');
    } else {
      startView('visibility_visible');
    }
  });
  window.addEventListener('pagehide', () => closeView('pagehide'));
  window.addEventListener('beforeunload', () => closeView('beforeunload'));
  startView('boot');
  captureEvent('$pageview', { hash: window.location.hash, screen: currentScreenName() });
  captureEvent('unipulse_client_boot', { hash: window.location.hash, screen: currentScreenName() });
  inspectUrl();
}
