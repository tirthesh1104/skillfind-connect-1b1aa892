// Returns the public VAPID key so the browser can subscribe to push.
// The public key is safe to expose; the private key never leaves the server.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  return new Response(JSON.stringify({ publicKey, configured: !!publicKey }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
