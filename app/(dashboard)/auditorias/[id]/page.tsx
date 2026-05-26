'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'
import AIAnalyzeButton, { type AIResult } from '@/components/ui/AIAnalyzeButton'

interface ItemResult {
  id: string; status: string; score?: number; scale_value?: number
  text_value?: string; numeric_value?: number; evidence_url?: string
  notes?: string; source: string; ai_confidence?: number
  audit_type_items: {
    id: string; title: string; description?: string; section: string
    order_index: number; response_type: string; max_score: number
    weight: number; required: boolean; ai_enabled: boolean
    scale_min_label?: string; scale_max_label?: string
  }
}

interface AILog {
  id:string; provider:string; model:string; proposed_status?:string
  proposed_score?:number; confidence?:number; success:boolean
  duration_ms?:number; created_at:string; error_message?:string
}

interface AuditDetail {
  id: string; status: string; score?: number; source: string
  scheduled_at?: string; started_at?: string; completed_at?: string
  total_items?: number; scored_items?: number; notes?: string
  locations?: { id:string; name:string; city:string; zone?:string }
  audit_types?: { id:string; name:string; icon:string; description?:string }
  users?: { name:string }
  items: ItemResult[]
  sections: Record<string, ItemResult[]>
  aiLogs: AILog[]
}

const STATUS_MAP: Record<string,{label:string;next?:string;nextLabel?:string;bg:string;color:string}> = {
  scheduled:   {label:'Programada',  next:'in_progress', nextLabel:'Iniciar auditoría',  bg:'var(--surface)', color:'var(--mid)'},
  in_progress: {label:'En curso',    next:'completed',   nextLabel:'Completar auditoría', bg:'var(--warn-bg)', color:'var(--warn)'},
  completed:   {label:'Completada',  bg:'var(--ok-bg)',  color:'var(--ok)'},
  cancelled:   {label:'Cancelada',   bg:'var(--surface)',color:'var(--subtle)'},
  rejected:    {label:'Rechazada',   bg:'var(--err-bg)', color:'var(--err)'},
}

const RESPONSE_TYPE_LABELS: Record<string,string> = {
  binary:'Cumple / No cumple', scale_5:'Escala 1–5', scale_10:'Escala 1–10',
  numeric:'Valor numérico', text:'Texto libre', photo:'Foto requerida',
}

function ScoreCircle({score,max}:{score?:number;max:number}) {
  const pct = score!=null ? score/max : 0
  const r=22, circ=Math.PI*r*2, offset=circ-(pct*circ)
  const color = score==null?'var(--border)':score>=max*.9?'var(--ok)':score>=max*.6?'var(--warn)':'var(--err)'
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={28} cy={28} r={r} fill="none" stroke="var(--border2)" strokeWidth={5}/>
      <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 28 28)" style={{transition:'stroke-dashoffset .5s ease'}}/>
      <text x={28} y={32} textAnchor="middle" fontSize={13} fontWeight={600} fill={color} fontFamily="var(--font-serif)">
        {score!=null?score:'—'}
      </text>
    </svg>
  )
}

