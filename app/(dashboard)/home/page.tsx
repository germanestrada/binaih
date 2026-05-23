'use client'
import KpiGrid from '@/components/dashboard/KpiGrid'
import GaugeCard from '@/components/dashboard/GaugeCard'
import BarChart from '@/components/dashboard/BarChart'
import StoreResultCard from '@/components/stores/StoreResultCard'
import Icon from '@/components/ui/Icon'
import { MOCK_KPI_DATA, MOCK_STORES } from '@/lib/mock-data'

const activity = [
  { icon: 'alert'   as const, msg: 'Auditoría completada — T003 Centro Sur',       time: 'Hace 2 h',  status: 'warn' },
  { icon: 'x'       as const, msg: 'Nuevo hallazgo crítico — T006 Buenaventura',   time: 'Hace 4 h',  status: 'err'  },
  { icon: 'check'   as const, msg: 'Score actualizado — T005 El Tesoro: 91 pts',   time: 'Ayer',       status: 'ok'   },
  { icon: 'calendar'as const, msg: 'Auditoría programada — T002 Unicentro',         time: 'Ayer',       status: 'mid'  },
]

export default function HomePage() {
  const { cards, gauges, weeklyChart } = MOCK_KPI_DATA
  const recentStores = MOCK_STORES.slice(0, 4)

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Section label */}
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
        Resumen general
      </div>

      {/* KPIs */}
      <KpiGrid cards={cards} />

      {/* Gauges + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
        {gauges.map(g => <GaugeCard key={g.label} gauge={g} />)}
        <BarChart data={weeklyChart} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Recent stores */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border2)', marginBottom: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', paddingBottom: 14 }}>
              Tiendas recientes
            </div>
          </div>
          {recentStores.map(s => <StoreResultCard key={s.id} store={s} />)}
        </div>

        {/* Activity feed */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              Actividad reciente
            </div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px', borderBottom: i < activity.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                  background: a.status === 'err' ? 'var(--err-bg)' : a.status === 'warn' ? 'var(--warn-bg)' : a.status === 'ok' ? 'var(--ok-bg)' : 'var(--surface)',
                }}>
                  <Icon name={a.icon} size={13}
                    color={a.status === 'err' ? 'var(--err)' : a.status === 'warn' ? 'var(--warn)' : a.status === 'ok' ? 'var(--ok)' : 'var(--subtle)'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.45 }}>{a.msg}</div>
                  <div style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
