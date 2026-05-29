'use client'
import { useEffect, useState } from 'react'

const ACTION_LABEL: Record<string,string> = {
  login:'Inicio de sesión',logout:'Cierre de sesión',
  create_tenant:'Crear tenant',update_tenant:'Editar tenant',
  totp_enabled:'Activar 2FA',impersonate:'Impersonar tenant',
}
const ACTION_COLOR: Record<string,string> = {
  login:'#4ade80',logout:'#94a3b8',create_tenant:'#60a5fa',
  update_tenant:'#facc15',totp_enabled:'#a78bfa',impersonate:'#f87171',
}

export default function LogsPage() {
  const [logs,    setLogs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/superadmin/logs').then(r=>r.json()).then(d=>{setLogs(d.data??[]);setLoading(false)})
  },[])

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:20}}>
        Log de actividad — últimas 100 acciones
      </div>
      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,overflow:'hidden'}}>
          {logs.map((log:any,i:number)=>(
            <div key={log.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderBottom:i<logs.length-1?'1px solid #161616':'none'}}>
              <div style={{fontFamily:'monospace',fontSize:10,color:'#444',whiteSpace:'nowrap',flexShrink:0}}>
                {new Date(log.created_at).toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:'white'}}>{log.tveo_admins?.name??'—'}</div>
                <div style={{fontSize:10,color:'#444',fontFamily:'monospace'}}>{log.tveo_admins?.email}</div>
              </div>
              <span style={{fontSize:11,fontWeight:500,padding:'2px 10px',borderRadius:20,background:(ACTION_COLOR[log.action]??'#555')+'22',color:ACTION_COLOR[log.action]??'#555',flexShrink:0,whiteSpace:'nowrap'}}>
                {ACTION_LABEL[log.action]??log.action}
              </span>
              {log.resource&&<span style={{fontSize:10,color:'#444',fontFamily:'monospace',flexShrink:0}}>{log.resource.slice(-8)}</span>}
            </div>
          ))}
          {logs.length===0&&<div style={{padding:'40px',textAlign:'center',color:'#444',fontSize:13}}>Sin registros</div>}
        </div>
      )}
    </div>
  )
}
