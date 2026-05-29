'use client'
import { useEffect, useState } from 'react'

interface AccessLog { id:string; action:string; ip_address?:string; created_at:string; users?:{name:string;email:string;role_name:string} }

const ACTION_LABEL: Record<string,string> = { login:'Inicio de sesión', logout:'Cierre de sesión' }
const ACTION_COLOR: Record<string,string> = { login:'#4ade80', logout:'#94a3b8' }

export default function AccesosPage() {
  const [logs,    setLogs]    = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  useEffect(()=>{
    fetch('/api/admin/access-logs?limit=200').then(r=>r.json()).then(d=>{setLogs(d.data??[]);setLoading(false)})
  },[])

  const filtered = logs.filter(l=>
    !filter ||
    l.users?.name.toLowerCase().includes(filter.toLowerCase()) ||
    l.users?.email.toLowerCase().includes(filter.toLowerCase())
  )

  // Agrupar por usuario para stats
  const userStats = Object.values(
    logs.reduce((acc:Record<string,any>, l) => {
      const key = l.users?.email ?? 'unknown'
      if (!acc[key]) acc[key] = { name: l.users?.name, email: key, role: l.users?.role_name, count: 0, last: l.created_at }
      acc[key].count++
      if (l.created_at > acc[key].last) acc[key].last = l.created_at
      return acc
    }, {})
  ).sort((a:any,b:any) => b.count - a.count)

  return (
    <div style={{padding:'24px 28px'}}>
      {/* Stats por usuario */}
      {userStats.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:12}}>
            Actividad por usuario
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {(userStats as any[]).slice(0,4).map((u:any)=>(
              <div key={u.email} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'14px 16px'}}>
                <div style={{fontSize:11,fontWeight:500,color:'var(--ink)',marginBottom:2}}>{u.name}</div>
                <div style={{fontSize:10,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginBottom:8}}>{u.role}</div>
                <div style={{fontFamily:'var(--font-serif)',fontSize:24,color:'var(--ink)',lineHeight:1,marginBottom:4}}>{u.count}</div>
                <div style={{fontSize:10,color:'var(--subtle)'}}>Último: {new Date(u.last).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtro y tabla */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16}}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar por usuario…"
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:12,fontFamily:'inherit',outline:'none',width:240}}/>
        <span style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>{filtered.length} registros</span>
      </div>

      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          {filtered.length===0&&<div style={{padding:'40px',textAlign:'center',color:'var(--subtle)',fontSize:13}}>Sin registros de acceso.</div>}
          {filtered.map((log,i)=>(
            <div key={log.id} style={{display:'flex',alignItems:'center',gap:14,padding:'11px 16px',borderBottom:i<filtered.length-1?'1px solid var(--border2)':'none'}}>
              <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',whiteSpace:'nowrap',flexShrink:0,width:130}}>
                {new Date(log.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>{log.users?.name??'—'}</div>
                <div style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)'}}>{log.users?.email} · {log.users?.role_name}</div>
              </div>
              {log.ip_address&&<span style={{fontSize:10,color:'var(--subtle)',fontFamily:'var(--font-mono)',flexShrink:0}}>{log.ip_address}</span>}
              <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:(ACTION_COLOR[log.action]??'var(--subtle)')+'22',color:ACTION_COLOR[log.action]??'var(--subtle)',flexShrink:0,whiteSpace:'nowrap'}}>
                {ACTION_LABEL[log.action]??log.action}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
