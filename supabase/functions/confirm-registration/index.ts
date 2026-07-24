import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const page = (title: string, body: string, ok = true) =>
  new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07111f;color:#f8fafc;font-family:Arial,sans-serif}main{width:min(92vw,520px);background:#0f1d33;border:1px solid #2563eb;border-radius:18px;padding:30px}p{color:#bfdbfe;line-height:1.55}a{display:inline-block;margin-top:14px;background:${ok ? "#2563eb" : "#64748b"};color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700}</style></head><body><main><h1>${title}</h1><p>${body}</p><a href="${Deno.env.get("APP_ORIGIN") || "https://unipulse.perainc.online"}">Girişe dön</a></main></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

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

async function decryptionKey() {
  const secret = Deno.env.get("PENDING_REGISTRATION_SECRET");
  if (!secret || secret.length < 32) throw new Error("secret_missing");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt"]);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function decryptPassword(cipher: string, iv: string) {
  const key = await decryptionKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(cipher),
  );
  return new TextDecoder().decode(plain);
}

serve(async (req) => {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return page("Bağlantı geçersiz", "Onay bağlantısı eksik veya bozulmuş görünüyor.", false);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const ipAllowed = await checkRateLimit(admin, req, "confirm-registration-ip", "", 30, 300, 900);
    const tokenAllowed = await checkRateLimit(admin, req, "confirm-registration-token", token, 8, 900, 3600);
    if (!ipAllowed || !tokenAllowed) {
      return page("Çok fazla deneme", "Lütfen biraz bekleyip tekrar deneyin.", false);
    }

    const { data: pending, error } = await admin
      .from("pending_registrations")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error || !pending) return page("Bağlantı geçersiz", "Bu onay bağlantısının süresi dolmuş veya daha önce kullanılmış.", false);

    const password = await decryptPassword(pending.password_cipher, pending.password_iv);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: pending.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: pending.full_name, username: pending.username },
    });
    if (createError || !created.user) return page("Hesap oluşturulamadı", "Bu kayıt tamamlanamadı. Lütfen yeniden kayıt talebi oluşturun.", false);

    const updates: Record<string, unknown> = { username: pending.username };
    if (pending.dept_data?.department_id) updates.department_id = pending.dept_data.department_id;
    if (pending.dept_data?.faculty_id) updates.faculty_id = pending.dept_data.faculty_id;
    if (pending.dept_data?.university_id) updates.university_id = pending.dept_data.university_id;

    await admin.from("profiles").update(updates).eq("id", created.user.id);
    await admin.from("pending_registrations").delete().eq("id", pending.id);

    return page("Hesabınız onaylandı", "Hesabınız başarıyla oluşturuldu. Artık e-posta adresiniz ve şifrenizle giriş yapabilirsiniz.");
  } catch {
    return page("İşlem tamamlanamadı", "Hesap onaylanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.", false);
  }
});
