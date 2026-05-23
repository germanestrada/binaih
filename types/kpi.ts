export interface KpiCard {
  id: string
  label: string
  value: number | string
  delta?: string
  deltaType?: 'up' | 'down' | 'warn'
  hint?: string
  icon: string
  color: string
}

export interface GaugeData {
  label: string
  value: number
  max: number
  delta?: string
  color: string
}

export interface ChartPoint {
  label: string
  value: number
  color?: string
}

export interface KpiData {
  cards: KpiCard[]
  gauges: GaugeData[]
  weeklyChart: ChartPoint[]
  totalStores: number
  audited: number
  avgScore: number
  criticalCount: number
}
