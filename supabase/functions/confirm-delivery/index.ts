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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { load_id, confirmed_by } = body;

    if (!load_id) throw new Error("Load ID required");
    if (!["driver", "client"].includes(confirmed_by)) throw new Error("Invalid confirmation type");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: load, error: loadError } = await supabase.from("loads").select("*").eq("id", load_id).single();

    if (loadError || !load) return new Response(JSON.stringify({ error: "Load not found" }), { status: 404, headers: corsHeaders });

    if (!["Delivered", "delivered", "Completed", "completed"].includes(load.status)) return new Response(JSON.stringify({ error: "Load not yet delivered" }), { status: 400, headers: corsHeaders });

    if (confirmed_by === "driver") {
      if (load.driver_email !== user.email) return new Response(JSON.stringify({ error: "You are not the assigned driver" }), { status: 403, headers: corsHeaders });
      if (load.driver_delivery_confirmed) return new Response(JSON.stringify({ error: "Already confirmed" }), { status: 400, headers: corsHeaders });
    } else {
      if (load.client_email !== user.email) return new Response(JSON.stringify({ error: "You are not the load creator" }), { status: 403, headers: corsHeaders });
      if (load.client_delivery_confirmed) return new Response(JSON.stringify({ error: "Already confirmed" }), { status: 400, headers: corsHeaders });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (confirmed_by === "driver") {
      updateData.driver_delivery_confirmed = true;
      updateData.driver_delivery_confirmed_at = new Date().toISOString();
    } else {
      updateData.client_delivery_confirmed = true;
      updateData.client_delivery_confirmed_at = new Date().toISOString();
    }

    const bothWillBeConfirmed = (confirmed_by === "driver" && load.client_delivery_confirmed) || (confirmed_by === "client" && load.driver_delivery_confirmed);
    if (bothWillBeConfirmed) updateData.status = "Completed";

    const { data: updated, error: updateError } = await supabase.from("loads").update(updateData).eq("id", load_id).select().single();

    if (updateError) return new Response(JSON.stringify({ error: "Failed to confirm" }), { status: 500, headers: corsHeaders });

    return new Response(JSON.stringify({ success: true, load_id, both_confirmed: bothWillBeConfirmed }), { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed" }), { status: 400, headers: corsHeaders });
  }
});
