import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

const PROTECTED_PREFIXES = ['/home', '/puzzle', '/archive', '/puzzles', '/profile', '/sandbox', '/admin', '/leaderboard', '/docs']
const ADMIN_PREFIX = '/admin'

/**
 * Copy refreshed session cookies from the Supabase response into any redirect
 * response so the client always receives updated auth tokens.
 */
function redirectWithSession(supabaseResponse: NextResponse, url: URL): NextResponse {
  const redirect = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    redirect.cookies.set(name, value)
  })
  return redirect
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Write back to the mutated request so downstream server components see them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // 2. Re-create supabaseResponse so Set-Cookie headers reach the browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() must be called to trigger the token refresh + setAll above.
  // Do not add logic between createServerClient and getUser.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    // Carry refreshed cookies so the browser stores any token rotation
    return redirectWithSession(supabaseResponse, loginUrl)
  }

  // Admin routes: require is_admin on the profile
  if (user && pathname.startsWith(ADMIN_PREFIX)) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[middleware] admin check error:', error.message)
    }

    if (!profile?.is_admin) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/home'
      homeUrl.search = ''
      return redirectWithSession(supabaseResponse, homeUrl)
    }
  }

  // Redirect logged-in users away from the login page
  if (pathname === '/login' && user) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/home'
    homeUrl.search = ''
    return redirectWithSession(supabaseResponse, homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
