'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'
import { scoreLabel } from '@/lib/utils'

// ── Tipos ────────────────────────────────────────────────────
interface LocationDetail {
  id: string; name: string; address?: string; city: string; zone?: string
  status: string; current_score: number; last_audit_at?: string
  manager_name?: string; manager_phone?: string; area_sqm?: number
  location_types?: { name: string; icon: string }
  audits: Audit[]; findings: Finding[]; scoreHistory: ScorePoint[]
}
interface Audit {
  id: string; score?: number; status: string
  completed_at?: string; scheduled_at?: string; notes?: string
}
interface Finding {
  id: string; count: number; severity: string; status: string
  resolution_notes?: string; due_date?: string
  finding_categories?: { title: string; icon: string; color: string }
}
interface ScorePoint { score: number; previous_score?: number; delta?: number; recorded_at: string }

// ── Helpers ──────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 90) return { c: 'var(--ok)',   bg: 'var(--ok-bg)'   }
  if (s >= 75) return { c: 'var(--ink)',  bg: 'var(--surface)' }
  if (s >= 60) return { c: 'var(--warn)', bg: 'var(--warn-bg)' }
  return              { c: 'var(--err)',  bg: 'var(--err-bg)'  }
}

function severityColor(s: string) {
  const m: Record<string, string> = { low:'var(--ok)', medium:'var(--warn)', high:'var(--err)', critical:'#6b0000' }
  return m[s] ?? 'var(--subtle)'
}

function statusBadge(s: string) {
  const m: Record<string, { label:string; color:string; bg:string }> = {
    open:        { label:'Abierto',     color:'var(--err)',  bg:'var(--err-bg)'  },
    in_progress: { label:'En progreso', color:'var(--warn)', bg:'var(--warn-bg)' },
    resolved:    { label:'Resuelto',    color:'var(--ok)',   bg:'var(--ok-bg)'   },
    accepted:    { label:'Aceptado',    color:'var(--subtle)',bg:'var(--surface)'},
  }
  return m[s] ?? { label: s, color:'var(--subtle)', bg:'var(--surface)' }
}

function auditStatusBadge(s: string) {
  const m: Record<string, { label:string; color:string; bg:string }> = {
    completed:   { label:'Completada',  color:'var(--ok)',   bg:'var(--ok-bg)'   },
    in_progress: { label:'En curso',    color:'var(--warn)', bg:'var(--warn-bg)' },
    scheduled:   { label:'Programada',  color:'var(--ink)',  bg:'var(--surface)' },
    cancelled:   { label:'Cancelada',   color:'var(--subtle)',bg:'var(--border2)'},
  }
  return m[s] ?? { label: s, color:'var(--subtle)', bg:'var(--surface)' }
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })
}

