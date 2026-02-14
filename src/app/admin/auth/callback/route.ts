import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchYouTubeChannel } from '@/lib/youtube'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookies().then(c => c.get(name)?.value)
        },
        set(name: string, value: string, options: any) {
          cookies().then(cookieStore => {
            const maxAge = 60 * 60 * 24 * 7 // 7 days
            cookieStore.set(name, value, {
              ...options,
              maxAge,
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/',
            })
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (authError || !user) {
    console.error('Auth error:', authError)
    return NextResponse.redirect(new URL('/admin/login?error=auth_failed', requestUrl.origin))
  }

  // Fetch YouTube channel data using provider_token if available
  if (session?.provider_token) {
    try {
      const youtubeData = await fetchYouTubeChannel(session.provider_token)

      // Update user profile with YouTube data
      await supabase.from('profiles').upsert({
        id: user.id,
        is_verified: true,
        youtube_channel_id: youtubeData.channelId,
        youtube_handle: youtubeData.handle,
        youtube_channel_url: `https://www.youtube.com/channel/${youtubeData.channelId}`,
        auth_provider: 'google',
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to fetch YouTube channel:', error)
    }
  }

  // Redirect to admin
  return NextResponse.redirect(new URL('/admin', requestUrl.origin))
}
