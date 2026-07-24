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

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("role", "demo")
      .limit(1)
      .single();

    if (profileError || !profiles) {
      throw new Error("Sistemde 'demo' rolüne sahip bir kullanıcı bulunamadı.");
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: profiles.email,
    });

    if (error) {
      throw error;
    }

    return json(req, { action_link: data.properties.action_link });
  } catch {
    return json(req, { error: "Demo giriş işlemi şu anda tamamlanamadı." }, 400);
  }
});
