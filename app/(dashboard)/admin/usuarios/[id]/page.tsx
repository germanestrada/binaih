'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface User {
  id:string; name:string; email:string; role_name:string
  zone?:string; status:string; last_login?:string; created_at:string; phone?:string
}
interface ActionLog {
  id:string; action:string; entity_type:string; entity_name?:string
  records_affected:number; description?:string; metadata?:Record<string,unknown>
  status:string; created_at:string
}
interface AccessLog {
  id:string; action:string; ip_address?:string; user_agent?:string
  created_at:string; blocked:boolean; block_reason?:string
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
  bulk_import:     '#1558b0',
  update_config:   'var(--warn)',
}
const ROLE_BADGE: Record<string,{bg:string;color:string}> = {
  admin:   {bg:'#111',     color:'white'},
  auditor: {bg:'#1558b022',color:'#1558b0'},
  viewer:  {bg:'var(--surface)',color:'var(--mid)'},
}
const STATUS_BADGE: Record<string,{bg:string;color:string;label:string}> = {
  active:   {bg:'var(--ok-bg)',  color:'var(--ok)',   label:'Activo'},
  inactive: {bg:'var(--surface)',color:'var(--subtle)',label:'Inactivo'},
}

export default function UserDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const userId  = params.id as string

  const [user,     setUser]     = useState<User|null>(null)
  const [logs,     setLogs]     = useState<ActionLog[]>([])
  const [accesses, setAccesses] = useState<AccessLog[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [tab,      setTab]      = useState<'actions'|'accesses'>('actions')

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then(r => r.json())
      .then(d => {
        setUser(d.data?.user ?? null)
        setLogs(d.data?.logs ?? [])
        setAccesses(d.data?.accesses ?? [])
        setLoading(false)
      })
  }, [userId])

  const suspend = async () => {
    if (!user) return
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ status: newStatus }),
    })
    setUser(u => u ? {...u, status: newStatus} : u)
  }

  if (loading) return <div style={{padding:'40px',color:'var(--subtle)',fontSize:13}}>Cargando…</div>
  if (!user)   return <div style={{padding:'40px',color:'var(--err)',fontSize:13}}>Usuario no encontrado</div>

  const roleBadge   = ROLE_BADGE[user.role_name]   ?? ROLE_BADGE.viewer
  const statusBadge = STATUS_BADGE[user.status]    ?? STATUS_BADGE.inactive
  const initials    = user.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={{padding:'24px 28px',maxWidth:900}}>
      {/* Back */}
      <button onClick={()=>router.push('/admin/usuarios')} style={{
        display:'flex',alignItems:'center',gap:6,background:'none',border:'none',
        cursor:'pointer',color:'var(--subtle)',fontSize:12,fontFamily:'inherit',
        marginBottom:20,padding:0,
      }}>
        ← Volver a usuarios
      </button>

      {/* Ficha del usuario */}
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:24,marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          {/* Avatar */}
          <div style={{
            width:64,height:64,borderRadius:'50%',background:'var(--ink)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:22,fontWeight:600,color:'white',flexShrink:0,
          }}>
            {initials}
          </div>

          {/* Info principal */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
              <h1 style={{fontFamily:'var(--font-serif)',fontSize:22,color:'var(--ink)',margin:0}}>{user.name}</h1>
              <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:roleBadge.bg,color:roleBadge.color}}>{user.role_name}</span>
              <span style={{fontSize:11,fontWeight:500,padding:'3px 10px',borderRadius:20,background:statusBadge.bg,color:statusBadge.color}}>{statusBadge.label}</span>
            </div>
            <div style={{fontSize:13,color:'var(--subtle)',fontFamily:'var(--font-mono)'}}>{user.email}</div>
          </div>

          {/* Acción */}
          <button onClick={suspend} style={{
            background:'none',border:'1px solid var(--border)',
            padding:'8px 16px',borderRadius:'var(--r-sm)',fontSize:12,
            cursor:'pointer',fontFamily:'inherit',color:'var(--mid)',flexShrink:0,
          }}>
            {user.status==='active'?'Inactivar':'Activar'}
          </button>
        </div>

        {/* Detalles en grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginTop:20,paddingTop:20,borderTop:'1px solid var(--border2)'}}>
          {[
            {label:'Zona',          value:user.zone??'—'},
            {label:'Último acceso', value:user.last_login?new Date(user.last_login).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'},
            {label:'Miembro desde', value:new Date(user.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})},
            {label:'Acciones en log',value:String(logs.length)},
          ].map(d=>(
            <div key={d.label}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>{d.label}</div>
              <div style={{fontSize:14,color:'var(--ink)',fontWeight:500}}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:2,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:0}}>
        {([['actions','Acciones del sistema'],['accesses','Historial de accesos']] as const).map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:'8px 16px',fontSize:13,border:'none',cursor:'pointer',fontFamily:'inherit',
            background:'none',color:tab===key?'var(--ink)':'var(--subtle)',fontWeight:tab===key?500:400,
            borderBottom:`2px solid ${tab===key?'var(--ink)':'transparent'}`,
            marginBottom:-1,
          }}>{label}</button>
        ))}
      </div>

      {/* Tab: Acciones del sistema */}
      {tab==='actions'&&(
        logs.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>
            Este usuario no ha ejecutado acciones registradas.
          </div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {logs.map((log,i)=>{
              const st = log.status==='success'
                ? {bg:'var(--ok-bg)',color:'var(--ok)',label:'Exitoso'}
                : {bg:'var(--err-bg)',color:'var(--err)',label:'Fallido'}
              return (
                <div key={log.id}
                  onClick={()=>setExpanded(expanded===log.id?null:log.id)}
                  style={{borderBottom:i<logs.length-1?'1px solid var(--border2)':'none',cursor:'pointer'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=''}
                >
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px'}}>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',flexShrink:0,width:130}}>
                      <div>{new Date(log.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}</div>
                      <div>{new Date(log.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:500,color:ACTION_COLOR[log.action]??'var(--ink)'}}>
                          {ACTION_LABEL[log.action]??log.action}
                        </span>
                        {log.entity_name&&<span style={{fontSize:11,color:'var(--subtle)'}}>→ {log.entity_name}</span>}
                      </div>
                      {log.description&&<div style={{fontSize:11,color:'var(--subtle)'}}>{log.description}</div>}
                    </div>
                    <div style={{fontFamily:'var(--font-serif)',fontSize:22,color:'var(--ink)',flexShrink:0,minWidth:40,textAlign:'right'}}>
                      {log.records_affected}
                    </div>
                    <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:st.bg,color:st.color,flexShrink:0}}>{st.label}</span>
                  </div>
                  {expanded===log.id&&log.metadata&&(
                    <div style={{padding:'0 16px 12px',borderTop:'1px solid var(--border2)'}}>
                      <pre style={{fontSize:11,color:'var(--mid)',fontFamily:'var(--font-mono)',background:'var(--surface)',padding:'10px',borderRadius:'var(--r-sm)',overflow:'auto',maxHeight:120,margin:0}}>
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

      {/* Tab: Historial de accesos */}
      {tab==='accesses'&&(
        accesses.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>
            Sin historial de accesos registrado.
          </div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {accesses.map((a,i)=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderBottom:i<accesses.length-1?'1px solid var(--border2)':'none'}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',flexShrink:0,width:130}}>
                  <div>{new Date(a.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}</div>
                  <div>{new Date(a.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--ink)',marginBottom:2}}>{a.action}</div>
                  {a.ip_address&&<div style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)'}}>{a.ip_address}</div>}
                </div>
                {a.blocked&&(
                  <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:'var(--err-bg)',color:'var(--err)'}}>
                    Bloqueado{a.block_reason?`: ${a.block_reason}`:''}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}