import { MOCK_FINDINGS, MOCK_STORES } from '@/lib/mock-data'
import StoreResultCard from '@/components/stores/StoreResultCard'

export default function TopHallazgosPage() {
  const top5 = [...MOCK_FINDINGS].sort((a, b) => b.count - a.count).slice(0, 5)
  const maxCount = top5[0]?.count ?? 1
  const sids = [...new Set(top5.flatMap(f => f.stores))]
  const stores = sids.map(id => MOCK_STORES.find(s => s.id === id)).filter(Boolean) as typeof MOCK_STORES

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 92px)' }}>
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 20 }}>
          Top 5 hallazgos por frecuencia
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          {top5.map((f, i) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderBottom: i < top5.length - 1 ? '1px solid var(--border2)' : 'none' }}>
              {/* Rank */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--border)', width: 36, flexShrink: 0, lineHeight: 1 }}>
                {i + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>{f.title}</div>
                <div style={{ height: 5, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((f.count / maxCount) * 100)}%`,
                    background: 'var(--ink)',
                    borderRadius: 3,
                    transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 6 }}>{f.desc}</div>
              </div>

              {/* Count */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--ink)', lineHeight: 1 }}>{f.count}</div>
                <div style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 3 }}>casos</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <aside style={{ width: 260, borderLeft: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border2)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            {stores.length} tiendas impactadas
          </span>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {stores.map(s => <StoreResultCard key={s.id} store={s} />)}
        </div>
      </aside>
    </div>
  )
}
