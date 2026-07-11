import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // We MUST use the service role key to bypass RLS and generate admin links
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Find the exact demo user email dynamically by checking the 'profiles' table
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("role", "demo")
      .limit(1)
      .single();

    if (profileError || !profiles) {
      throw new Error("Sistemde 'demo' rolüne sahip bir kullanıcı bulunamadı.");
    }

    // 2. Generate a secure one-time magic link for this demo user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: profiles.email,
    });

    if (error) {
      throw error;
    }

    // Return the action_link (which automatically logs the user in when visited)
    return new Response(
      JSON.stringify({ action_link: data.properties.action_link }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
