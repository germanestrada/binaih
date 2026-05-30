'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import KpiGrid from '@/components/dashboard/KpiGrid'
import GaugeCard from '@/components/dashboard/GaugeCard'
import BarChart from '@/components/dashboard/BarChart'
import StoreResultCard from '@/components/stores/StoreResultCard'

interface KpiData { cards: any[]; gauges: any[]; weeklyChart: any[] }
interface Store    { id:string; name:string; city:string; zone?:string; score:number; audits:number; findings:number; status:string }
interface Audit    { id:string; status:string; completed_at?:string; locations?:{name:string}; audit_types?:{name:string} }

export default function HomePage() {
  const router = useRouter()
  const [kpis,    setKpis]    = useState<KpiData|null>(null)
  const [stores,  setStores]  = useState<Store[]>([])
  const [audits,  setAudits]  = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    Promise.all([
      fetch('/api/kpis').then(r=>r.json()),
      fetch('/api/stores?limit=4').then(r=>r.json()),
      fetch('/api/audits?limit=5').then(r=>r.json()),
    ]).then(([k,s,a])=>{
      setKpis(k)
      setStores((s.data??[]).slice(0,4))
      setAudits((a.data??[]).slice(0,5))
      setLoading(false)
    })
  },[])

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--subtle)',fontSize:13}}>
      Cargando…
    </div>
  )

  const { cards=[], gauges=[], weeklyChart=[] } = kpis ?? {}

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
        Resumen general
      </div>

      <div id="kpi-grid"><KpiGrid cards={cards} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
        {gauges.map((g: any) => <GaugeCard key={g.label} gauge={g} />)}
        <div id="weekly-chart"><BarChart data={weeklyChart} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Locaciones recientes */}
        <div id="stores-recent" style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              Locaciones recientes
            </div>
            <button onClick={()=>router.push('/tiendas')} style={{fontSize:11,color:'var(--ink)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
              Ver todas →
            </button>
          </div>
          {(stores as any[]).length===0?(
            <div style={{padding:'24px',textAlign:'center',color:'var(--subtle)',fontSize:12}}>Sin locaciones</div>
          ):(stores as any[]).map((s:any) => <StoreResultCard key={s.id} store={s} />)}
        </div>

        {/* Auditorías recientes */}
        <div id="audits-recent" style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              Auditorías recientes
            </div>
            <button onClick={()=>router.push('/auditorias')} style={{fontSize:11,color:'var(--ink)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
              Ver todas →
            </button>
          </div>
          {audits.length===0?(
            <div style={{padding:'24px',textAlign:'center',color:'var(--subtle)',fontSize:12}}>Sin auditorías</div>
          ):audits.map((a:any,i:number)=>{
            const STATUS_COLOR: Record<string,string> = {completed:'var(--ok)',in_progress:'var(--warn)',scheduled:'var(--subtle)',cancelled:'var(--err)'}
            const STATUS_LABEL: Record<string,string> = {completed:'Completada',in_progress:'En curso',scheduled:'Programada',cancelled:'Cancelada'}
            return (
              <div key={a.id}
                onClick={()=>router.push(`/auditorias/${a.id}`)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<audits.length-1?'1px solid var(--border2)':'none',cursor:'pointer'}}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface)'}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=''}
              >
                <div style={{fontSize:18,flexShrink:0}}>{a.audit_types?.icon??'📋'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:'var(--ink)',marginBottom:2}}>{a.audit_types?.name??'Auditoría'}</div>
                  <div style={{fontSize:11,color:'var(--subtle)'}}>{a.locations?.name??'—'}</div>
                </div>
                {a.score!=null&&<div style={{fontFamily:'var(--font-serif)',fontSize:20,color:'var(--ink)',flexShrink:0}}>{a.score}</div>}
                <span style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:20,background:STATUS_COLOR[a.status]+'22',color:STATUS_COLOR[a.status],flexShrink:0}}>
                  {STATUS_LABEL[a.status]??a.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}