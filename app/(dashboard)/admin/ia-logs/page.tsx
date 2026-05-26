'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

interface AILog {
  id:string; provider:string; model:string; proposed_status?:string
  proposed_score?:number; confidence?:number; success:boolean
  error_message?:string; duration_ms?:number; created_at:string
  image_url?:string; audits?:{locations?:{name:string}}
}
interface Stats {
  total:number; successful:number; failed:number
  avgConfidence:number; avgDuration:number
}

const STATUS_COLOR: Record<string,string> = {
  compliant:'var(--ok)', non_compliant:'var(--err)',
  partial:'var(--warn)', na:'var(--subtle)', pending:'var(--subtle)',
}
const STATUS_LABEL: Record<string,string> = {
  compliant:'Cumple', non_compliant:'No cumple',
  partial:'Parcial', na:'N/A', pending:'Pendiente',
}

function ConfidenceBar({value}:{value:number}) {
  const color = value>=85?'var(--ok)':value>=70?'var(--warn)':'var(--err)'
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,minWidth:120}}>
      <div style={{flex:1,height:4,background:'var(--border2)',borderRadius:2,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${value}%`,background:color,borderRadius:2}}/>
      </div>
      <span style={{fontSize:11,fontFamily:'var(--font-mono)',color,fontWeight:600,whiteSpace:'nowrap'}}>{value}%</span>
    </div>
  )
}

export default function IALogsPage() {
  const [logs,    setLogs]    = useState<AILog[]>([])
  const [stats,   setStats]   = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all'|'success'|'failed'>('all')
  const [preview, setPreview] = useState<string|null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/ai-logs?limit=100').then(r=>r.json()).then(d=>{
      setLogs(d.data??[])
      setStats(d.stats)
      setLoading(false)
    })
  }
  useEffect(()=>{load()},[])

  const filtered = logs.filter(l =>
    filter==='all'     ? true :
    filter==='success' ? l.success :
    !l.success
  )

  return (
    <div style={{padding:'24px 28px'}}>
      {/* Stats */}
      {stats&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
          {[
            {label:'Total análisis',    value:stats.total,          color:'var(--ink)'},
            {label:'Exitosos',          value:stats.successful,     color:'var(--ok)'},
            {label:'Fallidos',          value:stats.failed,         color:'var(--err)'},
            {label:'Confianza promedio',value:`${stats.avgConfidence}%`,color:stats.avgConfidence>=80?'var(--ok)':stats.avgConfidence>=65?'var(--warn)':'var(--err)'},
            {label:'Duración promedio', value:`${stats.avgDuration}ms`,color:'var(--ink)'},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'14px 16px'}}>
              <div style={{fontSize:10,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,fontWeight:600}}>{s.label}</div>
              <div style={{fontFamily:'var(--font-serif)',fontSize:24,color:s.color,lineHeight:1}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16}}>
        <div style={{display:'flex',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',overflow:'hidden'}}>
          {(['all','success','failed'] as const).map(v=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              padding:'6px 14px',fontSize:12,border:'none',cursor:'pointer',fontFamily:'inherit',
              background:filter===v?'var(--ink)':'var(--white)',
              color:filter===v?'white':'var(--subtle)',
            }}>{v==='all'?'Todos':v==='success'?'Exitosos':'Fallidos'}</button>
          ))}
        </div>
        <span style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>{filtered.length} registros</span>
        <button onClick={load} style={{background:'none',border:'1px solid var(--border)',color:'var(--mid)',padding:'6px 12px',borderRadius:'var(--r-sm)',fontSize:12,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
          <Icon name="trending-up" size={13}/>Actualizar
        </button>
      </div>

      {/* Tabla */}
      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        filtered.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>
            Sin registros de análisis IA.{' '}
            {filter!=='all'&&<button onClick={()=>setFilter('all')} style={{background:'none',border:'none',color:'var(--ink)',cursor:'pointer',fontFamily:'inherit',fontSize:13,textDecoration:'underline'}}>Ver todos</button>}
          </div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {/* Header */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 120px 100px 140px 80px 80px',gap:0,padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
              {['Ítem / Locación','Modelo','Resultado','Confianza','Duración','Estado'].map(h=>(
                <div key={h} style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px'}}>{h}</div>
              ))}
            </div>
            {filtered.map((log,i)=>{
              const statusColor = log.proposed_status ? STATUS_COLOR[log.proposed_status] ?? 'var(--subtle)' : 'var(--subtle)'
              return (
                <div key={log.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 100px 140px 80px 80px',gap:0,padding:'12px 16px',borderBottom:i<filtered.length-1?'1px solid var(--border2)':'none',alignItems:'center'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=''}>
                  {/* Info */}
                  <div>
                    <div style={{fontSize:12,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginBottom:2}}>{new Date(log.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                    {log.audits?.locations?.name&&<div style={{fontSize:12,color:'var(--mid)'}}>{log.audits.locations.name}</div>}
                    {log.image_url&&(
                      <button onClick={()=>setPreview(log.image_url!)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--blue2)',fontSize:11,padding:0,fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                        <Icon name="eye" size={11}/>Ver imagen
                      </button>
                    )}
                  </div>
                  {/* Modelo */}
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--mid)'}}>{log.provider}/{log.model?.split('-').slice(-1)[0]}</div>
                  {/* Resultado */}
                  <div>
                    {log.proposed_status&&(
                      <span style={{fontSize:11,fontWeight:500,color:statusColor}}>{STATUS_LABEL[log.proposed_status]??log.proposed_status}</span>
                    )}
                    {log.proposed_score!=null&&<div style={{fontSize:10,color:'var(--subtle)'}}>Score: {log.proposed_score}</div>}
                  </div>
                  {/* Confianza */}
                  <div>{log.confidence!=null?<ConfidenceBar value={Math.round(log.confidence)}/>:<span style={{color:'var(--subtle)',fontSize:11}}>—</span>}</div>
                  {/* Duración */}
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--subtle)'}}>{log.duration_ms!=null?`${log.duration_ms}ms`:'—'}</div>
                  {/* Estado */}
                  <div>
                    <span style={{fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:20,background:log.success?'var(--ok-bg)':'var(--err-bg)',color:log.success?'var(--ok)':'var(--err)'}}>
                      {log.success?'✓ OK':'✗ Error'}
                    </span>
                    {log.error_message&&<div style={{fontSize:10,color:'var(--err)',marginTop:3}}>{log.error_message.slice(0,40)}…</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Preview modal */}
      {preview&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setPreview(null)}>
          <div style={{position:'relative',maxWidth:'80vw',maxHeight:'80vh'}}>
            <img src={preview} alt="evidencia" style={{maxWidth:'100%',maxHeight:'80vh',borderRadius:'var(--r-lg)',objectFit:'contain'}}/>
            <button onClick={()=>setPreview(null)} style={{position:'absolute',top:-12,right:-12,background:'var(--ink)',border:'none',color:'white',width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="x" size={14} color="white"/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
