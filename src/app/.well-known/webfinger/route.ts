import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource')

  if (!resource || !resource.startsWith('acct:')) {
    return new NextResponse('Missing resource parameter', { status: 400 })
  }

  const [username, domain] = resource.replace('acct:', '').split('@')
  const host = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : 'link.vvil.jp'

  if (domain && domain !== host) {
    return new NextResponse('Invalid domain', { status: 404 })
  }

  // Supabaseからユーザーの存在確認
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('username', username)
    .single()

  if (error || !profile) {
    return new NextResponse('User not found', { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`

  // WebFingerレスポンスの構築
  const response = {
    subject: `acct:${username}@${host}`,
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `${siteUrl}/${username}`
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `${siteUrl}/api/users/${username}`
      }
    ]
  }

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/jrd+json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
