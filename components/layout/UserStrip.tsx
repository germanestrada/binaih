'use client'
import { useSession } from 'next-auth/react'
import Icon from '@/components/ui/Icon'

export default function UserStrip() {
  const { data: session } = useSession()

  const company = session?.user?.companyName ?? '—'
  const zone    = session?.user?.zone        ?? 'Nacional'

  const items = [
    { icon: 'building'  as const, label: 'Empresa', value: company },
    { icon: 'pin'       as const, label: 'Zona',    value: zone    },
    { icon: 'clipboard' as const, label: 'Modelo',  value: 'Estándar' },
    { icon: 'wifi'      as const, label: 'Estado',  value: 'En línea' },
  ]

  return (
    <div style={{ background: 'var(--shell2)', padding: '0 24px', display: 'flex', alignItems: 'center', height: 40, borderBottom: '1px solid var(--shell-sep)', flexShrink: 0 }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, paddingRight: i < items.length - 1 ? 20 : 0, marginRight: i < items.length - 1 ? 20 : 0, borderRight: i < items.length - 1 ? '1px solid var(--shell-sep)' : 'none' }}>
          <Icon name={item.icon} size={13} color="rgba(255,255,255,.35)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginRight: 4 }}>{item.label}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}
