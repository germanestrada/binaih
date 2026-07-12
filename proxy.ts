import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Rutas que requieren autenticación de tenant
const PROTECTED_TENANT = [
  '/home', '/tiendas', '/hallazgos', '/top-hallazgos',
  '/auditorias', '/admin',
]

// Rutas públicas que nunca requieren auth
const PUBLIC_PATHS = [
  '/', '/login', '/demo', '/superadmin/login', '/set-password',
  '/api/auth', '/api/superadmin/auth', '/api/demo-login',
  '/_next', '/favicon', '/robots',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas y assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Proteger rutas del super-admin (solo verificar cookie existe — la API ya valida el JWT)
  if (pathname.startsWith('/superadmin')) {
    const saToken = request.cookies.get('tveo-sa-token')
    if (!saToken) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
    return NextResponse.next()
  }

  // Proteger rutas de tenant
  const isTenantRoute = PROTECTED_TENANT.some(p => pathname.startsWith(p))
  const isTenantApi   = pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/superadmin')

  if (isTenantRoute || isTenantApi) {
    const session = await auth()
    if (!session) {
      if (isTenantApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
}
