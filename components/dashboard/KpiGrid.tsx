'use client'
import type { KpiCard as KpiCardType } from '@/types/kpi'
import KpiCard from './KpiCard'

export default function KpiGrid({ cards }: { cards: KpiCardType[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {cards.map(kpi => <KpiCard key={kpi.id} kpi={kpi} onClick={() => {}} />)}
    </div>
  )
}
