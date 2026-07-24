import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const EMAIL_DOMAIN_ERROR = "Sadece bilinen e-posta sağlayıcıları (gmail, icloud vb.) ve şirket maili kabul edilmektedir.";
const TRUSTED_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "icloud.com", "me.com", "mac.com", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "yahoo.com", "yahoo.com.tr", "yandex.com",
  "yandex.com.tr", "proton.me", "protonmail.com", "zoho.com", "perainc.online",
  "mail.perainc.online", "unipulse.app", "lifeos.app", "komsucep.app",
]);

const allowedOrigin = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://unipulse.perainc.online";
  if (origin === appOrigin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
    return origin;
  }
  return appOrigin;
};

const corsHeaders = (req: Request) => ({
  "Access-Control-Allow-Origin": allowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const json = (req: Request, body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

const safeFail = (req: Request, status = 400) =>
  json(req, { error: "İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin." }, status);

const rateLimitFail = (req: Request) =>
  json(req, { error: "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin." }, 429);

function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(
  admin: ReturnType<typeof createClient>,
  req: Request,
  scope: string,
  subject: string,
  max: number,
  windowSeconds: number,
  blockSeconds = windowSeconds,
) {
  const key = await sha256Hex(`unipulse:${scope}:${clientIp(req)}:${subject.toLowerCase().trim()}`);
  const { data, error } = await admin.rpc("check_security_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
    p_block_seconds: blockSeconds,
  });
  if (error) throw new Error("rate_limit_failed");
  const row = Array.isArray(data) ? data[0] : data;
  return row?.allowed !== false;
}

async function sendMail(to: string, fullName: string, confirmLink: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("mail_not_configured");
  const from = Deno.env.get("MAIL_FROM") || "UniPulse <noreply@mail.perainc.online>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "UniPulse - Hesabınızı onaylayın",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
        <h2>Hesabınızı onaylayın</h2>
        <p>Merhaba ${fullName},</p>
        <p>UniPulse hesabınızı oluşturmak için aşağıdaki bağlantıya tıklayın. Hesap, bu onaydan sonra oluşturulacaktır.</p>
        <p><a href="${confirmLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Hesabımı Onayla</a></p>
        <p style="color:#64748b;font-size:14px">Bu bağlantı 24 saat geçerlidir. Onaydan sonra giriş yapabilirsiniz.</p>
      </div>`,
    }),
  });
  if (!response.ok) throw new Error("mail_failed");
}

async function encryptionKey() {
  const secret = Deno.env.get("PENDING_REGISTRATION_SECRET");
  if (!secret || secret.length < 32) throw new Error("secret_missing");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt"]);
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function encryptPassword(password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
  return {
    password_cipher: toBase64(new Uint8Array(encrypted)),
    password_iv: toBase64(iv),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return safeFail(req, 405);

  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const deptData = body.deptData && typeof body.deptData === "object" ? body.deptData : null;

    if (!email || !password || !fullName || !username) return safeFail(req);
    if (password.length < 8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-z0-9_.-]+$/.test(username)) return safeFail(req);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const ipAllowed = await checkRateLimit(admin, req, "request-registration-ip", "", 20, 300, 900);
    const emailAllowed = await checkRateLimit(admin, req, "request-registration-email", email, 4, 3600);
    if (!ipAllowed || !emailAllowed) return rateLimitFail(req);

    const domain = email.split("@")[1];
    if (!domain || !TRUSTED_DOMAINS.has(domain)) return json(req, { error: EMAIL_DOMAIN_ERROR }, 400);

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingProfile) return safeFail(req, 409);

    const { data: pending } = await admin
      .from("pending_registrations")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();
    if (pending) return safeFail(req, 409);

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const confirmBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1/confirm-registration`;
    const confirmLink = `${confirmBase}?token=${encodeURIComponent(token)}`;

    const encryptedPassword = await encryptPassword(password);
    const { error: insertError } = await admin.from("pending_registrations").insert({
      email,
      username,
      ...encryptedPassword,
      full_name: fullName,
      dept_data: deptData,
      token,
      expires_at: expiresAt,
    });
    if (insertError) return safeFail(req, 409);

    await sendMail(email, fullName, confirmLink);
    return json(req, { message: "Onay e-postası gönderildi. Hesabınızı onayladıktan sonra giriş yapabilirsiniz." }, 202);
  } catch {
    return safeFail(req, 500);
  }
});
