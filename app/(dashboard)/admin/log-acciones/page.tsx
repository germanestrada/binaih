'use client'
import { useEffect, useState } from 'react'

interface ActionLog {
  id:string; action:string; entity_type:string; entity_id?:string
  entity_name?:string; records_affected:number; description?:string
  status:string; created_at:string
  users?:{id:string;name:string;email:string;role_name:string}
}

const ACTION_LABEL: Record<string,string> = {
  delete_audits:   'Eliminar auditorías',
  delete_location: 'Eliminar locación',
  export_data:     'Exportar datos',
  bulk_import:     'Cargue masivo',
  update_config:   'Actualizar configuración',
}
const ACTION_COLOR: Record<string,string> = {
  delete_audits:   'var(--err)',
  delete_location: 'var(--err)',
  export_data:     'var(--ok)',
  bulk_import:     'var(--blue2)',
  update_config:   'var(--warn)',
}
const STATUS_BADGE: Record<string,{bg:string;color:string;label:string}> = {
  success: {bg:'var(--ok-bg)',  color:'var(--ok)',   label:'Exitoso'},
  failed:  {bg:'var(--err-bg)', color:'var(--err)',  label:'Fallido'},
  partial: {bg:'var(--warn-bg)',color:'var(--warn)', label:'Parcial'},
}

export default function LogsAccionesPage() {
  const [logs,     setLogs]     = useState<ActionLog[]>([])
  const [users,    setUsers]    = useState<{id:string;name:string}[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selected,   setSelected]   = useState<ActionLog|null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/action-logs?limit=200').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
    ]).then(([l,u])=>{
      setLogs(l.data??[])
      setUsers(u.data??[])
      setLoading(false)
    })
  }
  useEffect(()=>{load()},[])

  const filtered = logs.filter(l=>
    (!filterUser || l.users?.id === filterUser) &&
    (!filterType || l.entity_type === filterType)
  )

  const entityTypes = [...new Set(logs.map(l=>l.entity_type))]

  return (
    <div style={{padding:'24px 28px'}}>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Total acciones',   value:logs.length},
          {label:'Eliminaciones',    value:logs.filter(l=>l.action.startsWith('delete')).length,  color:'var(--err)'},
          {label:'Registros afect.', value:logs.reduce((a,l)=>a+l.records_affected,0)},
          {label:'Fallidas',         value:logs.filter(l=>l.status==='failed').length,            color:'var(--warn)'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'14px 16px'}}>
            <div style={{fontSize:10,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,fontWeight:600}}>{s.label}</div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:28,color:(s as any).color??'var(--ink)',lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <select value={filterUser} onChange={e=>setFilterUser(e.target.value)}
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 10px',fontSize:12,fontFamily:'inherit',outline:'none',background:'white',cursor:'pointer'}}>
          <option value="">Todos los usuarios</option>
          {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 10px',fontSize:12,fontFamily:'inherit',outline:'none',background:'white',cursor:'pointer'}}>
          <option value="">Todos los tipos</option>
          {entityTypes.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>{filtered.length} registros</span>
        <button onClick={load} style={{background:'none',border:'1px solid var(--border)',padding:'7px 12px',borderRadius:'var(--r-sm)',fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'var(--mid)'}}>
          Actualizar
        </button>
      </div>

      {/* Tabla */}
      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        filtered.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>Sin registros de acciones.</div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {filtered.map((log,i)=>{
              const st = STATUS_BADGE[log.status]??STATUS_BADGE.success
              return (
                <div key={log.id}
                  onClick={()=>setSelected(selected?.id===log.id?null:log)}
                  style={{borderBottom:i<filtered.length-1?'1px solid var(--border2)':'none',cursor:'pointer'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=''}
                >
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px'}}>
                    {/* Fecha */}
                    <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',flexShrink:0,width:120}}>
                      <div>{new Date(log.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}</div>
                      <div>{new Date(log.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
                    </div>
                    {/* Usuario */}
                    <div style={{width:160,flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>{log.users?.name??'—'}</div>
                      <div style={{fontSize:10,color:'var(--subtle)'}}>{log.users?.role_name}</div>
                    </div>
                    {/* Acción */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:500,color:ACTION_COLOR[log.action]??'var(--ink)'}}>
                          {ACTION_LABEL[log.action]??log.action}
                        </span>
                        <span style={{fontSize:11,color:'var(--subtle)'}}>→ {log.entity_name??log.entity_id??'—'}</span>
                      </div>
                      {log.description&&<div style={{fontSize:11,color:'var(--subtle)'}}>{log.description}</div>}
                    </div>
                    {/* Registros afectados */}
                    <div style={{fontFamily:'var(--font-serif)',fontSize:22,color:'var(--ink)',flexShrink:0,minWidth:40,textAlign:'right'}}>
                      {log.records_affected}
                    </div>
                    {/* Estado */}
                    <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:st.bg,color:st.color,flexShrink:0}}>
                      {st.label}
                    </span>
                  </div>
                  {/* Detalle expandible */}
                  {selected?.id===log.id&&log.metadata&&(
                    <div style={{padding:'0 16px 12px',borderTop:'1px solid var(--border2)'}}>
                      <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:6}}>Metadata</div>
                      <pre style={{fontSize:11,color:'var(--mid)',fontFamily:'var(--font-mono)',background:'var(--surface)',padding:'10px',borderRadius:'var(--r-sm)',overflow:'auto',maxHeight:120}}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}