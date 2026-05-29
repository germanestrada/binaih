import type { GaugeData } from '@/types/kpi'

function gaugeColor(value: number): { stroke: string; text: string; bg: string } {
  if (value >= 90) return { stroke: '#1a6b3a', text: '#1a6b3a', bg: '#f0faf4' }
  if (value >= 75) return { stroke: '#2d6a1f', text: '#2d6a1f', bg: '#f5f9f0' }
  if (value >= 61) return { stroke: '#7a5200', text: '#7a5200', bg: '#fffbf0' }
  return               { stroke: '#8b1a1a', text: '#8b1a1a', bg: '#fff5f5' }
}

export default function GaugeCard({ gauge }: { gauge: GaugeData }) {
  const pct    = gauge.value / gauge.max
  const r      = 46
  const circ   = Math.PI * r
  const offset = circ - pct * circ
  const { stroke, text, bg } = gaugeColor(gauge.value)

  return (
    <div style={{
      background: bg,
      border: `1px solid ${stroke}22`,
      borderRadius: 'var(--r-lg)', padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ fontSize: 11, color: text, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 16, fontWeight: 500, alignSelf: 'flex-start', opacity: .7 }}>
        {gauge.label}
      </div>
      <svg width="108" height="62" viewBox="0 0 108 62">
        <path d="M8 58 A46 46 0 0 1 100 58" fill="none" stroke="var(--border2)" strokeWidth="8" strokeLinecap="round"/>
        <path d="M8 58 A46 46 0 0 1 100 58" fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}/>
      </svg>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: text, marginTop: 4, lineHeight: 1 }}>
        {gauge.value}<span style={{ fontSize: 14, color: text, opacity: .5 }}>%</span>
      </div>
      {gauge.delta && <div style={{ fontSize: 11, color: stroke, marginTop: 6, fontWeight: 500 }}>{gauge.delta}</div>}
    </div>
  )
}
