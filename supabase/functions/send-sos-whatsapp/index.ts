// SOS WhatsApp auto-send via WhatsApp Cloud API.
// Requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets.
// Returns { sent:false, reason:"not_configured" } when secrets are missing so the
// client can fall back to the wa.me deep link (no crash, no broken UI).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const toE164 = (raw: string) => {
  const d = String(raw).replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { alert_id, worker_name, worker_phone, maps_link, phones } = await req.json().catch(() => ({}));
    const targets: string[] = (Array.isArray(phones) ? phones : []).filter(Boolean).map(toE164);

    const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    // Preferred path: the WhatsApp Business connection (gateway); fallback: raw Cloud API token.
    const gwKey = Deno.env.get("WHATSAPP_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const useGateway = !!(gwKey && lovableKey);

    if (!targets.length) return json({ sent: false, reason: "no_recipients" });
    if (!useGateway && (!token || !phoneId)) return json({ sent: false, reason: "not_configured" });

    const text = `🆘 SOS ALERT\n${worker_name || "A worker"} has raised an SOS alert and may be in danger.\nPhone: ${worker_phone || "N/A"}\nLocation: ${maps_link || "unavailable"}\nTime: ${new Date().toLocaleString("en-IN")}`;

    let sent = 0;
    const errors: string[] = [];
    for (const to of targets) {
      const url = useGateway
        ? "https://connector-gateway.lovable.dev/whatsapp/messages"
        : `https://graph.facebook.com/v20.0/${phoneId}/messages`;
      const headers: Record<string, string> = useGateway
        ? { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": gwKey!, "Content-Type": "application/json" }
        : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
      });
      if (res.ok) sent++;
      else errors.push((await res.text()).slice(0, 160));
    }

    if (alert_id) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await admin
        .from("sos_alerts")
        .update({
          whatsapp_status: sent ? "sent" : "failed",
          notify_detail: sent ? `WhatsApp auto-sent to ${sent} number(s)` : errors.join(" | ").slice(0, 300),
        })
        .eq("id", alert_id);
    }

    return json({ sent: sent > 0, delivered: sent, total: targets.length, errors });
  } catch (e) {
    return json({ sent: false, error: (e as Error).message }, 500);
  }
});
