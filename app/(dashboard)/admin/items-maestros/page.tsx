'use client'
import { useEffect, useState } from 'react'

interface MasterItem {
  id:string; code:string; title:string; description?:string; icon:string
  category:string; response_type:string; weight_default:number
  max_score_default:number; required_default:boolean
  scale_min_label?:string; scale_max_label?:string
  ai_enabled:boolean; ai_visual_category?:string; ai_confidence_threshold:number
  plan_tier_required:string; active:boolean
}

const RESPONSE_LABELS: Record<string,string> = {binary:'Binario',scale_5:'Escala 1-5',scale_10:'Escala 1-10',numeric:'Numérico',text:'Texto',photo:'Foto'}
const TIER_BADGE: Record<string,{bg:string;color:string}> = {
  starter:      {bg:'var(--ok-bg)',   color:'var(--ok)'},
  professional: {bg:'var(--warn-bg)', color:'var(--warn)'},
  enterprise:   {bg:'var(--surface)', color:'var(--mid)'},
}

export default function ItemsMaestrosPage() {
  const [items,   setItems]   = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(()=>{
    fetch('/api/admin/master-items').then(r=>r.json()).then(d=>{setItems(d.data??[]);setLoading(false)})
  },[])

  const categories = [...new Set(items.map(i=>i.category))]
  const filtered   = items.filter(i=>
    (!catFilter||i.category===catFilter)&&
    (!filter||i.title.toLowerCase().includes(filter.toLowerCase())||i.code.toLowerCase().includes(filter.toLowerCase()))
  )
  const groups = [...new Set(filtered.map(i=>i.category))]

  return (
    <div style={{padding:'24px 28px'}}>
      {/* Header */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:20}}>
        <input
          value={filter} onChange={e=>setFilter(e.target.value)}
          placeholder="Buscar ítem…"
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',outline:'none',width:220}}
        />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
          <option value="">Todas las categorías</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>{filtered.length} ítems</span>
        <div style={{fontSize:11,padding:'6px 12px',background:'var(--warn-bg)',color:'var(--warn)',borderRadius:'var(--r-sm)',border:'1px solid var(--warn-bg)',fontWeight:500}}>
          Solo lectura — administrado por BINAIH
        </div>
      </div>

      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        groups.map(group=>(
          <div key={group} style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
              <div style={{height:1,width:12,background:'var(--border)'}}/>
              {group}
              <div style={{flex:1,height:1,background:'var(--border)'}}/>
            </div>
            <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
              {filtered.filter(i=>i.category===group).map((item,i,arr)=>{
                const tier = TIER_BADGE[item.plan_tier_required]??TIER_BADGE.starter
                return (
                  <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 16px',borderBottom:i<arr.length-1?'1px solid var(--border2)':'none'}}>
                    <div style={{fontSize:24,flexShrink:0,marginTop:2}}>{item.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',background:'var(--surface)',padding:'1px 6px',borderRadius:4,border:'1px solid var(--border)'}}>{item.code}</span>
                        <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{item.title}</span>
                        {item.required_default&&<span style={{fontSize:10,color:'var(--err)',fontWeight:600}}>requerido</span>}
                        {item.ai_enabled&&<span style={{fontSize:10,color:'var(--ink)',background:'var(--surface)',padding:'1px 5px',borderRadius:4,border:'1px solid var(--border)'}}>✨ IA · {item.ai_visual_category} · {item.ai_confidence_threshold}%</span>}
                      </div>
                      {item.description&&<div style={{fontSize:12,color:'var(--mid)',marginBottom:6,lineHeight:1.5}}>{item.description}</div>}
                      <div style={{display:'flex',gap:12,fontSize:11,color:'var(--subtle)',flexWrap:'wrap'}}>
                        <span>{RESPONSE_LABELS[item.response_type]??item.response_type}</span>
                        <span>Score máx: {item.max_score_default}</span>
                        <span>Peso: {item.weight_default}</span>
                        {item.scale_min_label&&<span>Escala: {item.scale_min_label} → {item.scale_max_label}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 9px',borderRadius:20,background:tier.bg,color:tier.color,flexShrink:0,whiteSpace:'nowrap'}}>{item.plan_tier_required}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
