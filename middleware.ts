import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware liviano compatible con Edge Runtime
// No importa NextAuth — solo verifica la cookie de sesión JWT

const PUBLIC_PATHS = ['/login']

const PROTECTED_ROLES: Record<string, string> = {
  '/auditorias': 'auditor',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas estáticas y API — pasar siempre
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verificar sesión via cookie de NextAuth
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ??
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // Sin sesión → login
  if (!sessionToken && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión en login → home
  if (sessionToken && isPublic) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
