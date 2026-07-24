export function parseProfileName(value) {
  if (!value) return "";
  if (typeof value !== "string") return String(value);
  const text = value.trim();
  if (!text.startsWith("{")) return text;
  try {
    const parsed = JSON.parse(text);
    return parsed?.full_name || parsed?.fullName || parsed?.name || parsed?.username || text;
  } catch {
    return text;
  }
}

export function displayProfileName(profile, fallback = "İsimsiz") {
  return parseProfileName(profile?.full_name) || parseProfileName(profile?.username) || profile?.email || fallback;
}

export function displayUsername(profile) {
  const raw = profile?.username;
  if (!raw) return "";
  if (typeof raw !== "string") return String(raw);
  const text = raw.trim();
  if (!text.startsWith("{")) return text;
  try {
    const parsed = JSON.parse(text);
    return parsed?.username || "";
  } catch {
    return text;
  }
}

export function profileInitial(profile, fallback = "?") {
  return (displayProfileName(profile, fallback)[0] || fallback).toUpperCase();
}

export function sanitizeProfileUpdates(updates) {
  const next = { ...updates };
  if ("full_name" in next) next.full_name = parseProfileName(next.full_name).trim();
  if ("username" in next) next.username = displayUsername({ username: next.username }).trim() || null;
  return next;
}
