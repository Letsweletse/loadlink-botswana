import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ULTRAMSG_INSTANCE_ID = Deno.env.get("ULTRAMSG_INSTANCE_ID") || "";
const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

type IncomingMessage = {
  from: string;
  to: string;
  body: string;
};

function normalizePhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("267")) return digits;
  if (digits.length === 8) return `267${digits}`;

  return digits;
}

function readIncomingMessage(payload: any): IncomingMessage {
  const data = payload?.data || payload || {};

  const from =
    data.from ||
    data.author ||
    payload?.from ||
    payload?.author ||
    "";

  const to =
    data.to ||
    payload?.to ||
    "";

  const body =
    data.body ||
    data.message ||
    payload?.body ||
    payload?.message ||
    "";

  return {
    from: String(from).replace("@c.us", ""),
    to: String(to).replace("@c.us", ""),
    body: String(body || "").trim(),
  };
}

function parseBookingRequest(message: string) {
  const lines = message.split("\n").map((line) => line.trim()).filter(Boolean);
  const values: Record<string, string> = {};

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) continue;
    values[rawKey.toLowerCase().trim()] = rest.join(":").trim();
  }

  return {
    pickup: values.pickup || values["pick-up"] || values.from || "",
    dropoff: values.dropoff || values["drop-off"] || values.to || "",
    goods: values.goods || values.load || values.cargo || "",
    truckSize: (values["truck size"] || values.size || "mini").toLowerCase(),
  };
}

function makeLoadId() {
  return `LL-${String(Date.now()).slice(-6)}`;
}

function estimateFare(category: string) {
  if (category.includes("big")) return 1500;
  if (category.includes("medium")) return 700;
  return 250;
}

function buildMenuReply() {
  return `🚚 Welcome to VanLink Botswana.

Use WhatsApp to request vans and trucks.

Reply with:
1 - Book a truck
2 - Register as driver
3 - Track my load
4 - Talk to support

VanLink — Move anything, anywhere.`;
}

async function createBookingFromMessage(from: string, message: string) {
  if (!supabase) {
    return {
      ok: false,
      reply: "VanLink booking service is not configured yet. Please try again shortly.",
    };
  }

  const parsed = parseBookingRequest(message);

  if (!parsed.pickup || !parsed.dropoff || !parsed.goods) {
    return {
      ok: false,
      reply: `To book a truck, please send your request like this:\n\nBOOK\nPickup: Game City\nDrop-off: Jwaneng\nGoods: furniture\nTruck size: mini`,
    };
  }

  const category = parsed.truckSize.includes("big")
    ? "big"
    : parsed.truckSize.includes("medium")
      ? "medium"
      : "mini";

  const loadId = makeLoadId();
  const offer = estimateFare(category);

  const { error } = await supabase.from("loads").insert({
    id: loadId,
    customer: "WhatsApp Customer",
    phone: `+${normalizePhone(from)}`,
    pickup: parsed.pickup,
    dropoff: parsed.dropoff,
    category,
    load: parsed.goods,
    km: 0,
    offer,
    status: "Broadcasting",
    driver: null,
    driver_phone: null,
  });

  if (error) {
    console.error("Booking insert failed", error);
    return {
      ok: false,
      reply: "We could not create your booking right now. Please try again or contact VanLink support.",
    };
  }

  return {
    ok: true,
    reply: `✅ Booking request received.\n\nReference: ${loadId}\nPickup: ${parsed.pickup}\nDrop-off: ${parsed.dropoff}\nGoods: ${parsed.goods}\nTruck size: ${category}\nEstimated fare from: P${offer}\n\nA driver will be matched shortly.`,
  };
}

async function buildReply(from: string, message: string) {
  const text = message.toLowerCase().trim();

  if (!text || ["hi", "hello", "hey", "menu", "start"].includes(text)) {
    return buildMenuReply();
  }

  if (text === "1" || text === "book") {
    return `To book a truck, send:\n\nBOOK\nPickup:\nDrop-off:\nGoods:\nTruck size: mini / medium / big\n\nExample:\nBOOK\nPickup: Game City\nDrop-off: Jwaneng\nGoods: furniture\nTruck size: mini`;
  }

  if (text.startsWith("book")) {
    const result = await createBookingFromMessage(from, message);
    return result.reply;
  }

  if (text === "2" || text.includes("driver")) {
    return `Driver registration:\n\nPlease register on VanLink here:\nhttps://www.vanlink.co.bw/signup?role=driver\n\nYou will need your name, WhatsApp number, truck plate, licence details, and permit details where applicable.`;
  }

  if (text === "3" || text.includes("track")) {
    return `To track your load, send your reference number.\n\nExample:\nTRACK LL-123456\n\nYou can also visit:\nhttps://www.vanlink.co.bw/track`;
  }

  if (text === "4" || text.includes("support")) {
    return `VanLink support will assist you shortly.\n\nSupport WhatsApp: +267 73 253 731`;
  }

  return buildMenuReply();
}

async function sendWhatsApp(to: string, body: string) {
  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    throw new Error("UltraMsg secrets are not configured");
  }

  const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: ULTRAMSG_TOKEN,
      to: normalizePhone(to),
      body,
      priority: "10",
    }),
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

async function logMessage(record: Record<string, unknown>) {
  if (!supabase) return;

  await supabase.from("whatsapp_messages").insert(record).catch((error) => {
    console.warn("Could not log WhatsApp message", error);
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()));

    const incoming = readIncomingMessage(payload);

    if (!incoming.from || !incoming.body) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const replyText = await buildReply(incoming.from, incoming.body);
    const sendResult = await sendWhatsApp(incoming.from, replyText);

    await logMessage({
      source: "ultramsg",
      from_number: incoming.from,
      to_number: incoming.to,
      message_body: incoming.body,
      reply_text: replyText,
      raw_payload: payload,
      response_status: sendResult.status,
      error_message: sendResult.status >= 400 ? sendResult.body : null,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        from: incoming.from,
        message: incoming.body,
        reply: replyText,
        ultramsg_status: sendResult.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(error);

    await logMessage({
      source: "ultramsg",
      error_message: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
