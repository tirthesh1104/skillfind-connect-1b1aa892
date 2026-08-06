import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const raw = typeof body?.eshram_number === 'string' ? body.eshram_number.trim().toUpperCase() : ''
    if (!raw) {
      return new Response(JSON.stringify({ error: 'eshram_number is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Format check only (mock verification — real government API integration comes later).
    // Accepted: 12 digits, optionally prefixed with "UAN".
    const cleaned = raw.replace(/[\s-]/g, '')
    const valid = /^(UAN)?\d{12}$/.test(cleaned)

    if (!valid) {
      return new Response(JSON.stringify({
        verified: false,
        reason: 'Invalid format. e-Shram / UAN number must be 12 digits (optionally prefixed with UAN).',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        eshram_number: cleaned,
        eshram_verified: true,
        eshram_verified_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ verified: true, eshram_number: cleaned }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
