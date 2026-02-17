import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchYouTubeChannel } from '@/lib/youtube'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/admin'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user session to handle YouTube integration
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.provider_token) {
        try {
          const youtubeData = await fetchYouTubeChannel(session.provider_token)
          
          await supabase.from('profiles').upsert({
            id: session.user.id,
            is_verified: true,
            youtube_channel_id: youtubeData.channelId,
            youtube_handle: youtubeData.handle,
            youtube_channel_url: `https://www.youtube.com/channel/${youtubeData.channelId}`,
            auth_provider: 'google',
            updated_at: new Date().toISOString(),
          })
        } catch (err) {
          console.error('Failed to fetch/update YouTube data:', err)
          // Continue login even if YouTube fetch fails
        }
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${requestUrl.origin}/admin/login?error=auth_failed`)
}
