'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useStoreFilters } from '@/store/filters'
import type { Zone, StoreStatus } from '@/types/store'

// Sincroniza el store de Zustand ↔ URL params
export function useUrlFilters() {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()
  const filters    = useStoreFilters()

  // URL → store al montar
  useEffect(() => {
    const zone     = params.get('zona')    as Zone | null
    const status   = params.get('estado')  as StoreStatus | null
    const search   = params.get('q')       ?? ''
    const minScore = parseInt(params.get('min') ?? '0',   10)
    const maxScore = parseInt(params.get('max') ?? '100', 10)

    if (zone)       filters.setZone(zone)
    if (status)     filters.setStatus(status)
    if (search)     filters.setSearch(search)
    if (minScore)   filters.setMinScore(minScore)
    if (maxScore < 100) filters.setMaxScore(maxScore)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // store → URL cuando cambian filtros
  const syncToUrl = (overrides?: Partial<typeof filters>) => {
    const state = { ...filters, ...overrides }
    const p = new URLSearchParams()
    if (state.zone)            p.set('zona',   state.zone)
    if (state.status)          p.set('estado', state.status)
    if (state.search)          p.set('q',      state.search)
    if (state.minScore > 0)    p.set('min',    String(state.minScore))
    if (state.maxScore < 100)  p.set('max',    String(state.maxScore))
    const qs = p.toString()
    router.replace(`${pathname}${qs ? '?' + qs : ''}`, { scroll: false })
  }

  return { syncToUrl }
}
