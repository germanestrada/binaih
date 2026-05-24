'use client'
import { useRouter } from 'next/navigation'
import type { KpiCard as KpiCardType } from '@/types/kpi'
import KpiCard from './KpiCard'

const KPI_ROUTES: Record<string, string> = {
  stores:   '/tiendas',
  audited:  '/auditorias',
  critical: '/top-hallazgos',
  findings: '/hallazgos',
  score:    '/tiendas',
}

export default function KpiGrid({ cards }: { cards: KpiCardType[] }) {
  const router = useRouter()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {cards.map(kpi => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          onClick={KPI_ROUTES[kpi.id] ? () => router.push(KPI_ROUTES[kpi.id]) : undefined}
        />
      ))}
    </div>
  )
}
