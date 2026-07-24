import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

const DEMO_EMAIL = Deno.env.get("DEMO_EMAIL") || "demo@unipulse.perainc.online";
const DEMO_NAME = Deno.env.get("DEMO_NAME") || "DEMO";
const DEMO_USERNAME = Deno.env.get("DEMO_USERNAME") || "demo";
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://unipulse.perainc.online";

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
  if (error) {
    console.warn("demo-login rate limit skipped:", error.message);
    return true;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row?.allowed !== false;
}

async function findAuthUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data?.users?.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (!data?.users || data.users.length < 1000) break;
  }
  return null;
}

async function ensureDemoProfile(admin: ReturnType<typeof createClient>) {
  const { data: roleProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "demo")
    .limit(1)
    .maybeSingle();

  if (roleProfile?.email) return roleProfile.email;

  const { data: emailProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", DEMO_EMAIL)
    .maybeSingle();

  if (emailProfile?.email) {
    await admin
      .from("profiles")
      .update({ role: "demo", is_allowed: true, full_name: DEMO_NAME, username: DEMO_USERNAME })
      .eq("id", emailProfile.id);
    return emailProfile.email;
  }

  let authUser = await findAuthUserByEmail(admin, DEMO_EMAIL);
  if (!authUser) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: `${crypto.randomUUID()}Aa1!`,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME, username: DEMO_USERNAME },
    });
    if (createError || !created.user) throw createError || new Error("demo_user_not_created");
    authUser = created.user;
  }

  const baseProfile = {
    id: authUser.id,
    email: authUser.email || DEMO_EMAIL,
    full_name: DEMO_NAME,
    username: DEMO_USERNAME,
    role: "demo",
    is_allowed: true,
  };

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(baseProfile, { onConflict: "id" });

  if (profileError) {
    await admin
      .from("profiles")
      .upsert({ ...baseProfile, username: null }, { onConflict: "id" });
  }

  return authUser.email || DEMO_EMAIL;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return json(req, { error: "İşlem tamamlanamadı." }, 405);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const allowed = await checkRateLimit(supabaseAdmin, req, "demo-login", "", 8, 10 * 60, 30 * 60);
    if (!allowed) {
      return json(req, { error: "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin." }, 429);
    }

    const demoEmail = await ensureDemoProfile(supabaseAdmin);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: demoEmail,
      options: {
        redirectTo: APP_ORIGIN,
      },
    });

    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      throw error || new Error("demo_link_not_created");
    }

    return json(req, { token_hash: tokenHash });
  } catch {
    return json(req, { error: "Demo giriş işlemi şu anda tamamlanamadı." }, 400);
  }
});
