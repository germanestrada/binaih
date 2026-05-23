'use client'
import { MOCK_STORES } from '@/lib/mock-data'

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  completada: { background: 'var(--ok-bg)',   color: 'var(--ok)'   },
  programada: { background: 'var(--warn-bg)', color: 'var(--warn)' },
}

export default function AuditoriasPage() {
  const rows = MOCK_STORES.flatMap((s, i) => ([
    { id: `A${String(i * 2 + 1).padStart(3, '0')}`, store: s, date: `2025-05-${String(10 + i).padStart(2, '0')}`, score: s.score, status: 'completada', auditor: 'Equipo ' + s.zone },
    { id: `A${String(i * 2 + 2).padStart(3, '0')}`, store: s, date: `2025-06-${String(5 + i).padStart(2, '0')}`,  score: null,    status: 'programada', auditor: 'Por asignar' },
  ]))

  const COLS = ['ID', 'Tienda', 'Ciudad', 'Zona', 'Fecha', 'Score', 'Auditor', 'Estado']

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16 }}>
        {rows.length} auditorías registradas
      </div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {COLS.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.8px', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border2)' : 'none', transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--subtle)' }}>{r.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ink)' }}>{r.store.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--mid)' }}>{r.store.city}</td>
                <td style={{ padding: '12px 16px', color: 'var(--mid)' }}>{r.store.zone}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mid)' }}>{r.date}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-serif)', fontSize: 18, color: r.score && r.score >= 75 ? 'var(--ok)' : 'var(--err)' }}>{r.score ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--mid)' }}>{r.auditor}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, ...STATUS_STYLE[r.status] }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
