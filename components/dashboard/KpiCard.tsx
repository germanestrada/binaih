'use client'
import type { KpiCard as KpiCardType } from '@/types/kpi'
import Icon from '@/components/ui/Icon'

interface KpiCardProps { kpi: KpiCardType; onClick?: () => void }

// Calcula color e intensidad del fondo según el KPI y su valor
function getKpiColor(id: string, value: number): { text: string; bg: string; bar: number } {
  // Score promedio — escala degradada 0→100
  if (id === 'score') {
    if (value >= 90) return { text: '#1a6b3a', bg: '#f0faf4', bar: value }
    if (value >= 75) return { text: '#2d6a1f', bg: '#f5f9f0', bar: value }
    if (value >= 61) return { text: '#7a5200', bg: '#fffbf0', bar: value }
    return               { text: '#8b1a1a', bg: '#fff5f5', bar: value }
  }
  // Críticas y hallazgos — inverso: más es peor
  if (id === 'critical' || id === 'findings') {
    if (value === 0)  return { text: '#1a6b3a', bg: '#f0faf4', bar: 0   }
    if (value <= 3)   return { text: '#7a5200', bg: '#fffbf0', bar: 40  }
    if (value <= 8)   return { text: '#a04000', bg: '#fff3ed', bar: 65  }
    return               { text: '#8b1a1a', bg: '#fff5f5', bar: 90  }
  }
  // Auditadas / cobertura — más es mejor
  if (id === 'audited') {
    if (value >= 90) return { text: '#1a6b3a', bg: '#f0faf4', bar: value }
    if (value >= 70) return { text: '#2d6a1f', bg: '#f5f9f0', bar: value }
    if (value >= 50) return { text: '#7a5200', bg: '#fffbf0', bar: value }
    return               { text: '#8b1a1a', bg: '#fff5f5', bar: value }
  }
  return { text: 'var(--ink)', bg: 'var(--white)', bar: -1 }
}

export default function KpiCard({ kpi, onClick }: KpiCardProps) {
  const numVal = typeof kpi.value === 'number' ? kpi.value : parseInt(String(kpi.value)) || 0
  const { text, bg, bar } = getKpiColor(kpi.id, numVal)
  const hasColor = bg !== 'var(--white)'

  const deltaColor =
    kpi.deltaType === 'up'   ? 'var(--ok)'   :
    kpi.deltaType === 'warn' ? 'var(--warn)'  : 'var(--err)'

  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${hasColor ? text + '22' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s, transform .1s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (onClick) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = ''
      }}
    >
      {/* Barra de intensidad en el fondo */}
      {bar >= 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 3, width: `${bar}%`,
          background: text, opacity: .25,
          borderRadius: '0 2px 0 0',
          transition: 'width .5s ease',
        }}/>
      )}

      <div style={{ fontSize: 11, color: hasColor ? text : 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 14, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: hasColor ? .7 : 1 }}>
        <span>{kpi.label}</span>
        {onClick && <Icon name="arrow-right" size={11} color={hasColor ? text : 'var(--subtle)'} />}
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 38, color: text, lineHeight: 1, letterSpacing: '-1px', marginBottom: 10 }}>
        {kpi.value}
      </div>
      {kpi.delta && (
        <div style={{ fontSize: 11, color: hasColor ? text : deltaColor, fontWeight: 500, opacity: hasColor ? .8 : 1 }}>
          {kpi.delta}
        </div>
      )}
    </div>
  )
}
