import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { load_id, confirmed_by } = await req.json();

    // Validation
    if (!load_id) throw new Error("Load ID required");
    if (!["driver", "client"].includes(confirmed_by)) {
      throw new Error("Invalid confirmation type");
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Get load
    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("*")
      .eq("id", load_id)
      .single();

    if (loadError || !load) {
      return new Response(JSON.stringify({ error: "Load not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check status is delivered
    if (!["Delivered", "delivered", "Completed", "completed"].includes(load.status)) {
      return new Response(JSON.stringify({ error: "Load not yet delivered" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Authorization & Update
    if (confirmed_by === "driver") {
      if (load.driver_email !== user.email) {
        return new Response(JSON.stringify({ error: "You are not the assigned driver" }), {
          status: 403,
          headers: corsHeaders,
        });
      }
      if (load.driver_delivery_confirmed) {
        return new Response(JSON.stringify({ error: "Already confirmed" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      if (load.client_email !== user.email) {
        return new Response(JSON.stringify({ error: "You are not the load creator" }), {
          status: 403,
          headers: corsHeaders,
        });
      }
      if (load.client_delivery_confirmed) {
        return new Response(JSON.stringify({ error: "Already confirmed" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    // Update confirmation
    const updateData = confirmed_by === "driver"
      ? { driver_delivery_confirmed: true, driver_confirmed_at: new Date().toISOString() }
      : { client_delivery_confirmed: true, client_confirmed_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from("loads")
      .update(updateData)
      .eq("id", load_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to confirm" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Get updated load
    const { data: updatedLoad } = await supabase
      .from("loads")
      .select("*")
      .eq("id", load_id)
      .single();

    // Check if both confirmed
    if (updatedLoad?.driver_delivery_confirmed && updatedLoad?.client_delivery_confirmed) {
      await supabase
        .from("loads")
        .update({ 
          status: "Completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", load_id);

      return new Response(
        JSON.stringify({
          success: true,
          status: "completed_both",
          message: "Delivery confirmed! Payment processing...",
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "awaiting_other",
        message: `Delivery confirmed by ${confirmed_by}. Awaiting ${confirmed_by === "driver" ? "client" : "driver"} confirmation.`,
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
