import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Create a memoized client for edge runtime compatibility
let supabaseInstance: SupabaseClient | null = null

function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
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
