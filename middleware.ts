import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          requestHeaders.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Secure`)
        },
        remove(name: string, options: any) {
          requestHeaders.append('Set-Cookie', `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/admin/login')
  const isCallbackPage = request.nextUrl.pathname.startsWith('/admin/auth/callback')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin') && !isAuthPage && !isCallbackPage

  if (isAdminPage && !user) {
    const redirectUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPage && user) {
    const redirectUrl = new URL('/admin', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/admin/:path*'],
}
