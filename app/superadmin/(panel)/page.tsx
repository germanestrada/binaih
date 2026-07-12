'use client'
import { useEffect, useState } from 'react'

interface Metrics {
  totals: {
    tenants:number; activeTenants:number; trialTenants:number
    users:number; activeUsers:number; locations:number
    audits:number; auditsThisMonth:number
    aiAnalyses:number; aiSuccessRate:number
  }
  tenantBreakdown: any[]
}

function StatCard({label,value,sub,color='white'}:{label:string;value:number|string;sub?:string;color?:string}) {
  return (
    <div style={{background:'var(--white)',border:'1px solid var(--border2)',borderRadius:12,padding:'18px 20px'}}>
      <div style={{fontSize:10,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:8,fontWeight:600}}>{label}</div>
      <div style={{fontSize:32,fontWeight:300,color,lineHeight:1,fontFamily:'Georgia,serif'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'var(--mid)',marginTop:6}}>{sub}</div>}
    </div>
  )
}

export default function SuperAdminMetricsPage() {
  const [data,    setData]    = useState<Metrics|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/superadmin/metrics').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
  },[])

  if(loading) return <div style={{padding:32,color:'var(--mid)',fontSize:13}}>Cargando métricas…</div>
  if(!data)   return <div style={{padding:32,color:'var(--mid)',fontSize:13}}>Error al cargar.</div>

  const {totals,tenantBreakdown} = data

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:20}}>
        Métricas globales de la plataforma
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <StatCard label="Tenants totales"   value={totals.tenants}         sub={`${totals.activeTenants} activos · ${totals.trialTenants} trial`}/>
        <StatCard label="Usuarios"          value={totals.users}           sub={`${totals.activeUsers} activos`}/>
        <StatCard label="Locaciones"        value={totals.locations}/>
        <StatCard label="Auditorías"        value={totals.audits}          sub={`${totals.auditsThisMonth} este mes`}/>
        <StatCard label="Análisis IA"       value={totals.aiAnalyses}      sub={`${totals.aiSuccessRate}% tasa de éxito`} color={totals.aiSuccessRate>=80?'var(--accent)':totals.aiSuccessRate>=60?'var(--warn)':'var(--err)'}/>
      </div>

      {/* Tabla de tenants */}
      <div style={{fontSize:10,fontWeight:600,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:12}}>
        Uso por tenant
      </div>
      <div style={{background:'var(--white)',border:'1px solid var(--border2)',borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 80px 80px 80px 80px 80px',gap:0,padding:'10px 16px',borderBottom:'1px solid var(--border2)',fontSize:10,fontWeight:600,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1px'}}>
          {['Tenant','Estado','Usuarios','Locaciones','Auditorías','IA'].map(h=><div key={h}>{h}</div>)}
        </div>
        {tenantBreakdown.map((t:any,i:number)=>(
          <div key={t.id} style={{display:'grid',gridTemplateColumns:'2fr 80px 80px 80px 80px 80px',gap:0,padding:'12px 16px',borderBottom:i<tenantBreakdown.length-1?'1px solid var(--border2)':'none',alignItems:'center'}}>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:'white'}}>{t.name}</div>
              <div style={{fontSize:10,color:'var(--mid)',fontFamily:'monospace',marginTop:2}}>{t.id}</div>
            </div>
            <div>
              <span style={{fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:20,
                background:t.status==='active'?'rgba(74,222,128,.1)':t.status==='trial'?'rgba(250,204,21,.1)':'rgba(255,255,255,.05)',
                color:t.status==='active'?'var(--accent)':t.status==='trial'?'var(--warn)':'var(--mid)',
              }}>{t.status}</span>
            </div>
            <div style={{fontSize:13,color:'var(--subtle)'}}>{t.users}</div>
            <div style={{fontSize:13,color:'var(--subtle)'}}>{t.locs}</div>
            <div style={{fontSize:13,color:'var(--subtle)'}}>{t.audits}</div>
            <div style={{fontSize:13,color:'var(--subtle)'}}>{t.aiLogs}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
