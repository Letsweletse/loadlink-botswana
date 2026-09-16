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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      pickup_address,
      dropoff_address,
      category,
      goods_description,
      distance_km,
      base_fare,
      offered_fare,
      client_phone,
      stops = [],
    } = await req.json();

    // Validation - ALL REQUIRED
    if (!pickup_address?.trim()) throw new Error("Pickup address required");
    if (!dropoff_address?.trim()) throw new Error("Dropoff address required");
    if (!category) throw new Error("Category required");
    if (!goods_description?.trim()) throw new Error("Goods description required");
    if (!distance_km || distance_km <= 0) throw new Error("Valid distance required");
    if (!offered_fare || offered_fare < 0) throw new Error("Valid fare required");
    if (!client_phone?.trim()) throw new Error("Phone number required");

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

    // Check user is customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "customer") {
      return new Response(JSON.stringify({ error: "Only customers can broadcast" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Create load
    const { data: newLoad, error: insertError } = await supabase
      .from("loads")
      .insert({
        customer: user.email,
        phone: client_phone,
        pickup: pickup_address,
        dropoff: dropoff_address,
        category,
        load: goods_description,
        km: distance_km,
        offer: offered_fare,
        status: "Broadcasting",
        base_fare,
        final_fare: offered_fare,
        stops: stops.length > 0 ? stops : null,
        cargo_description: goods_description,
        weight_tonnes: 0,
        client_name: user.user_metadata?.full_name || "Customer",
        client_email: user.email,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create request" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Get matching drivers
    const { data: drivers } = await supabase
      .from("trucks")
      .select("owner_phone, phone")
      .eq("category", category)
      .eq("is_available", true)
      .eq("online", true);

    // Notify drivers
    if (drivers && drivers.length > 0) {
      const notifications = drivers.map(driver => ({
        user_id: null,
        phone: driver.phone || driver.owner_phone,
        title: `New ${category} Load!`,
        body: `${goods_description} - P${offered_fare}`,
        type: "new_load",
        load_id: newLoad.id,
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        load_id: newLoad.id,
        message: `Broadcast sent to ${drivers?.length || 0} drivers`,
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
