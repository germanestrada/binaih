'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Icon from '@/components/ui/Icon'
import type { Role } from '@/types/auth'

const NAV = [
  { label: 'Dashboard',    href: '/home',          icon: 'home'     as const, minRole: 'viewer'  as Role },
  { label: 'Tiendas',      href: '/tiendas',        icon: 'store'    as const, minRole: 'viewer'  as Role },
  { label: 'Hallazgos',    href: '/hallazgos',      icon: 'search'   as const, minRole: 'viewer'  as Role },
  { label: 'Top',          href: '/top-hallazgos',  icon: 'trophy'   as const, minRole: 'viewer'  as Role },
  { label: 'Auditorías',   href: '/auditorias',     icon: 'calendar' as const, minRole: 'auditor' as Role },
]

const ROLE_LEVEL: Record<Role, number> = { viewer: 1, auditor: 2, admin: 3 }

const ROLE_BADGE: Record<Role, { label: string; color: string }> = {
  admin:   { label: 'Admin',   color: 'rgba(255,255,255,.9)'  },
  auditor: { label: 'Auditor', color: 'rgba(255,255,255,.65)' },
  viewer:  { label: 'Viewer',  color: 'rgba(255,255,255,.45)' },
}

export default function TopBar() {
  const path    = usePathname()
  const { data: session } = useSession()

  const userRole   = (session?.user?.role ?? 'viewer') as Role
  const userName   = session?.user?.name ?? ''
  const initials   = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const roleBadge  = ROLE_BADGE[userRole]

  const visibleNav = NAV.filter(item => ROLE_LEVEL[userRole] >= ROLE_LEVEL[item.minRole])

  return (
    <header style={{ background: 'var(--shell)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52, borderBottom: '1px solid var(--shell-sep)', flexShrink: 0 }}>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="1" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5"/>
          <path d="M5 10 L10 5 L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 14 L10 9 L15 14" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--shell-text)', letterSpacing: '.5px' }}>BINAIH</span>
      </div>

      {/* Nav — solo rutas accesibles por el rol */}
      <nav style={{ display: 'flex', gap: 2 }}>
        {visibleNav.map(item => {
          const active = path === item.href || path.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 6, color: active ? 'var(--shell-text)' : 'var(--shell-dim)', fontSize: 13, fontWeight: active ? 500 : 400, padding: '6px 12px', borderRadius: 'var(--r-sm)', background: active ? 'rgba(255,255,255,.07)' : 'transparent', textDecoration: 'none', transition: 'all .15s' }}>
              <Icon name={item.icon} size={14} color="currentColor" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120, justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--shell-text)', lineHeight: 1.2 }}>{userName}</div>
          <div style={{ fontSize: 10, color: roleBadge.color, fontFamily: 'var(--font-mono)' }}>{roleBadge.label}</div>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', color: 'var(--shell-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '.5px' }}>
          {initials}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Cerrar sesión"
          style={{ background: 'none', border: 'none', color: 'var(--shell-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4, transition: 'color .15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'white'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--shell-dim)'}
        >
          <Icon name="logout" size={15} color="currentColor" />
        </button>
      </div>
    </header>
  )
}
