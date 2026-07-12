'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

interface Stats {
  plan: { name:string; tier:string; maxLocations:number; maxUsers:number; maxAuditsMonth:number; mapEnabled:boolean; apiEnabled:boolean; aiEnabled:boolean; trialEndsAt?:string; status:string }
  usage: { locations:number; activeLocations:number; criticalLocations:number; users:number; activeUsers:number; auditsThisMonth:number; openFindings:number; inProgressFindings:number }
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round(used / (max || 1) * 100))
  const color = pct >= 90 ? 'var(--err)' : pct >= 70 ? 'var(--warn)' : 'var(--ok)'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: 'var(--mid)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontSize: 11 }}>{used} / {max}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 3, textAlign: 'right' }}>{pct}% usado</div>
    </div>
  )
}

export default function AdminPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 32, color: 'var(--subtle)', fontSize: 13 }}>Cargando estadísticas…</div>
  if (!stats)  return <div style={{ padding: 32, color: 'var(--subtle)', fontSize: 13 }}>Error al cargar datos.</div>

  const { plan, usage } = stats

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 20 }}>
        Resumen del tenant
      </div>

      {/* KPIs rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Locaciones activas',  value: usage.activeLocations,   icon: 'store'    as const, color: 'var(--ink)'  },
          { label: 'Locaciones críticas', value: usage.criticalLocations,  icon: 'alert'    as const, color: 'var(--err)'  },
          { label: 'Usuarios activos',    value: usage.activeUsers,        icon: 'user'     as const, color: 'var(--ink)'  },
          { label: 'Auditorías este mes', value: usage.auditsThisMonth,    icon: 'calendar' as const, color: 'var(--ok)'   },
          { label: 'Hallazgos abiertos',  value: usage.openFindings,       icon: 'search'   as const, color: 'var(--err)'  },
          { label: 'En progreso',         value: usage.inProgressFindings, icon: 'eye'      as const, color: 'var(--warn)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name={k.icon} size={13} color={k.color} />
              <span style={{ fontSize: 10, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600 }}>{k.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Plan activo */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>
            Plan activo
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--ink)' }}>{plan.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: 'var(--accent)', color: 'var(--accent-ink)' }}>{plan.tier}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: plan.status === 'active' ? 'var(--ok-bg)' : 'var(--warn-bg)', color: plan.status === 'active' ? 'var(--ok)' : 'var(--warn)' }}>{plan.status}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'Mapa',    enabled: plan.mapEnabled },
              { label: 'API',     enabled: plan.apiEnabled },
              { label: 'IA',      enabled: plan.aiEnabled  },
            ].map(f => (
              <span key={f.label} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)', color: f.enabled ? 'var(--ok)' : 'var(--subtle)', background: f.enabled ? 'var(--ok-bg)' : 'var(--surface)' }}>
                {f.enabled ? '✓' : '✗'} {f.label}
              </span>
            ))}
          </div>
          {plan.trialEndsAt && (
            <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 8 }}>
              Trial vence: {new Date(plan.trialEndsAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Uso vs límites */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>
            Uso vs límites del plan
          </div>
          <UsageBar label="Locaciones"            used={usage.locations}       max={plan.maxLocations}   />
          <UsageBar label="Usuarios"              used={usage.users}           max={plan.maxUsers}       />
          <UsageBar label="Auditorías este mes"   used={usage.auditsThisMonth} max={plan.maxAuditsMonth} />
        </div>
      </div>
    </div>
  )
}
