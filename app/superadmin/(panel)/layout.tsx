'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/superadmin',                label: 'Métricas',         icon: '📊' },
  { href: '/superadmin/tenants',        label: 'Tenants',          icon: '🏢' },
  { href: '/superadmin/planes',         label: 'Planes',           icon: '💎' },
  { href: '/superadmin/items-maestros', label: 'Ítems maestros',   icon: '📋' },
  { href: '/superadmin/plantillas',     label: 'Plantillas',       icon: '🗂️' },
  { href: '/superadmin/admins',         label: 'Administradores',  icon: '👤' },
  { href: '/superadmin/logs',           label: 'Logs de acceso',   icon: '🔍' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [admin,  setAdmin]  = useState<{ name: string; email: string; totpEnabled: boolean } | null>(null)
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    fetch('/api/superadmin/auth')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!d) router.push('/superadmin/login'); else { setAdmin(d); setLoading(false) } })
      .catch(() => router.push('/superadmin/login'))
  }, [router])

  const logout = async () => {
    await fetch('/api/superadmin/auth', { method: 'DELETE' })
    router.push('/superadmin/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 13 }}>
      Verificando acceso…
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui,sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5"/>
              <path d="M5 10 L10 5 L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 14 L10 9 L15 14" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 15, color: 'white' }}>TVEO</span>
            <span style={{ fontSize: 9, color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>ADMIN</span>
          </div>
          {admin && (
            <div>
              <div style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{admin.name}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{admin.email}</div>
              {!admin.totpEnabled && (
                <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, padding: '3px 8px', background: 'rgba(245,158,11,.1)', borderRadius: 4 }}>
                  ⚠️ 2FA no activado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href))
            return (
              <button key={item.href} onClick={() => router.push(item.href)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(255,255,255,.08)' : 'none',
                color: active ? 'white' : '#555',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.04)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #1a1a1a' }}>
          <button onClick={logout} style={{
            width: '100%', background: 'none', border: '1px solid #222',
            color: '#555', padding: '8px', borderRadius: 8,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'white'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#555'}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', color: 'white' }}>
        {children}
      </main>
    </div>
  )
}
