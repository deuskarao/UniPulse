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
    distinct_id: userId || 'anonymous',
    properties: {
      app: POSTHOG_APP,
      platform: 'web',
      source: 'client',
      env: import.meta.env.MODE || 'development',
      path: entry.path,
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

export function installClientLogger() {
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
  inspectUrl();
}
