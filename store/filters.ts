import { create } from 'zustand'
import type { Zone, StoreStatus } from '@/types/store'

export interface StoreFilterState {
  zone:      Zone | ''
  status:    StoreStatus | ''
  search:    string
  minScore:  number
  maxScore:  number
  setZone:      (v: Zone | '')        => void
  setStatus:    (v: StoreStatus | '') => void
  setSearch:    (v: string)           => void
  setMinScore:  (v: number)           => void
  setMaxScore:  (v: number)           => void
  reset:        () => void
  activeCount:  () => number
}

const DEFAULTS = { zone: '' as const, status: '' as const, search: '', minScore: 0, maxScore: 100 }

export const useStoreFilters = create<StoreFilterState>((set, get) => ({
  ...DEFAULTS,
  setZone:     (zone)     => set({ zone }),
  setStatus:   (status)   => set({ status }),
  setSearch:   (search)   => set({ search }),
  setMinScore: (minScore) => set({ minScore }),
  setMaxScore: (maxScore) => set({ maxScore }),
  reset: () => set(DEFAULTS),
  activeCount: () => {
    const { zone, status, search, minScore, maxScore } = get()
    return [
      zone     !== ''  ,
      status   !== ''  ,
      search   !== ''  ,
      minScore !== 0   ,
      maxScore !== 100 ,
    ].filter(Boolean).length
  },
}))
