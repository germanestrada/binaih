'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import FilterBar from '@/components/ui/FilterBar'

interface Audit {
  id: string
  status: string
  score?: number
  scheduled_at?: string
  completed_at?: string
  total_items?: number
  scored_items?: number
  source: string
  locations?: { name: string; city: string }
  audit_types?: { name: string; icon: string }
  users?: { name: string }
}

const STATUS_BADGE: Record<string,{label:string;bg:string;color:string}> = {
  scheduled:   {label:'Programada',  bg:'var(--surface)',color:'var(--mid)'},
  in_progress: {label:'En curso',    bg:'var(--warn-bg)', color:'var(--warn)'},
  completed:   {label:'Completada',  bg:'var(--ok-bg)',   color:'var(--ok)'},
  cancelled:   {label:'Cancelada',   bg:'var(--surface)', color:'var(--subtle)'},
  rejected:    {label:'Rechazada',   bg:'var(--err-bg)',  color:'var(--err)'},
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}

function AuditoriasContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [audits,  setAudits]  = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState(params.get('status') ?? '')

  const load = (status: string) => {
    setLoading(true)
    const url = '/api/audits' + (status ? `?status=${status}` : '')
    fetch(url).then(r=>r.json()).then(d=>{setAudits(d.data??[]);setLoading(false)})
  }

  useEffect(()=>{load(filter)},[filter])

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      {/* Toolbar — sin botón Nueva auditoría */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 24px',borderBottom:'1px solid var(--border)',background:'var(--white)',flexShrink:0}}>
        <FilterBar
          fields={[
            {key:'status',label:'Estado',type:'select',options:[
              {value:'scheduled',label:'Programada'},{value:'in_progress',label:'En curso'},
              {value:'completed',label:'Completada'},{value:'cancelled',label:'Cancelada'},
            ]},
          ]}
          values={{status:filter}}
          onChange={(_k,v)=>setFilter(v)}
          onClear={()=>setFilter('')}
          count={audits.length}
          label="Estado"
        />
        {/* Botón para ir a Programación */}
        <button onClick={()=>router.push('/programacion')} style={{
          display:'flex',alignItems:'center',gap:6,marginLeft:'auto',
          background:'none',color:'var(--mid)',border:'1px solid var(--border)',
          padding:'8px 16px',borderRadius:'var(--r-sm)',fontSize:13,
          fontWeight:500,cursor:'pointer',fontFamily:'inherit',
        }}>
          <Icon name="calendar" size={13} color="currentColor"/>
          Programar auditoría
        </button>
      </div>

      {/* List */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}>
        {loading ? (
          <div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>
        ) : audits.length===0 ? (
          <div style={{textAlign:'center',padding:'60px',color:'var(--subtle)'}}>
            <Icon name="calendar" size={28} color="var(--border)" style={{display:'block',margin:'0 auto 12px'}}/>
            <div style={{fontSize:13}}>Sin auditorías{filter?` con estado "${filter}"`:''}</div>
            <button onClick={()=>router.push('/programacion')} style={{marginTop:16,fontSize:12,color:'var(--ink)',background:'none',border:'1px solid var(--border)',padding:'7px 16px',borderRadius:'var(--r-sm)',cursor:'pointer',fontFamily:'inherit'}}>
              Ir a Programación
            </button>
          </div>
        ) : (
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {audits.map((a,i)=>{
              const b        = STATUS_BADGE[a.status] ?? STATUS_BADGE.scheduled
              const progress = a.total_items ? Math.round((a.scored_items??0)/a.total_items*100) : 0
              return (
                <div key={a.id}
                  style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:i<audits.length-1?'1px solid var(--border2)':'none',transition:'background .1s'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=''}
                >
                  {/* Tipo ícono */}
                  <div style={{width:40,height:40,borderRadius:'var(--r-md)',background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                    {a.audit_types?.icon ?? '📋'}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>router.push(`/auditorias/${a.id}`)}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:2}}>
                      {a.audit_types?.name ?? 'Auditoría'} — {a.locations?.name ?? '—'}
                    </div>
                    <div style={{display:'flex',gap:12,fontSize:11,color:'var(--subtle)'}}>
                      <span>📍 {a.locations?.city}</span>
                      <span>👤 {a.users?.name}</span>
                      <span>🗓 {formatDate(a.scheduled_at)}</span>
                      {a.source==='scheduled'&&<span style={{color:'var(--ink)',fontWeight:500}}>🔁 Programada</span>}
                      {a.source==='ai'&&<span style={{color:'var(--ink)',fontWeight:500}}>✨ IA</span>}
                    </div>
                    {/* Barra de progreso para in_progress */}
                    {a.status==='in_progress'&&a.total_items&&(
                      <div style={{marginTop:6,display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:3,background:'var(--border2)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${progress}%`,background:'var(--warn)',borderRadius:2,transition:'width .3s'}}/>
                        </div>
                        <span style={{fontSize:10,color:'var(--subtle)',fontFamily:'var(--font-mono)',whiteSpace:'nowrap'}}>
                          {a.scored_items}/{a.total_items} ítems
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  {a.score!=null&&(
                    <div style={{fontFamily:'var(--font-serif)',fontSize:28,color:'var(--ink)',lineHeight:1,flexShrink:0}}>{a.score}</div>
                  )}

                  {/* Botón Ejecutar para auditorías programadas */}
                  {a.status==='scheduled'&&(
                    <button
                      onClick={e=>{e.stopPropagation();router.push(`/auditorias/${a.id}`)}}
                      style={{
                        display:'flex',alignItems:'center',gap:6,
                        background:'var(--ink)',color:'white',border:'none',
                        padding:'7px 14px',borderRadius:'var(--r-sm)',fontSize:12,
                        fontWeight:500,cursor:'pointer',fontFamily:'inherit',flexShrink:0,
                      }}
                    >
                      <Icon name="check" size={12} color="white"/>
                      Ejecutar
                    </button>
                  )}

                  {/* Estado */}
                  <span style={{fontSize:11,fontWeight:500,padding:'3px 10px',borderRadius:20,background:b.bg,color:b.color,flexShrink:0}}>{b.label}</span>

                  <Icon name="arrow-right" size={13} color="var(--subtle)"/>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuditoriasPage() {
  return <Suspense><AuditoriasContent/></Suspense>
}