import type { Zone, StoreStatus } from '@/types/store'

export const ZONES: Zone[] = ['Norte', 'Sur', 'Oriente', 'Occidente', 'Centro']
export const STORE_STATUSES: StoreStatus[] = ['active', 'inactive', 'critical']

export const SCORE_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  regular: 'Regular',
  critical: 'Crítico',
}

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/home' },
  { label: 'Tiendas', href: '/tiendas' },
  { label: 'Hallazgos', href: '/hallazgos' },
  { label: 'Top Hallazgos', href: '/top-hallazgos' },
  { label: 'Auditorías', href: '/auditorias' },
]
