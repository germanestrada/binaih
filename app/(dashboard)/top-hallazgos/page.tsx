'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FilterBar from '@/components/ui/FilterBar'

interface Finding {
  id:string; title:string; desc?:string; icon?:string; color?:string
  category?:string; severity:string; count:number; stores:string[]
}

const SEVERITY_BADGE: Record<string,{label:string;bg:string;color:string}> = {
  low:      {label:'Baja',    bg:'var(--ok-bg)',  color:'var(--ok)'},
  medium:   {label:'Media',   bg:'var(--warn-bg)',color:'var(--warn)'},
  high:     {label:'Alta',    bg:'var(--err-bg)', color:'var(--err)'},
  critical: {label:'Crítica', bg:'#3b0000',       color:'#ff6b6b'},
}

const FILTER_FIELDS = [
  { key:'severity', label:'Severidad', type:'select' as const, options:[
    {value:'low',label:'Baja'},{value:'medium',label:'Media'},
    {value:'high',label:'Alta'},{value:'critical',label:'Crítica'},
  ]},
]

export default function TopHallazgosPage() {
  const router  = useRouter()
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filters,  setFilters]  = useState<Record<string,string>>({severity:''})

  useEffect(()=>{
    fetch('/api/findings').then(r=>r.json()).then(d=>{setFindings(d.data??[]);setLoading(false)})
  },[])

  const handleFilter = (key:string,value:string) => setFilters(f=>({...f,[key]:value}))

  const filtered = findings
    .filter(f=>!filters.severity||f.severity===filters.severity)
    .sort((a,b)=>b.count-a.count)
    .slice(0,10)

  const maxCount = filtered[0]?.count ?? 1

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={handleFilter}
        onClear={()=>setFilters({severity:''})}
        count={filtered.length}
        label="Filtros"
      />
      <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:16}}>
          Top hallazgos por frecuencia
        </div>
        {loading?(
          <div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>
        ):filtered.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>Sin hallazgos.</div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map((f,i)=>{
              const b    = SEVERITY_BADGE[f.severity]??SEVERITY_BADGE.medium
              const pct  = Math.round(f.count/maxCount*100)
              return (
                <div key={f.id} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px 20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
                    <div style={{fontFamily:'var(--font-serif)',fontSize:28,color:'var(--ink)',lineHeight:1,width:32,textAlign:'center',flexShrink:0}}>
                      {i+1}
                    </div>
                    <div style={{fontSize:24,flexShrink:0}}>{f.icon??'🔍'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                        <span style={{fontSize:14,fontWeight:500,color:'var(--ink)'}}>{f.title}</span>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:b.bg,color:b.color}}>{b.label}</span>
                      </div>
                      {/* Tiendas afectadas */}
                      {f.stores?.length>0&&(
                        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:4}}>
                          {f.stores.map((storeId:string)=>(
                            <button key={storeId} onClick={()=>router.push(`/tiendas/${storeId}`)} style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'var(--surface)',color:'var(--mid)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}
                              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='var(--ink)';(e.currentTarget as HTMLButtonElement).style.color='white'}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='var(--surface)';(e.currentTarget as HTMLButtonElement).style.color='var(--mid)'}}>
                              {storeId}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{fontFamily:'var(--font-serif)',fontSize:40,color:'var(--ink)',lineHeight:1,flexShrink:0}}>{f.count}</div>
                  </div>
                  {/* Barra de frecuencia */}
                  <div style={{height:6,background:'var(--border2)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'var(--ink)',borderRadius:3,transition:'width .5s ease'}}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
