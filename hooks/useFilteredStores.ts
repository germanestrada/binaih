import { useMemo } from 'react'
import { useStoreFilters } from '@/store/filters'
import { MOCK_STORES } from '@/lib/mock-data'

export function useFilteredStores() {
  const { zone, status, search, minScore, maxScore } = useStoreFilters()

  return useMemo(() => {
    return MOCK_STORES.filter(s => {
      if (zone      && s.zone   !== zone)   return false
      if (status    && s.status !== status) return false
      if (minScore  && s.score  <  minScore) return false
      if (maxScore < 100 && s.score > maxScore) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) &&
            !s.id.toLowerCase().includes(q)   &&
            !s.city.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [zone, status, search, minScore, maxScore])
}
