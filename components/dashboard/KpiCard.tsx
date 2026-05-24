'use client'
import type { KpiCard as KpiCardType } from '@/types/kpi'
import Icon from '@/components/ui/Icon'

interface KpiCardProps { kpi: KpiCardType; onClick?: () => void }

export default function KpiCard({ kpi, onClick }: KpiCardProps) {
  const deltaColor =
    kpi.deltaType === 'up'   ? 'var(--ok)'   :
    kpi.deltaType === 'warn' ? 'var(--warn)'  : 'var(--err)'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s, transform .1s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ink3)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.transform = ''
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 14, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{kpi.label}</span>
        {onClick && <Icon name="arrow-right" size={11} color="var(--subtle)" />}
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 38, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-1px', marginBottom: 10 }}>
        {kpi.value}
      </div>
      {kpi.delta && (
        <div style={{ fontSize: 11, color: deltaColor, fontWeight: 500 }}>
          {kpi.delta}
        </div>
      )}
    </div>
  )
}
