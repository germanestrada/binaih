'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Icon from '@/components/ui/Icon'

const NAV = [
  { href: '/admin',                 label: 'Resumen',              icon: 'home'      as const, section: null },
  { href: '/admin/usuarios',        label: 'Usuarios',             icon: 'user'      as const, section: 'Acceso' },
  { href: '/admin/tipos-locacion',  label: 'Tipos de locación',    icon: 'building'  as const, section: 'Acceso' },
  { href: '/admin/locaciones',      label: 'Locaciones',           icon: 'store'     as const, section: 'Acceso' },
  { href: '/admin/locaciones-bulk', label: 'Cargue masivo',         icon: 'export'    as const, section: 'Acceso' },
  { href: '/admin/tipos-auditoria', label: 'Tipos de auditoría',   icon: 'clipboard' as const, section: 'Auditorías' },
  { href: '/admin/items-maestros',  label: 'Ítems maestros',       icon: 'search'    as const, section: 'Auditorías' },
  { href: '/admin/items-tenant',    label: 'Ítems del tenant',     icon: 'check'     as const, section: 'Auditorías' },
  { href: '/admin/batch',           label: 'Análisis Batch',       icon: 'eye'       as const, section: 'IA' },
  { href: '/admin/ia-logs',         label: 'Trazabilidad IA',      icon: 'search'    as const, section: 'IA' },
  { href: '/admin/accesos',         label: 'Historial de accesos', icon: 'eye'       as const, section: 'Sistema' },
  { href: '/admin/restricciones',   label: 'Control de acceso',    icon: 'alert'     as const, section: 'Sistema' },
  { href: '/admin/notificaciones',  label: 'Notificaciones',       icon: 'alert'     as const, section: 'Sistema' },
  { href: '/admin/configuracion',   label: 'Configuración',        icon: 'filter'    as const, section: 'Sistema' },
  { href: '/admin/exportar',        label: 'Exportar datos',       icon: 'export'    as const, section: 'Sistema' },
  { href: '/admin/plan',            label: 'Plan activo',          icon: 'trophy'    as const, section: 'Sistema' },
  { href: '/admin/logs-acciones',   label: 'Log de acciones',      icon: 'eye'       as const, section: 'Sistema' },
]

const SECTIONS = ['Acceso', 'Auditorías', 'IA', 'Sistema']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/home')
  }, [session, status, router])

  if (status === 'loading') return null
  if (session?.user?.role !== 'admin') return null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 92px)' }}>
      <aside style={{ width: 220, borderRight: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            Administración
          </div>
        </div>

        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {/* Resumen */}
          {NAV.filter(n => !n.section).map(item => {
            const active = pathname === item.href
            return (
              <button key={item.href} onClick={() => router.push(item.href)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 'var(--r-sm)', marginBottom: 2,
                background: active ? 'var(--accent)' : 'none',
                color: active ? 'var(--accent-ink)' : 'var(--mid)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left',
              }}>
                <Icon name={item.icon} size={14} color="currentColor" />
                {item.label}
              </button>
            )
          })}

          {/* Secciones agrupadas */}
          {SECTIONS.map(section => (
            <div key={section}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '12px 10px 4px', opacity: .7 }}>
                {section}
              </div>
              {NAV.filter(n => n.section === section).map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <button key={item.href} onClick={() => router.push(item.href)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--r-sm)', marginBottom: 2,
                    background: active ? 'var(--accent)' : 'none',
                    color: active ? 'var(--accent-ink)' : 'var(--mid)',
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
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--subtle)' }}>
          Solo visible para administradores
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
