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
    const { pickup_address, dropoff_address, category, goods_description, distance_km, base_fare, offered_fare, client_phone, stops } = body;

    // Backend validation
    if (!pickup_address?.trim()) throw new Error("Pickup address required");
    if (!dropoff_address?.trim()) throw new Error("Dropoff address required");
    if (!category) throw new Error("Category required");
    if (!goods_description?.trim()) throw new Error("Goods description required");
    if (!distance_km || distance_km <= 0) throw new Error("Valid distance required");
    if (!offered_fare || offered_fare <= 0) throw new Error("Valid fare required");
    if (!client_phone?.trim()) throw new Error("Phone number required");

    const normalizedPhone = normalizePhone(client_phone);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single();
    if (!profile || profile.role !== "customer") return new Response(JSON.stringify({ error: "Only customers can broadcast" }), { status: 403, headers: corsHeaders });

    const { data: newLoad, error: insertError } = await supabase.from("loads").insert({
      client_email: user.email,
      client_name: user.user_metadata?.full_name || "Customer",
      client_phone: normalizedPhone,
      pickup_address: pickup_address.trim(),
      dropoff_address: dropoff_address.trim(),
      category: category.toLowerCase(),
      cargo_description: goods_description.trim(),
      distance_km: parseFloat(distance_km),
      base_fare: parseInt(base_fare),
      offer: parseInt(offered_fare),
      status: "Broadcasting",
      stops: stops || [],
      created_at: new Date().toISOString(),
    }).select().single();

    if (insertError) return new Response(JSON.stringify({ error: "Failed to create request" }), { status: 500, headers: corsHeaders });

    await notifyDrivers(supabase, newLoad);

    return new Response(JSON.stringify({ success: true, load_id: newLoad.id, message: "Request broadcasted" }), { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to broadcast" }), { status: 400, headers: corsHeaders });
  }
});

function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("267")) return `+${digits}`;
  if (digits.length === 8) return `+267${digits}`;
  return phone.trim();
}

async function notifyDrivers(supabase: any, load: any) {
  try {
    const { data: drivers } = await supabase.from("trucks").select("id, owner_phone, driver_email").eq("category", load.category).eq("online", true);
    if (!drivers?.length) return;

    const notifications = drivers.map((driver: any) => ({
      user_id: driver.driver_email,
      phone: driver.owner_phone,
      title: "New Load Available",
      body: `${load.category}: ${load.pickup_address} → ${load.dropoff_address}`,
      type: "load_broadcast",
      load_id: load.id,
      read: false,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (err) {
    console.error("Notification error:", err);
  }
}
