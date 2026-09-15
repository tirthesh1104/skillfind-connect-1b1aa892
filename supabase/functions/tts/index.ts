// High-quality multilingual text-to-speech via Lovable AI Gateway.
// Returns a complete MP3 so the browser can play it with a plain <audio> element.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Lang = "mr" | "hi" | "en";

const INSTRUCTIONS: Record<Lang, string> = {
  mr: "Speak in fluent, natural Marathi with a warm Indian accent. Friendly and encouraging, like a helpful local assistant. Speak at a brisk, natural conversational pace — do not drag words.",
  hi: "Speak in fluent, natural Hindi with a warm Indian accent. Friendly and clear. Speak at a brisk, natural conversational pace — do not drag words.",
  en: "Speak in clear Indian-accented English. Friendly, confident and professional. Speak at a brisk, natural conversational pace.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const { text, language = "en", voice = "alloy", speed = 1.15 } = await req.json();
    if (!text || typeof text !== "string") return json({ error: "text required" }, 400);

    const lang: Lang = (["mr", "hi", "en"].includes(language) ? language : "en") as Lang;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: text.slice(0, 3000),
        voice,
        instructions: INSTRUCTIONS[lang],
        speed: Math.min(Math.max(Number(speed) || 1.15, 0.8), 1.6),
        response_format: "mp3",
        stream_format: "audio",
      }),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error(`TTS failed [${resp.status}]: ${t}`);
      return json({ error: `TTS failed: ${t.slice(0, 200)}` }, resp.status);
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
