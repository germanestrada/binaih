import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'
import { MOCK_STORES, MOCK_FINDINGS } from '@/lib/mock-data'
import { scoreLabel } from '@/lib/utils'
import { notFound } from 'next/navigation'

function scoreColor(s: number) {
  if (s >= 90) return { c: 'var(--ok)',   bg: 'var(--ok-bg)'   }
  if (s >= 75) return { c: 'var(--ink)',  bg: 'var(--surface)' }
  if (s >= 60) return { c: 'var(--warn)', bg: 'var(--warn-bg)' }
  return              { c: 'var(--err)',  bg: 'var(--err-bg)'  }
}

const STAT = ({ label, value, large }: { label: string; value: string | number; large?: boolean }) => (
  <div style={{ borderBottom: '1px solid var(--border2)', padding: '16px 0' }}>
    <div style={{ fontSize: 10, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: large ? 'var(--font-serif)' : 'var(--font-mono)', fontSize: large ? 32 : 14, color: 'var(--ink)' }}>{value}</div>
  </div>
)

export default async function StoreDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params
  const store = MOCK_STORES.find(s => s.id === storeId)
  if (!store) notFound()

  const storeFindings = MOCK_FINDINGS.filter(f => f.stores.includes(store.id))
  const sc = scoreColor(store.score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 92px)' }}>
      <PageHeader
        title={store.id}
        highlight={store.name}
        meta={[{ label: 'Ciudad', value: store.city }, { label: 'Zona', value: store.zone }]}
        backHref="/tiendas"
        backLabel="Tiendas"
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, borderRight: '1px solid var(--border)', padding: '24px 20px', flexShrink: 0 }}>
          {/* Score hero */}
          <div style={{ background: sc.bg, border: `1px solid ${sc.c}22`, borderRadius: 'var(--r-lg)', padding: '20px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 56, color: sc.c, lineHeight: 1 }}>{store.score}</div>
            <div style={{ fontSize: 11, color: sc.c, marginTop: 6, fontWeight: 500 }}>{scoreLabel(store.score)}</div>
          </div>

          <STAT label="ID" value={store.id} />
          <STAT label="Auditorías" value={store.audits} large />
          <STAT label="Hallazgos" value={store.findings} large />
          <STAT label="Estado" value={store.status === 'active' ? 'Activa' : store.status === 'critical' ? 'Crítica' : 'Inactiva'} />
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>
            Hallazgos activos
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 20 }}>
            {storeFindings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--subtle)' }}>
                <Icon name="check" size={24} color="var(--ok)" style={{ display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13 }}>Sin hallazgos activos</div>
              </div>
            ) : storeFindings.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border2)' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--err)', width: 44, textAlign: 'center', flexShrink: 0 }}>{f.count}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, color: 'var(--subtle)' }}>
                  {f.category}
                </span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>
            Auditorías recientes
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: i < 3 ? '1px solid var(--border2)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--subtle)', width: 44 }}>A{String(i).padStart(3, '0')}</div>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--ink)' }}>Auditoría #{i} — Equipo {store.zone}</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>Hace {i * 7} días</div>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ok)', background: 'var(--ok-bg)', padding: '2px 9px', borderRadius: 20 }}>completada</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
