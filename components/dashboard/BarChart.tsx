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
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
          {data.map(d => {
            const pct = Math.round((d.value / max) * 100)
            return (
              <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, height: '100%', justifyContent: 'flex-end' }}>
                {/* Valor sobre la barra */}
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: d.value > 0 ? 'var(--ink)' : 'transparent', marginBottom: 3, fontWeight: 600 }}>
                  {d.value}
                </div>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 72 }}>
                  <div style={{
                    width: '100%',
                    height: d.value > 0 ? `${Math.max(pct, 4)}%` : '3px',
                    minHeight: 3,
                    background: 'var(--ink)',
                    borderRadius: '3px 3px 0 0',
                    opacity: d.value > 0 ? .15 + (d.value / max) * .85 : .08,
                    transition: 'opacity .2s, height .3s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = String(d.value > 0 ? .15 + (d.value / max) * .85 : .08)}
                  />
                </div>
              </div>
            )
          })}
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
