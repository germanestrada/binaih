'use client'
import { useStoreFilters } from '@/store/filters'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import Icon from '@/components/ui/Icon'
import { ZONES } from '@/lib/constants'
import type { Zone, StoreStatus } from '@/types/store'
import { MOCK_STORES } from '@/lib/mock-data'

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600,
  color: 'var(--subtle)', textTransform: 'uppercase',
  letterSpacing: '1px', marginBottom: 7,
}

const SELECT: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
  padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-sans)',
  color: 'var(--ink)', background: 'var(--white)', outline: 'none', cursor: 'pointer',
}

interface ScoreStats { min: number; max: number; avg: number }

function getScoreStats(): ScoreStats {
  const scores = MOCK_STORES.map(s => s.score)
  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }
}

export default function StoreFilters({ totalFiltered }: { totalFiltered: number }) {
  const filters    = useStoreFilters()
  const { syncToUrl } = useUrlFilters()
  const stats      = getScoreStats()
  const active     = filters.activeCount()

  const update = (fn: () => void) => { fn(); syncToUrl() }

  return (
    <aside style={{
      width: 220, borderRight: '1px solid var(--border)',
      padding: '20px 16px', flexShrink: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="filter" size={13} color="var(--subtle)" />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Filtros
          </span>
          {active > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              width: 16, height: 16, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {active}
            </span>
          )}
        </div>
        {active > 0 && (
          <button
            onClick={() => { filters.reset(); syncToUrl() }}
            style={{ fontSize: 11, color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Icon name="x" size={11} /> Limpiar
          </button>
        )}
      </div>

      {/* Resultados */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>{totalFiltered}</div>
        <div style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 4 }}>tienda{totalFiltered !== 1 ? 's' : ''} encontrada{totalFiltered !== 1 ? 's' : ''}</div>
      </div>

      {/* Búsqueda */}
      <div>
        <label htmlFor="sf-search" style={LABEL}>Búsqueda</label>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={12} color="var(--subtle)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            id="sf-search" name="sf-search"
            value={filters.search}
            onChange={e => update(() => filters.setSearch(e.target.value))}
            placeholder="Nombre, ID o ciudad…"
            autoComplete="off"
            style={{ ...SELECT, paddingLeft: 28 }}
          />
        </div>
      </div>

      {/* Zona */}
      <div>
        <label htmlFor="sf-zone" style={LABEL}>Zona</label>
        <select
          id="sf-zone" name="sf-zone"
          value={filters.zone}
          onChange={e => update(() => filters.setZone(e.target.value as Zone | ''))}
          style={SELECT}
        >
          <option value="">Todas las zonas</option>
          {ZONES.map(z => (
            <option key={z} value={z}>
              {z} ({MOCK_STORES.filter(s => s.zone === z).length})
            </option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div>
        <label htmlFor="sf-status" style={LABEL}>Estado</label>
        <select
          id="sf-status" name="sf-status"
          value={filters.status}
          onChange={e => update(() => filters.setStatus(e.target.value as StoreStatus | ''))}
          style={SELECT}
        >
          <option value="">Todos los estados</option>
          <option value="active">✓ Activa ({MOCK_STORES.filter(s => s.status === 'active').length})</option>
          <option value="critical">⚠ Crítica ({MOCK_STORES.filter(s => s.status === 'critical').length})</option>
          <option value="inactive">○ Inactiva ({MOCK_STORES.filter(s => s.status === 'inactive').length})</option>
        </select>
      </div>

      {/* Score range */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <label style={LABEL}>Score mínimo</label>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', fontWeight: 600 }}>
            {filters.minScore}
          </span>
        </div>
        <input
          id="sf-minscore" name="sf-minscore"
          type="range" min={0} max={100} step={5}
          value={filters.minScore}
          onChange={e => update(() => filters.setMinScore(Number(e.target.value)))}
          style={{ width: '100%', accentColor: 'var(--ink)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--subtle)', marginTop: 4 }}>
          <span>0</span>
          <span>Promedio: {stats.avg}</span>
          <span>100</span>
        </div>
      </div>

      {/* Score max */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <label style={LABEL}>Score máximo</label>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', fontWeight: 600 }}>
            {filters.maxScore}
          </span>
        </div>
        <input
          id="sf-maxscore" name="sf-maxscore"
          type="range" min={0} max={100} step={5}
          value={filters.maxScore}
          onChange={e => update(() => filters.setMaxScore(Number(e.target.value)))}
          style={{ width: '100%', accentColor: 'var(--ink)', cursor: 'pointer' }}
        />
      </div>

      {/* Score breakdown */}
      <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
          Distribución
        </div>
        {[
          { label: 'Excelente ≥90', count: MOCK_STORES.filter(s => s.score >= 90).length, color: 'var(--ok)' },
          { label: 'Bueno 75–89',   count: MOCK_STORES.filter(s => s.score >= 75 && s.score < 90).length, color: 'var(--ink)' },
          { label: 'Regular 60–74', count: MOCK_STORES.filter(s => s.score >= 60 && s.score < 75).length, color: 'var(--warn)' },
          { label: 'Crítico <60',   count: MOCK_STORES.filter(s => s.score < 60).length, color: 'var(--err)' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--mid)' }}>{row.label}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: row.color }}>{row.count}</span>
          </div>
        ))}
      </div>

    </aside>
  )
}
