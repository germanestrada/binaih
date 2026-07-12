'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import StoreResultCard from '@/components/stores/StoreResultCard'
import StoreFilters from '@/components/stores/StoreFilters'
import Icon from '@/components/ui/Icon'
import { useFilteredStores } from '@/hooks/useFilteredStores'
import { useStoreFilters } from '@/store/filters'
import type { Store } from '@/types/store'

const StoreMap = dynamic(() => import('@/components/stores/StoreMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-mono)' }}>Cargando mapa…</span>
    </div>
  ),
})

type ViewMode = 'list' | 'split' | 'map'

function TiendasContent() {
  const filtered   = useFilteredStores()
  const filters    = useStoreFilters()
  const [view, setView]           = useState<ViewMode>('split')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (store: Store) => {
    setSelectedId(prev => prev === store.id ? null : store.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 92px)' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--white)', flexShrink: 0 }}>

        {/* Active filter chips */}
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.search && (
            <Chip label={`"${filters.search}"`} onRemove={() => filters.setSearch('')} />
          )}
          {filters.zone && (
            <Chip label={`Zona: ${filters.zone}`} onRemove={() => filters.setZone('')} />
          )}
          {filters.status && (
            <Chip label={`Estado: ${filters.status}`} onRemove={() => filters.setStatus('')} />
          )}
          {filters.minScore > 0 && (
            <Chip label={`Score ≥ ${filters.minScore}`} onRemove={() => filters.setMinScore(0)} />
          )}
          {filters.maxScore < 100 && (
            <Chip label={`Score ≤ ${filters.maxScore}`} onRemove={() => filters.setMaxScore(100)} />
          )}
          {filters.activeCount() === 0 && (
            <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>
              {filtered.length} tienda{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
          {filters.activeCount() > 0 && (
            <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>
              · {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0 }}>
          {(['list', 'split', 'map'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 14px', fontSize: 11, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 500,
              background: view === v ? 'var(--ink)' : 'var(--white)',
              color:      view === v ? 'white'      : 'var(--subtle)',
              transition: 'all .15s',
            }}>
              {v === 'list' ? 'Lista' : v === 'split' ? 'Split' : 'Mapa'}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={() => exportCSV(filtered)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, flexShrink: 0 }}>
          <Icon name="export" size={13} color="white" /> CSV
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Filters sidebar */}
        <StoreFilters totalFiltered={filtered.length} />

        {/* List */}
        {(view === 'list' || view === 'split') && (
          <div style={{ width: view === 'list' ? '100%' : 300, borderRight: view === 'split' ? '1px solid var(--border)' : 'none', overflowY: 'auto', flexShrink: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--subtle)' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, marginBottom: 8, color: 'var(--border)' }}>0</div>
                <div style={{ fontSize: 13 }}>Sin tiendas para estos filtros.</div>
                <button onClick={() => filters.reset()} style={{ marginTop: 12, fontSize: 12, color: 'var(--ink)', background: 'none', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Limpiar filtros
                </button>
              </div>
            ) : filtered.map(s => (
              <div key={s.id}
                onClick={() => handleSelect(s)}
                style={{ borderLeft: `2px solid ${selectedId === s.id ? 'var(--ink)' : 'transparent'}`, background: selectedId === s.id ? 'var(--surface)' : 'transparent', cursor: 'pointer' }}
              >
                <StoreResultCard store={s} />
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        {(view === 'map' || view === 'split') && (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <StoreMap stores={filtered} selectedId={selectedId} onSelect={handleSelect} />

            {selectedId && (() => {
              const store = filtered.find(s => s.id === selectedId)
              if (!store) return null
              return (
                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--white)', color: 'var(--ink)', padding: '12px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 24px rgba(0,0,0,.3)', zIndex: 1000, minWidth: 280 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1, color: store.score >= 75 ? '#6ee7a0' : '#fca5a5' }}>{store.score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{store.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{store.city} · {store.zone}</div>
                  </div>
                  <a href={`/tiendas/${store.id}`} style={{ fontSize: 11, color: 'var(--accent)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 'var(--r-sm)', whiteSpace: 'nowrap' }}>
                    Ver detalle →
                  </a>
                  <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <Icon name="x" size={14} color="currentColor" />
                  </button>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 11, padding: '3px 8px 3px 10px', borderRadius: 20, fontWeight: 500 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
        <Icon name="x" size={11} color="currentColor" />
      </button>
    </div>
  )
}

function exportCSV(stores: Store[]) {
  const rows = [
    ['ID', 'Nombre', 'Ciudad', 'Zona', 'Score', 'Auditorías', 'Hallazgos', 'Estado'],
    ...stores.map(s => [s.id, s.name, s.city, s.zone, s.score, s.audits, s.findings, s.status]),
  ]
  const csv  = rows.map(r => r.join(',')).join('\n')
  const a    = document.createElement('a')
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = `binaih-tiendas-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function TiendasPage() {
  return (
    <Suspense>
      <TiendasContent />
    </Suspense>
  )
}
