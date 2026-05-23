export type StoreStatus = 'active' | 'inactive' | 'critical'
export type Zone = 'Norte' | 'Sur' | 'Oriente' | 'Occidente' | 'Centro'

export interface Store {
  id: string
  name: string
  city: string
  zone: Zone
  score: number
  audits: number
  findings: number
  status: StoreStatus
  lat?: number
  lng?: number
}

export interface StoreFilters {
  zone?: Zone
  status?: StoreStatus
  minScore?: number
  maxScore?: number
  search?: string
}
