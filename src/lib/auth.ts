import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function checkAuth() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: true,
              httpOnly: true,
              path: '/',
            })
          } catch (e) {
            // Server component may not support set
            console.warn('Cookie set not supported in server component')
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              path: '/',
            })
          } catch (e) {
            console.warn('Cookie remove not supported in server component')
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return { user, supabase }
}
