
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { Role } from '@/types/auth'
 
const PROTECTED: { pattern: RegExp; minRole: Role }[] = [
  { pattern: /^\/home/,          minRole: 'viewer'  },
  { pattern: /^\/tiendas/,       minRole: 'viewer'  },
  { pattern: /^\/hallazgos/,     minRole: 'viewer'  },
  { pattern: /^\/top-hallazgos/, minRole: 'viewer'  },
  { pattern: /^\/auditorias/,    minRole: 'auditor' },
]
 
const ROLE_LEVEL: Record<Role, number> = { viewer: 1, auditor: 2, admin: 3 }
 
function hasAccess(userRole: Role, minRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole]
}
 
export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
 
  if (pathname.startsWith('/login')) {
    if (session) return NextResponse.redirect(new URL('/home', req.url))
    return NextResponse.next()
  }
 
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
 
  const rule = PROTECTED.find(r => r.pattern.test(pathname))
  if (rule && !hasAccess(session.user.role as Role, rule.minRole)) {
    return NextResponse.redirect(new URL('/home?error=unauthorized', req.url))
  }
 
  return NextResponse.next()
})
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  // Forzar Node.js runtime — NextAuth no es compatible con Edge Runtime
  runtime: 'nodejs',
}
