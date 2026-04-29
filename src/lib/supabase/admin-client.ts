import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Uses the service role key — bypasses RLS entirely.
// Only call this from server-side code (API routes, Server Actions).
// Never expose this client to the browser.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to .env.local from Supabase Dashboard → Settings → API → service_role key.'
    )
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
