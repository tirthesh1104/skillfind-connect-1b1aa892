// Temporary diagnostic: verifies the Resend API key and lists verified sending domains.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ ok: false, reason: "no_key" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
  const body = await res.text();
  return new Response(JSON.stringify({ ok: res.ok, status: res.status, body: body.slice(0, 600) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
