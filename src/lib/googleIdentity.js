const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";

const DEFAULT_GOOGLE_CLIENT_ID = "346086111216-t0vf5j2ihu2acaakl8l4mma0qpc0k6cc.apps.googleusercontent.com";

let googleIdentityPromise = null;

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
}

export function loadGoogleIdentity() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google kimlik servisi tarayıcı dışında yüklenemez."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleIdentityPromise) return googleIdentityPromise;

  googleIdentityPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error("Google kimlik servisi yüklenemedi."));
    };

    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google kimlik servisi yüklenemedi.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("Google kimlik servisi yüklenemedi."));
    document.head.appendChild(script);
  });

  return googleIdentityPromise;
}

export async function createGoogleNonce() {
  if (!window.crypto?.getRandomValues || !window.crypto?.subtle) {
    throw new Error("Tarayıcınız güvenli Google girişi için gerekli kripto desteğini sağlamıyor.");
  }

  const random = window.crypto.getRandomValues(new Uint8Array(32));
  const nonce = Array.from(random)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { nonce, hashedNonce };
}
