'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FilterBar from '@/components/ui/FilterBar'

interface Finding {
  id:string; title:string; desc?:string; icon?:string; color?:string
  category?:string; severity:string; count:number; stores:string[]
}

const SEVERITY_BADGE: Record<string,{label:string;bg:string;color:string}> = {
  low:      {label:'Baja',     bg:'var(--ok-bg)',  color:'var(--ok)'},
  medium:   {label:'Media',    bg:'var(--warn-bg)',color:'var(--warn)'},
  high:     {label:'Alta',     bg:'var(--err-bg)', color:'var(--err)'},
  critical: {label:'Crítica',  bg:'#3b0000',       color:'#ff6b6b'},
}

const FILTER_FIELDS = [
  { key:'severity', label:'Severidad', type:'select' as const, options:[
    {value:'low',label:'Baja'},{value:'medium',label:'Media'},
    {value:'high',label:'Alta'},{value:'critical',label:'Crítica'},
  ]},
  { key:'category', label:'Categoría', type:'text' as const, placeholder:'Buscar categoría…' },
]

export default function HallazgosPage() {
  const router = useRouter()
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filters,  setFilters]  = useState<Record<string,string>>({severity:'',category:''})

  useEffect(()=>{
    fetch('/api/findings').then(r=>r.json()).then(d=>{setFindings(d.data??[]);setLoading(false)})
  },[])

  const handleFilter = (key:string, value:string) => setFilters(f=>({...f,[key]:value}))
  const clearFilters = () => setFilters({severity:'',category:''})

  const filtered = findings.filter(f=>
    (!filters.severity || f.severity===filters.severity)&&
    (!filters.category || f.title.toLowerCase().includes(filters.category.toLowerCase())||
      (f.category??'').toLowerCase().includes(filters.category.toLowerCase()))
  )

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={handleFilter}
        onClear={clearFilters}
        count={filtered.length}
        label="Filtros"
      />
      <div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}>
        {loading?(
          <div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>
        ):filtered.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>Sin hallazgos con los filtros actuales.</div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {filtered.map((f,i)=>{
              const b = SEVERITY_BADGE[f.severity]??SEVERITY_BADGE.medium
              return (
                <div key={f.id} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'16px',borderBottom:i<filtered.length-1?'1px solid var(--border2)':'none'}}>
                  <div style={{width:44,height:44,borderRadius:'var(--r-md)',background:(f.color??'#111')+'22',border:`1px solid ${f.color??'#111'}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {f.icon??'🔍'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                      <span style={{fontSize:14,fontWeight:500,color:'var(--ink)'}}>{f.title}</span>
                      <span style={{fontSize:11,fontWeight:600,padding:'2px 9px',borderRadius:20,background:b.bg,color:b.color}}>{b.label}</span>
                      {f.category&&<span style={{fontSize:11,color:'var(--subtle)'}}>{f.category}</span>}
                    </div>
                    {f.desc&&<div style={{fontSize:12,color:'var(--subtle)',marginBottom:8,lineHeight:1.5}}>{f.desc}</div>}
                    {f.stores?.length>0&&(
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {f.stores.map((storeId:string)=>(
                          <button
                            key={storeId}
                            onClick={()=>router.push(`/tiendas/${storeId}`)}
                            style={{
                              fontSize:11,padding:'2px 9px',borderRadius:20,
                              background:'var(--surface)',color:'var(--mid)',
                              border:'1px solid var(--border)',cursor:'pointer',
                              fontFamily:'inherit',transition:'all .15s',
                            }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='var(--ink)';(e.currentTarget as HTMLButtonElement).style.color='white'}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='var(--surface)';(e.currentTarget as HTMLButtonElement).style.color='var(--mid)'}}
                          >
                            {storeId}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:36,color:'var(--ink)',lineHeight:1,flexShrink:0}}>{f.count}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
