import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // Validation
    if (!email?.trim()) throw new Error("Email required");
    if (!password?.trim()) throw new Error("Password required");
    if (!email.includes("@")) throw new Error("Invalid email");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate with Supabase Auth
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !session?.user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("user_id", session.user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Create audit log
    await supabase.from("admin_audit_logs").insert({
      admin_email: email,
      admin_name: profile.name,
      action: "login",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      timestamp: new Date().toISOString(),
    }).catch(() => {
      // Silently fail audit log if table doesn't exist
    });

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user_email: session.user.email,
          admin_name: profile.name,
        },
        message: "Admin login successful",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server error" }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
