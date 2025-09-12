// Deno Edge Function: resolve username -> email and ensure profile exists
// POST { username: string }
// Response: { email: string } | { error: string }

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function sanitizeUsername(s: string){
  s = String(s||'').trim().toLowerCase()
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g,'') } catch {}
  return s.replace(/[^a-z0-9._-]/g,'')
}

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type':'application/json'
  }
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers: corsHeaders() })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() })
  let body: any
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error:'Invalid JSON' }), { status:400, headers:{'Content-Type':'application/json'} }) }
  const raw = String(body?.username||'')
  const username = sanitizeUsername(raw)
  if(!username) return new Response(JSON.stringify({ error:'username required' }), { status:400, headers: corsHeaders() })

  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if(!url || !key) return new Response(JSON.stringify({ error:'Server not configured' }), { status:500, headers: corsHeaders() })
  const admin = createClient(url, key)

  // Try find in profiles
  let email: string | null = null
  try{
    const { data: rows } = await admin.from('profiles').select('id, email').ilike('username', username).limit(1)
    if(rows && rows.length){ email = rows[0].email || null }
  }catch{}

  // If not found, attempt to find by auth metadata (rare path)
  if(!email){
    try{
      // There is no direct auth.users query via supabase-js; would require RPC or storage.
      // Keep as profiles-only to avoid exposing auth.users.
    }catch{}
  }

  if(!email) return new Response(JSON.stringify({ error:'Usuário não encontrado.' }), { status:404, headers: corsHeaders() })
  return new Response(JSON.stringify({ email }), { headers: corsHeaders() })
}

// deno-lint-ignore no-explicit-any
serve(handler as any)
