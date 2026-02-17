import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Create a memoized browser client that stores sessions in cookies (not localStorage)
// This ensures server-side code (middleware, route handlers) can read the session
let supabaseInstance: SupabaseClient | null = null

function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return supabaseInstance
}

// Export a lazy proxy that only initializes the client when accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createSupabaseClient()
    return client[prop as keyof SupabaseClient]
  },
})

// Export the factory function for explicit control
export { createSupabaseClient as getClient }
