'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Icon from '@/components/ui/Icon'

const NAV = [
  { href: '/admin',              label: 'Resumen',          icon: 'home'     as const },
  { href: '/admin/usuarios',     label: 'Usuarios',         icon: 'user'     as const },
  { href: '/admin/tipos-locacion',label: 'Tipos de locación',icon: 'building' as const },
  { href: '/admin/locaciones',   label: 'Locaciones',       icon: 'store'    as const },
  { href: '/admin/configuracion',label: 'Configuración',    icon: 'clipboard'as const },
  { href: '/admin/exportar',     label: 'Exportar datos',   icon: 'export'   as const },
  { href: '/admin/plan',         label: 'Plan activo',      icon: 'trophy'   as const },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/home')
    }
  }, [session, status, router])

  if (status === 'loading') return null
  if (session?.user?.role !== 'admin') return null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 92px)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, borderRight: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            Administración
          </div>
        </div>
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <button key={item.href} onClick={() => router.push(item.href)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 'var(--r-sm)', marginBottom: 2,
                background: active ? 'var(--ink)' : 'none',
                color: active ? 'white' : 'var(--mid)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
              >
                <Icon name={item.icon} size={14} color="currentColor" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--subtle)' }}>
          Solo visible para administradores
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
