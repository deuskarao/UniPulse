import { supabase } from '../lib/supabase';

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
  const body = JSON.stringify({
    api_key: POSTHOG_KEY,
    event: type,
    distinct_id: userId || getAnonymousId(),
    properties: {
      app: POSTHOG_APP,
      platform: 'web',
      source: 'client',
      env: import.meta.env.MODE || 'development',
      path: entry.path,
      url: window.location.href,
      referrer: document.referrer || undefined,
      userAgent: entry.userAgent,
      details: entry.details,
    },
  });

  navigator.sendBeacon?.(`${POSTHOG_HOST}/capture/`, new Blob([body], { type: 'application/json' })) ||
    fetch(`${POSTHOG_HOST}/capture/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

export async function logClientEvent(type, details = {}) {
  const entry = {
    time: new Date().toISOString(),
    project: 'UniPulse',
    type,
    path: window.location.pathname,
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

export function captureEvent(type, details = {}, userId) {
  const entry = {
    time: new Date().toISOString(),
    project: 'UniPulse',
    type,
    path: window.location.pathname,
    userAgent: navigator.userAgent,
    details,
  };
  storeLocal(entry);
  sendPostHog(type, entry, userId);
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
    captureEvent('$pageview', { hash: window.location.hash });
    captureEvent('unipulse_route_changed', { hash: window.location.hash });
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
    captureEvent('unipulse_visibility_changed', { state: document.visibilityState });
  });
  captureEvent('$pageview', { hash: window.location.hash });
  captureEvent('unipulse_client_boot', { hash: window.location.hash });
  inspectUrl();
}