function ItemRow({result, auditId, onUpdate}:{result:ItemResult;auditId:string;onUpdate:()=>void}) {
  const item   = result.audit_type_items
  const [open, setOpen] = useState(false)
  const [val,  setVal]  = useState({
    status:        result.status,
    score:         result.score?.toString()??'',
    scale_value:   result.scale_value?.toString()??'',
    text_value:    result.text_value??'',
    numeric_value: result.numeric_value?.toString()??'',
    notes:         result.notes??'',
  })
  const [saving, setSaving] = useState(false)

  const statusColor = result.status==='compliant'?'var(--ok)':result.status==='non_compliant'?'var(--err)':result.status==='partial'?'var(--warn)':result.status==='na'?'var(--subtle)':'var(--border)'
  const statusLabel = {compliant:'✓',non_compliant:'✗',partial:'~',na:'N/A',pending:'?'}[result.status]??'?'

  const save = async () => {
    setSaving(true)
    // Calcular score según tipo de respuesta
    let score: number|undefined
    if(item.response_type==='binary') {
      score = val.status==='compliant'?item.max_score:val.status==='partial'?Math.round(item.max_score/2):0
    } else if(item.response_type==='scale_5') {
      score = val.scale_value?Math.round((parseInt(val.scale_value)/5)*item.max_score):0
    } else if(item.response_type==='scale_10') {
      score = val.scale_value?Math.round((parseInt(val.scale_value)/10)*item.max_score):0
    } else if(item.response_type==='numeric') {
      score = val.score?parseInt(val.score):undefined
    }

    await fetch(`/api/audits/${auditId}/items`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        item_result_id:  result.id,
        status:          val.status,
        score,
        scale_value:     val.scale_value?parseInt(val.scale_value):undefined,
        text_value:      val.text_value||undefined,
        numeric_value:   val.numeric_value?parseFloat(val.numeric_value):undefined,
        notes:           val.notes||undefined,
        source:          'manual',
      }),
    })
    setSaving(false)
    setOpen(false)
    onUpdate()
  }

  return (
    <div style={{borderBottom:'1px solid var(--border2)',background:'var(--white)'}}>
      <div onClick={()=>setOpen(!open)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer'}}
        onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface)'}
        onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=''}>
        {/* Status indicator */}
        <div style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${statusColor}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:statusColor,flexShrink:0}}>
          {statusLabel}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:item.required?500:400,color:'var(--ink)'}}>{item.title}</div>
          <div style={{fontSize:11,color:'var(--subtle)',marginTop:1}}>{RESPONSE_TYPE_LABELS[item.response_type]}{item.required&&' · requerido'}{item.ai_enabled&&' · ✨ IA'}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          {result.score!=null&&<span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--ink)',fontWeight:600}}>{result.score}/{item.max_score}</span>}
          {result.source==='ai'&&<span style={{fontSize:10,color:'var(--ink)',background:'var(--surface)',padding:'1px 6px',borderRadius:4,border:'1px solid var(--border)'}}>IA {result.ai_confidence?.toFixed(0)}%</span>}
          <Icon name={open?'chevron-up':'chevron-down'} size={13} color="var(--subtle)"/>
        </div>
      </div>

      {open&&(
        <div style={{padding:'12px 16px 16px 56px',borderTop:'1px solid var(--border2)',background:'var(--surface)'}}>
          {item.description&&<div style={{fontSize:12,color:'var(--mid)',marginBottom:12,lineHeight:1.5}}>{item.description}</div>}

          {/* Binary */}
          {item.response_type==='binary'&&(
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              {[{v:'compliant',l:'✓ Cumple',c:'var(--ok)'},{v:'non_compliant',l:'✗ No cumple',c:'var(--err)'},{v:'partial',l:'~ Parcial',c:'var(--warn)'},{v:'na',l:'N/A',c:'var(--subtle)'}].map(o=>(
                <button key={o.v} onClick={()=>setVal(p=>({...p,status:o.v}))} style={{padding:'7px 14px',borderRadius:'var(--r-sm)',border:`2px solid ${val.status===o.v?o.c:'var(--border)'}`,background:val.status===o.v?o.c+'22':'white',color:val.status===o.v?o.c:'var(--mid)',fontSize:12,fontWeight:val.status===o.v?600:400,cursor:'pointer',fontFamily:'inherit'}}>
                  {o.l}
                </button>
              ))}
            </div>
          )}

          {/* Scale */}
          {(item.response_type==='scale_5'||item.response_type==='scale_10')&&(
            <div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--subtle)',marginBottom:6}}>
                <span>{item.scale_min_label??'Mínimo'}</span>
                <span>{item.scale_max_label??'Máximo'}</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                {Array.from({length:item.response_type==='scale_5'?5:10},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>setVal(p=>({...p,scale_value:String(n),status:'compliant'}))} style={{
                    flex:1,padding:'8px 0',borderRadius:'var(--r-sm)',border:`2px solid ${val.scale_value===String(n)?'var(--ink)':'var(--border)'}`,
                    background:val.scale_value===String(n)?'var(--ink)':'white',
                    color:val.scale_value===String(n)?'white':'var(--mid)',
                    fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          )}

          {/* Numeric */}
          {item.response_type==='numeric'&&(
            <div style={{marginBottom:12,display:'flex',gap:8,alignItems:'center'}}>
              <input type="number" value={val.numeric_value} onChange={e=>setVal(p=>({...p,numeric_value:e.target.value,status:'compliant'}))}
                placeholder="Ingresa el valor" style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',width:160,outline:'none'}}/>
              <input type="number" min={0} max={item.max_score} value={val.score} onChange={e=>setVal(p=>({...p,score:e.target.value,status:'compliant'}))}
                placeholder={`Score (0-${item.max_score})`} style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',width:130,outline:'none'}}/>
            </div>
          )}

          {/* Text */}
          {item.response_type==='text'&&(
            <textarea value={val.text_value} onChange={e=>setVal(p=>({...p,text_value:e.target.value,status:'compliant'}))}
              placeholder="Escribe tu respuesta…" style={{width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',minHeight:72,outline:'none',resize:'vertical',marginBottom:12}}/>
          )}

          {/* Notes */}
          <input value={val.notes} onChange={e=>setVal(p=>({...p,notes:e.target.value}))}
            placeholder="Notas adicionales (opcional)" style={{width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 12px',fontSize:12,fontFamily:'inherit',outline:'none',marginBottom:12}}/>

          {/* IA Analysis */}
          {item.ai_enabled&&(
            <div style={{marginBottom:12,padding:'10px 12px',background:'var(--surface)',borderRadius:'var(--r-sm)',border:'1px solid var(--border2)'}}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>✨ Análisis con IA</div>
              <AIAnalyzeButton
                auditId={auditId}
                itemResultId={result.id}
                itemTitle={item.title}
                itemDesc={item.description}
                responseType={item.response_type}
                aiPrompt={(item as any).ai_prompt}
                aiCriteria={(item as any).ai_criteria}
                maxScore={item.max_score}
                scaleMinLabel={item.scale_min_label}
                scaleMaxLabel={item.scale_max_label}
                onResult={(aiResult:AIResult)=>{
                  setVal(p=>({
                    ...p,
                    status:      aiResult.status,
                    score:       String(aiResult.score),
                    scale_value: String(aiResult.raw.scale_value??''),
                    notes:       aiResult.reasoning,
                  }))
                  if(aiResult.autoApproved){ save() }
                }}
              />
            </div>
          )}

          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'1px solid var(--border)',color:'var(--mid)',padding:'7px 14px',borderRadius:'var(--r-sm)',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{background:'var(--ink)',color:'white',border:'none',padding:'7px 16px',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:500,cursor:saving?'default':'pointer',fontFamily:'inherit'}}>
              {saving?'Guardando…':'Guardar respuesta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditoriaDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const auditId = params.id as string

  const [audit,   setAudit]   = useState<AuditDetail|null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(() => {
    fetch(`/api/audits/${auditId}`).then(r=>r.json()).then(d=>{setAudit(d);setLoading(false)})
  },[auditId])

  useEffect(()=>{load()},[load])

  const changeStatus = async (newStatus: string) => {
    setSaving(true)
    await fetch(`/api/audits/${auditId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})})
    setSaving(false)
    load()
  }

  const cancel = async () => {
    if(!confirm('¿Cancelar esta auditoría?'))return
    await fetch(`/api/audits/${auditId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'cancelled'})})
    router.push('/auditorias')
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--subtle)',fontSize:13}}>Cargando…</div>
  if(!audit)  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--subtle)',fontSize:13}}>Auditoría no encontrada.</div>

  const status    = STATUS_MAP[audit.status] ?? STATUS_MAP.scheduled
  const progress  = audit.total_items ? Math.round((audit.scored_items??0)/audit.total_items*100) : 0
  const sections  = Object.entries(audit.sections)
  const canEdit   = ['scheduled','in_progress'].includes(audit.status)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      <PageHeader
        title={(audit.audit_types?.icon ?? '📋')+' '+(audit.audit_types?.name ?? 'Auditoría')}
        highlight={audit.locations?.name}
        meta={[
          {label:'Estado',value:status.label},
          ...(audit.score!=null?[{label:'Score',value:String(audit.score)}]:[]),
        ]}
        backHref="/auditorias"
        backLabel="Auditorías"
      />

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* Sidebar */}
        <aside style={{width:240,borderRight:'1px solid var(--border)',padding:'20px 16px',flexShrink:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:16}}>

          {/* Score */}
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px',textAlign:'center'}}>
            <ScoreCircle score={audit.score} max={100}/>
            <div style={{fontSize:11,color:'var(--subtle)',marginTop:8}}>Score actual</div>
          </div>

          {/* Progreso */}
          {audit.total_items&&(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--subtle)',marginBottom:6}}>
                <span>Progreso</span>
                <span style={{fontFamily:'var(--font-mono)'}}>{audit.scored_items}/{audit.total_items}</span>
              </div>
              <div style={{height:6,background:'var(--border2)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress}%`,background:progress===100?'var(--ok)':'var(--warn)',borderRadius:3,transition:'width .3s'}}/>
              </div>
              <div style={{fontSize:10,color:'var(--subtle)',marginTop:4,textAlign:'right'}}>{progress}% completado</div>
            </div>
          )}

          {/* Info */}
          {[
            {label:'Locación',  value:audit.locations?.name},
            {label:'Ciudad',    value:audit.locations?.city},
            {label:'Auditor',   value:audit.users?.name},
            {label:'Programada',value:audit.scheduled_at?new Date(audit.scheduled_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):undefined},
            {label:'Iniciada',  value:audit.started_at?new Date(audit.started_at).toLocaleDateString('es-CO'):undefined},
            {label:'Completada',value:audit.completed_at?new Date(audit.completed_at).toLocaleDateString('es-CO'):undefined},
            {label:'Fuente',    value:audit.source==='ai'?'✨ IA':audit.source==='mixed'?'Manual + IA':'Manual'},
          ].filter(s=>s.value).map(s=>(
            <div key={s.label} style={{borderBottom:'1px solid var(--border2)',paddingBottom:10}}>
              <div style={{fontSize:10,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:3,fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:12,color:'var(--ink)'}}>{s.value}</div>
            </div>
          ))}

          {/* Trazabilidad IA */}
          {audit.aiLogs?.length>0&&(
            <div style={{borderTop:'1px solid var(--border2)',paddingTop:12,marginTop:4}}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
                ✨ Trazabilidad IA
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:6}}>
                <span style={{color:'var(--subtle)'}}>Análisis</span>
                <span style={{color:'var(--ink)',fontWeight:500}}>{audit.aiLogs.length}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:6}}>
                <span style={{color:'var(--subtle)'}}>Exitosos</span>
                <span style={{color:'var(--ok)',fontWeight:500}}>{audit.aiLogs.filter((l:AILog)=>l.success).length}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:10}}>
                <span style={{color:'var(--subtle)'}}>Confianza prom.</span>
                <span style={{color:'var(--ink)',fontWeight:500,fontFamily:'var(--font-mono)'}}>
                  {Math.round(audit.aiLogs.filter((l:AILog)=>l.success&&l.confidence!=null).reduce((a:number,l:AILog)=>a+(l.confidence??0),0)/(audit.aiLogs.filter((l:AILog)=>l.success).length||1))}%
                </span>
              </div>
              {/* Mini lista de logs */}
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {audit.aiLogs.map((log:AILog)=>{
                  const sc = log.proposed_status==='compliant'?'var(--ok)':log.proposed_status==='non_compliant'?'var(--err)':log.proposed_status==='partial'?'var(--warn)':'var(--subtle)'
                  return (
                    <div key={log.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',background:'var(--surface)',borderRadius:'var(--r-sm)',border:'1px solid var(--border2)'}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:log.success?sc:'var(--err)',flexShrink:0,display:'inline-block'}}/>
                      <span style={{fontSize:10,color:'var(--subtle)',fontFamily:'var(--font-mono)',flex:1}}>{new Date(log.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</span>
                      {log.confidence!=null&&<span style={{fontSize:10,color:log.confidence>=85?'var(--ok)':log.confidence>=70?'var(--warn)':'var(--err)',fontFamily:'var(--font-mono)',fontWeight:600}}>{Math.round(log.confidence)}%</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Acciones */}
          {canEdit&&status.next&&(
            <button onClick={()=>changeStatus(status.next!)} disabled={saving} style={{
              background:'var(--ink)',color:'white',border:'none',padding:'10px',
              borderRadius:'var(--r-md)',fontSize:13,fontWeight:500,
              cursor:saving?'default':'pointer',fontFamily:'inherit',width:'100%',
            }}>
              {saving?'…':status.nextLabel}
            </button>
          )}
          {canEdit&&(
            <button onClick={cancel} style={{background:'none',border:'1px solid var(--border)',color:'var(--subtle)',padding:'8px',borderRadius:'var(--r-md)',fontSize:12,cursor:'pointer',fontFamily:'inherit',width:'100%'}}>
              Cancelar auditoría
            </button>
          )}
        </aside>

        {/* Checklist */}
        <main style={{flex:1,overflowY:'auto'}}>
          {sections.length===0?(
            <div style={{padding:'48px',textAlign:'center',color:'var(--subtle)',fontSize:13}}>
              Sin ítems en esta auditoría.
            </div>
          ):sections.map(([section,items])=>(
            <div key={section}>
              <div style={{padding:'14px 16px 8px',position:'sticky',top:0,background:'var(--surface)',borderBottom:'1px solid var(--border2)',zIndex:5}}>
                <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span>{section}</span>
                  <span style={{fontFamily:'var(--font-mono)'}}>
                    {items.filter(i=>i.status!=='pending').length}/{items.length}
                  </span>
                </div>
              </div>
              <div style={{background:'var(--white)'}}>
                {items.map(r=>(
                  <ItemRow key={r.id} result={r} auditId={auditId} onUpdate={load}/>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}
