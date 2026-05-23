import type { GaugeData } from '@/types/kpi'

export default function GaugeCard({ gauge }: { gauge: GaugeData }) {
  const pct = gauge.value / gauge.max
  const r = 46
  const circ = Math.PI * r
  const offset = circ - pct * circ

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 16, fontWeight: 500, alignSelf: 'flex-start' }}>
        {gauge.label}
      </div>
      <svg width="108" height="62" viewBox="0 0 108 62">
        <path d="M8 58 A46 46 0 0 1 100 58" fill="none" stroke="var(--border2)" strokeWidth="8" strokeLinecap="round"/>
        <path d="M8 58 A46 46 0 0 1 100 58" fill="none" stroke="var(--ink)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}/>
      </svg>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--ink)', marginTop: 4, lineHeight: 1 }}>
        {gauge.value}<span style={{ fontSize: 14, color: 'var(--subtle)' }}>%</span>
      </div>
      {gauge.delta && <div style={{ fontSize: 11, color: 'var(--ok)', marginTop: 6, fontWeight: 500 }}>{gauge.delta}</div>}
    </div>
  )
}
