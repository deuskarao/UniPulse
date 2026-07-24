export const USER_ROUTE_IDS = [
  "dashboard",
  "courses",
  "analytics",
  "myclass",
  "settings",
];

export const ADMIN_ROUTE_IDS = [
  "dashboard",
  "users",
  "logs",
  "academic",
  "reports",
  "security",
  "settings",
];

export const ADMIN_LEGACY_HASHES = [
  "users",
  "logs",
  "classes",
  "universities",
  "academic",
  "reports",
  "security",
];

const USER_ROUTE_SET = new Set(USER_ROUTE_IDS);
const ADMIN_ROUTE_SET = new Set(ADMIN_ROUTE_IDS);
const ADMIN_LEGACY_SET = new Set(ADMIN_LEGACY_HASHES);

export function readHashRoute(hashValue = window.location.hash) {
  return String(hashValue || "")
    .replace(/^#\/?/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split(/[?&]/)[0]
    .trim();
}

function canonicalHash(route) {
  const clean = String(route || "dashboard").replace(/^\/+/, "");
  return `#/${clean || "dashboard"}`;
}

export function replaceHashRoute(route) {
  if (typeof window === "undefined") return false;
  const nextHash = canonicalHash(route);
  if (window.location.hash === nextHash) return false;
  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}${nextHash}`
  );
  try {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } catch {
    window.dispatchEvent(new Event("hashchange"));
  }
  return true;
}

export function setHashRoute(route) {
  if (typeof window === "undefined") return;
  const nextHash = canonicalHash(route);
  if (window.location.hash === nextHash) return;
  window.location.hash = nextHash.replace(/^#/, "");
}

export function resolveUserRoute(hashValue = window.location.hash) {
  const route = readHashRoute(hashValue);
  if (!route) {
    return { page: "dashboard", canonical: "dashboard", shouldReplace: true };
  }
  if (route === "admin" || route === "departments" || route.startsWith("admin/") || ADMIN_LEGACY_SET.has(route)) {
    return { page: "dashboard", canonical: "dashboard", shouldReplace: true };
  }
  if (USER_ROUTE_SET.has(route)) {
    return { page: route, canonical: route, shouldReplace: false };
  }
  return { page: "dashboard", canonical: "dashboard", shouldReplace: true };
}

export function resolveAdminRoute(hashValue = window.location.hash) {
  const route = readHashRoute(hashValue);
  if (!route || route === "admin") {
    return { tab: "dashboard", canonical: "admin/dashboard", shouldReplace: true };
  }

  if (route.startsWith("admin/")) {
    const tab = route.split("/")[1] || "dashboard";
    if (ADMIN_ROUTE_SET.has(tab)) {
      return { tab, canonical: `admin/${tab}`, shouldReplace: route !== `admin/${tab}` };
    }
    return { tab: "dashboard", canonical: "admin/dashboard", shouldReplace: true };
  }

  const legacyTab = route === "classes" || route === "universities" ? "academic" : route;
  if (ADMIN_ROUTE_SET.has(legacyTab)) {
    return { tab: legacyTab, canonical: `admin/${legacyTab}`, shouldReplace: true };
  }

  return { tab: "dashboard", canonical: "admin/dashboard", shouldReplace: true };
}

export function isLegacyAdminHash(hashValue = window.location.hash) {
  return ADMIN_LEGACY_SET.has(readHashRoute(hashValue));
}

