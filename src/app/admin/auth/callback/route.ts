import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchYouTubeChannel } from '@/lib/youtube'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const cookieStore = await cookies()

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: (key) => {
            return cookieStore.get(key)?.value ?? null
          },
          setItem: (key, value) => {
            cookieStore.set({ name: key, value, httpOnly: true, secure: true, sameSite: 'lax' })
          },
          removeItem: (key) => {
            cookieStore.delete(key)
          },
        },
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is a Google login
      const { data: identities } = await supabase.auth.getUser()
      const googleIdentity = identities.user?.identities?.find(
        (id) => id.provider === 'google'
      )

      if (googleIdentity && data.session?.access_token) {
        try {
          // Fetch YouTube channel data
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
          // Still redirect to admin even if YouTube fetch fails
        }
      }
    }
  }

  return NextResponse.redirect(new URL('/admin', requestUrl.origin))
}
