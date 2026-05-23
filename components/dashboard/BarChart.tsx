'use client'
import type { ChartPoint } from '@/types/kpi'

export default function BarChart({ data, title = 'Auditorías · Esta semana' }: { data: ChartPoint[]; title?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ fontSize: 11, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 500, marginBottom: 20 }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, paddingBottom: 0 }}>
          {data.map(d => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 72 }}>
                <div style={{
                  width: '100%',
                  height: `${Math.round((d.value / max) * 100)}%`,
                  minHeight: 3,
                  background: 'var(--ink)',
                  borderRadius: '3px 3px 0 0',
                  opacity: .15 + (d.value / max) * .85,
                  transition: 'opacity .2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = String(.15 + (d.value / max) * .85)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', padding: '8px 20px', gap: 6 }}>
        {data.map(d => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