// ── Gráfico de tendencia ──────────────────────────────────────
function ScoreTrendChart({ history }: { history: ScorePoint[] }) {
  if (!history.length) return (
    <div style={{ padding:'32px', textAlign:'center', color:'var(--subtle)', fontSize:13 }}>
      Sin historial de scores
    </div>
  )

  const scores  = history.map(h => h.score)
  const min     = Math.max(0,  Math.min(...scores) - 10)
  const max     = Math.min(100, Math.max(...scores) + 10)
  const W = 560, H = 120, PAD = 20

  const x = (i: number) => PAD + (i / (history.length - 1 || 1)) * (W - PAD * 2)
  const y = (s: number) => H - PAD - ((s - min) / (max - min || 1)) * (H - PAD * 2)

  const points = history.map((h, i) => `${x(i)},${y(h.score)}`).join(' ')
  const area   = `M ${x(0)},${y(history[0].score)} ` +
    history.slice(1).map((h, i) => `L ${x(i+1)},${y(h.score)}`).join(' ') +
    ` L ${x(history.length-1)},${H - PAD} L ${x(0)},${H - PAD} Z`

  return (
    <div style={{ padding:'0 0 4px' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
        {/* Grid lines */}
        {[0,25,50,75,100].map(v => {
          if (v < min || v > max) return null
          return (
            <g key={v}>
              <line x1={PAD} y1={y(v)} x2={W-PAD} y2={y(v)} stroke="var(--border2)" strokeWidth="1"/>
              <text x={PAD-4} y={y(v)+4} fontSize="9" fill="var(--subtle)" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {/* Area */}
        <path d={area} fill="var(--ink)" opacity=".06" />
        {/* Line */}
        <polyline points={points} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Points */}
        {history.map((h, i) => {
          const sc = scoreColor(h.score)
          return (
            <g key={i}>
              <circle cx={x(i)} cy={y(h.score)} r="5" fill={sc.c} stroke="white" strokeWidth="2"/>
              <text x={x(i)} y={y(h.score)-10} fontSize="10" fill="var(--ink)" textAnchor="middle" fontWeight="600">
                {h.score}
              </text>
            </g>
          )
        })}
        {/* X labels */}
        {history.map((h, i) => (
          <text key={i} x={x(i)} y={H-2} fontSize="9" fill="var(--subtle)" textAnchor="middle">
            {new Date(h.recorded_at).toLocaleDateString('es-CO',{month:'short',day:'numeric'})}
          </text>
        ))}
      </svg>

      {/* Delta badges */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', padding:'8px 0 0' }}>
        {history.slice(1).map((h, i) => {
          const delta = h.delta ?? (h.score - (history[i].score))
          const color = delta > 0 ? 'var(--ok)' : delta < 0 ? 'var(--err)' : 'var(--subtle)'
          return (
            <span key={i} style={{ fontSize:10, color, fontFamily:'var(--font-mono)', fontWeight:600 }}>
              {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'}{Math.abs(delta)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function StoreDetailPage() {
  const params = useParams()
  const storeId = params.storeId as string

  const [data, setData]       = useState<LocationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'findings'|'audits'|'trend'>('trend')

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [storeId])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--subtle)', fontSize:13 }}>
      Cargando…
    </div>
  )

  if (!data) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--subtle)', fontSize:13 }}>
      Locación no encontrada.
    </div>
  )

  const sc             = scoreColor(data.current_score ?? 0)
  const openFindings   = data.findings.filter(f => f.status !== 'resolved' && f.status !== 'accepted')
  const closedFindings = data.findings.filter(f => f.status === 'resolved' || f.status === 'accepted')

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 92px)' }}>
      <PageHeader
        title={data.id}
        highlight={data.name}
        meta={[
          { label:'Ciudad', value: data.city },
          ...(data.zone ? [{ label:'Zona', value: data.zone }] : []),
          ...(data.location_types ? [{ label:'Tipo', value: `${data.location_types.icon} ${data.location_types.name}` }] : []),
        ]}
        backHref="/tiendas"
        backLabel="Locaciones"
      />

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width:220, borderRight:'1px solid var(--border)', padding:'20px 16px', flexShrink:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:0 }}>

          {/* Score hero */}
          <div style={{ background:sc.bg, border:`1px solid ${sc.c}22`, borderRadius:'var(--r-lg)', padding:'20px', textAlign:'center', marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:56, color:sc.c, lineHeight:1 }}>
              {data.current_score ?? '—'}
            </div>
            <div style={{ fontSize:11, color:sc.c, marginTop:6, fontWeight:500 }}>
              {scoreLabel(data.current_score ?? 0)}
            </div>
            {data.last_audit_at && (
              <div style={{ fontSize:10, color:'var(--subtle)', marginTop:8 }}>
                Última: {formatDate(data.last_audit_at)}
              </div>
            )}
          </div>

          {/* Stats */}
          {[
            { label:'Estado',      value: data.status === 'active' ? 'Activa' : data.status === 'critical' ? 'Crítica' : 'Inactiva' },
            { label:'Auditorías',  value: data.audits.length,   large: true },
            { label:'Hallazgos',   value: openFindings.length,  large: true },
            ...(data.manager_name  ? [{ label:'Gerente', value: data.manager_name }] : []),
            ...(data.manager_phone ? [{ label:'Teléfono', value: data.manager_phone }] : []),
            ...(data.area_sqm      ? [{ label:'Área m²', value: `${data.area_sqm} m²` }] : []),
            ...(data.address       ? [{ label:'Dirección', value: data.address }] : []),
          ].map(s => (
            <div key={s.label} style={{ borderBottom:'1px solid var(--border2)', padding:'12px 0' }}>
              <div style={{ fontSize:10, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4, fontWeight:600 }}>{s.label}</div>
              <div style={{ fontFamily: s.large ? 'var(--font-serif)' : 'var(--font-sans)', fontSize: s.large ? 28 : 12, color:'var(--ink)', lineHeight:1.3 }}>{s.value}</div>
            </div>
          ))}
        </aside>

        {/* ── Main ── */}
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px', background:'var(--white)', flexShrink:0 }}>
            {([
              { key:'trend',    label:'Tendencia',  icon:'trending-up'  as const },
              { key:'findings', label:`Hallazgos (${openFindings.length})`, icon:'search' as const },
              { key:'audits',   label:'Auditorías', icon:'calendar' as const },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'14px 16px', fontSize:12, fontWeight: tab===t.key ? 600 : 400,
                color: tab===t.key ? 'var(--ink)' : 'var(--subtle)',
                background:'none', border:'none', borderBottom: tab===t.key ? '2px solid var(--ink)' : '2px solid transparent',
                cursor:'pointer', fontFamily:'inherit', marginBottom:-1, transition:'all .15s',
              }}>
                <Icon name={t.icon} size={13} color="currentColor" />
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding:'24px 28px', flex:1 }}>

            {/* ── Tab: Tendencia ── */}
            {tab === 'trend' && (
              <div>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:16 }}>
                  Historial de score
                </div>
                <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'20px 24px', marginBottom:16 }}>
                  <ScoreTrendChart history={data.scoreHistory} />
                </div>

                {/* Resumen de evolución */}
                {data.scoreHistory.length >= 2 && (() => {
                  const first = data.scoreHistory[0].score
                  const last  = data.scoreHistory[data.scoreHistory.length-1].score
                  const total = last - first
                  const color = total > 0 ? 'var(--ok)' : total < 0 ? 'var(--err)' : 'var(--subtle)'
                  return (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                      {[
                        { label:'Score inicial', value: first, serif: true },
                        { label:'Score actual',  value: last,  serif: true },
                        { label:'Variación total', value: `${total > 0 ? '+' : ''}${total} pts`, color },
                      ].map(s => (
                        <div key={s.label} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px 16px' }}>
                          <div style={{ fontSize:10, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6, fontWeight:600 }}>{s.label}</div>
                          <div style={{ fontFamily: s.serif ? 'var(--font-serif)' : 'var(--font-sans)', fontSize: s.serif ? 28 : 20, color: s.color ?? 'var(--ink)', fontWeight: s.serif ? 400 : 700 }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ── Tab: Hallazgos ── */}
            {tab === 'findings' && (
              <div>
                {openFindings.length === 0 && closedFindings.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px', color:'var(--subtle)' }}>
                    <Icon name="check" size={28} color="var(--ok)" style={{ display:'block', margin:'0 auto 12px' }} />
                    <div style={{ fontSize:13 }}>Sin hallazgos registrados</div>
                  </div>
                ) : (
                  <>
                    {openFindings.length > 0 && (
                      <>
                        <div style={{ fontSize:10, fontWeight:600, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:12 }}>
                          Abiertos · {openFindings.length}
                        </div>
                        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden', marginBottom:20 }}>
                          {openFindings.map((f, i) => {
                            const sb = statusBadge(f.status)
                            const sc2 = severityColor(f.severity)
                            return (
                              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderBottom: i < openFindings.length-1 ? '1px solid var(--border2)' : 'none' }}>
                                <div style={{ width:36, height:36, borderRadius:'var(--r-md)', background: f.finding_categories?.color ?? 'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                                  {f.finding_categories?.icon ?? '🔍'}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', marginBottom:3 }}>
                                    {f.finding_categories?.title ?? 'Hallazgo'}
                                  </div>
                                  {f.resolution_notes && (
                                    <div style={{ fontSize:11, color:'var(--subtle)', lineHeight:1.5 }}>{f.resolution_notes}</div>
                                  )}
                                  {f.due_date && (
                                    <div style={{ fontSize:10, color:'var(--warn)', marginTop:3, fontFamily:'var(--font-mono)' }}>
                                      Fecha límite: {formatDate(f.due_date)}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                                  <span style={{ fontFamily:'var(--font-serif)', fontSize:20, color:sc2, lineHeight:1 }}>{f.count}</span>
                                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:sb.bg, color:sb.color }}>{sb.label}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {closedFindings.length > 0 && (
                      <>
                        <div style={{ fontSize:10, fontWeight:600, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:12 }}>
                          Resueltos · {closedFindings.length}
                        </div>
                        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden', opacity:.7 }}>
                          {closedFindings.map((f, i) => (
                            <div key={f.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderBottom: i < closedFindings.length-1 ? '1px solid var(--border2)' : 'none' }}>
                              <div style={{ width:32, height:32, borderRadius:'var(--r-sm)', background:'var(--ok-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                                {f.finding_categories?.icon ?? '✓'}
                              </div>
                              <div style={{ flex:1, fontSize:12, color:'var(--mid)' }}>
                                {f.finding_categories?.title ?? 'Hallazgo'}
                              </div>
                              <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--ok-bg)', color:'var(--ok)' }}>Resuelto</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Auditorías ── */}
            {tab === 'audits' && (
              <div>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:16 }}>
                  {data.audits.length} auditorías registradas
                </div>
                {data.audits.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px', color:'var(--subtle)', fontSize:13 }}>
                    Sin auditorías registradas
                  </div>
                ) : (
                  <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
                    {data.audits.map((a, i) => {
                      const ab = auditStatusBadge(a.status)
                      return (
                        <div key={a.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderBottom: i < data.audits.length-1 ? '1px solid var(--border2)' : 'none' }}>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--subtle)', width:56, flexShrink:0 }}>
                            {a.id.slice(-6).toUpperCase()}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, color:'var(--ink)', marginBottom:2 }}>
                              {formatDate(a.completed_at ?? a.scheduled_at)}
                            </div>
                            {a.notes && (
                              <div style={{ fontSize:11, color:'var(--subtle)', lineHeight:1.4 }}>{a.notes}</div>
                            )}
                          </div>
                          {a.score != null && (
                            <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color: scoreColor(a.score).c, flexShrink:0 }}>
                              {a.score}
                            </div>
                          )}
                          <span style={{ fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:20, background:ab.bg, color:ab.color, flexShrink:0 }}>
                            {ab.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
