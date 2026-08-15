// SOS email dispatcher.
// NOTE (pre-deployment): this sends REAL email through Resend.
// It requires the RESEND_API_KEY secret to be set in the backend.
// If the key is missing, the function returns { sent: false, reason: "no_api_key" }
// and marks the alert's email_status as "failed" so admins can see it did NOT go out.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
// Placeholder sender — replace with a verified domain sender once Resend domain is verified.
const FROM = Deno.env.get("SOS_EMAIL_FROM") || "SkillFind SOS <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      alert_id,
      worker_name,
      worker_phone,
      latitude,
      longitude,
      contractor_id,
      emergency_email,
      created_at,
    } = body ?? {};

    if (!alert_id || typeof alert_id !== "string") {
      return new Response(JSON.stringify({ error: "alert_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const recipients: string[] = [];
    if (emergency_email && typeof emergency_email === "string" && emergency_email.includes("@")) {
      recipients.push(emergency_email.trim());
    }
    if (contractor_id && typeof contractor_id === "string") {
      const { data } = await admin.auth.admin.getUserById(contractor_id);
      if (data?.user?.email) recipients.push(data.user.email);
    }

    const maps = latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : "Location unavailable";
    const when = created_at ? new Date(created_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
    const name = worker_name || "A worker";

    const apiKey = Deno.env.get("RESEND_API_KEY");

    let status = "failed";
    let detail = "";

    if (!recipients.length) {
      status = "skipped";
      detail = "No contractor or emergency contact email available";
    } else if (!apiKey) {
      detail = "RESEND_API_KEY not configured";
    } else {
      const html = `
        <div style="font-family:system-ui,sans-serif;line-height:1.6">
          <h2 style="color:#c62828">🆘 SOS ALERT — ${name}</h2>
          <p><strong>${name} has raised an SOS alert and may be in danger.</strong></p>
          <p>Worker: ${name}<br/>Phone: ${worker_phone || "not available"}</p>
          <p>Location: <a href="${maps}">${maps}</a></p>
          <p>Time: ${when}</p>
          <p>Please contact the worker immediately.</p>
        </div>`;

      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: recipients,
          subject: `🆘 SOS Alert — ${name} needs help`,
          html,
        }),
      });
      if (res.ok) {
        status = "sent";
        detail = `Emailed ${recipients.length} recipient(s)`;
      } else {
        detail = `Resend error: ${(await res.text()).slice(0, 200)}`;
      }
    }

    await admin
      .from("sos_alerts")
      .update({ email_status: status, notify_detail: detail })
      .eq("id", alert_id);

    return new Response(JSON.stringify({ sent: status === "sent", status, detail, recipients: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
