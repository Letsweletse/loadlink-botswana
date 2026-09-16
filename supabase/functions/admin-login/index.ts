import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email?.trim()) throw new Error("Email required");
    if (!password?.trim()) throw new Error("Password required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError || !data?.user) return new Response(JSON.stringify({ error: "Authentication failed" }), { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", data.user.id).single();

    if (!profile || profile.role !== "admin") return new Response(JSON.stringify({ error: "Admin access denied" }), { status: 403, headers: corsHeaders });

    return new Response(JSON.stringify({
      success: true,
      user: { id: data.user.id, email: data.user.email, role: profile.role },
      session: { access_token: data.session?.access_token, expires_in: data.session?.expires_in },
    }), { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), { status: 401, headers: corsHeaders });
  }
});
