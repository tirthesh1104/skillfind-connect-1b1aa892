import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expected = Deno.env.get("ADMIN_ACCESS_KEY") ?? "";

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const submitted = String(body?.key ?? "").trim();
    const registrationAttempt = Boolean(body?.registration);

    // Constant-time-ish compare
    if (!expected || submitted.length !== expected.length || submitted !== expected) {
      if (registrationAttempt) await admin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Invalid Key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("labour_profiles").delete().eq("user_id", userId);
    await admin.from("contractor_profiles").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId).neq("role", "admin");
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifiedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8h
    const { error: upsertErr } = await admin
      .from("admin_verifications")
      .upsert({ user_id: userId, verified_until: verifiedUntil }, { onConflict: "user_id" });
    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, verified_until: verifiedUntil }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
