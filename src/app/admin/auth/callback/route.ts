import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchYouTubeChannel } from '@/lib/youtube'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login', requestUrl.origin))
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('Auth error:', error)
    return NextResponse.redirect(new URL('/admin/login?error=auth_failed', requestUrl.origin))
  }

  // Fetch YouTube channel data
  if (data.session?.access_token) {
    try {
      const youtubeData = await fetchYouTubeChannel(data.session.access_token)

      // Update user profile with YouTube data
      await supabase.from('profiles').upsert({
        id: data.user.id,
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

  // Redirect to admin - the session cookie should already be set by Supabase
  return NextResponse.redirect(new URL('/admin', requestUrl.origin))
}
