import FindingCard from '@/components/findings/FindingCard'
import StoreResultCard from '@/components/stores/StoreResultCard'
import { MOCK_FINDINGS, MOCK_STORES } from '@/lib/mock-data'

export default function HallazgosPage() {
  const sorted = [...MOCK_FINDINGS].sort((a, b) => b.count - a.count)
  const affected = MOCK_STORES.filter(s => s.findings > 0).sort((a, b) => b.findings - a.findings)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 92px)' }}>
      {/* Main list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border2)', background: 'var(--white)', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            {sorted.length} categorías · {sorted.reduce((s, f) => s + f.count, 0)} casos totales
          </span>
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 0 }}>
          {sorted.map(f => <FindingCard key={f.id} finding={f} />)}
        </div>
      </div>

      {/* Sidebar */}
      <aside style={{ width: 260, borderLeft: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px', borderBottom: '1px solid var(--border2)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            Tiendas afectadas
          </span>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {affected.map(s => <StoreResultCard key={s.id} store={s} />)}
        </div>
      </aside>
    </div>
  )
}
