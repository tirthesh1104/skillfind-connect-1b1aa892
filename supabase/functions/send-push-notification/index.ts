// Web Push sender. Requires VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY secrets.
// Fails gracefully (200 with sent:false) when secrets are not configured yet.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({}));
    const { worker_ids, subscription, title, message, url, job_title, wage } = body ?? {};

    const pub = Deno.env.get("VAPID_PUBLIC_KEY");
    const priv = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!pub || !priv) {
      return json({ sent: false, reason: "vapid_not_configured", detail: "Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets" });
    }
    webpush.setVapidDetails("mailto:support@skillfind.app", pub, priv);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let subs: any[] = [];
    if (subscription) {
      subs = [{ subscription }];
    } else {
      let q = admin.from("push_subscriptions").select("id, worker_id, subscription").eq("enabled", true);
      if (Array.isArray(worker_ids) && worker_ids.length) q = q.in("worker_id", worker_ids);
      const { data } = await q;
      subs = data ?? [];
    }

    const payload = JSON.stringify({
      title: title || "New job near you",
      body: message || [job_title, wage ? `₹${wage}/day` : null].filter(Boolean).join(" · "),
      url: url || "/find-jobs",
      job_title,
      wage,
    });

    let sent = 0;
    let failed = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(s.subscription, payload);
        sent++;
      } catch (e) {
        failed++;
        const code = (e as any)?.statusCode;
        if ((code === 404 || code === 410) && s.id) {
          await admin.from("push_subscriptions").update({ enabled: false }).eq("id", s.id);
        }
      }
    }

    return json({ sent: sent > 0, delivered: sent, failed, total: subs.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
