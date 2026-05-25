'use client'
import { useEffect, useState } from 'react'

interface TenantItem {
  id: string
  active: boolean
  custom_title?: string
  custom_weight?: number
  master_item_id: string
  master_items: {
    code: string
    title: string
    icon: string
    category: string
    plan_tier_required: string
    ai_enabled: boolean
  }
}

const TIER_BADGE: Record<string,{bg:string;color:string;label:string}> = {
  starter:      {bg:'var(--ok-bg)',   color:'var(--ok)',   label:'Starter'},
  professional: {bg:'var(--warn-bg)', color:'var(--warn)', label:'Professional'},
  enterprise:   {bg:'var(--surface)', color:'var(--mid)',  label:'Enterprise'},
}

const RESPONSE_LABELS: Record<string,string> = {
  binary:'Binario', scale_5:'Escala 1-5', scale_10:'Escala 1-10',
  numeric:'Numérico', text:'Texto', photo:'Foto'
}

export default function ItemsTenantPage() {
  const [items,    setItems]    = useState<TenantItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState<string|null>(null)
  const [filter,   setFilter]   = useState('')
  const [catFilter,setCatFilter]= useState('')
  const [showOnly, setShowOnly] = useState<'all'|'active'|'inactive'>('all')

  const load = () => {
    setLoading(true)
    fetch('/api/admin/tenant-items').then(r=>r.json()).then(d=>{setItems(d.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const toggle = async (item: TenantItem) => {
    setSaving(item.master_item_id)
    await fetch('/api/admin/tenant-items',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({master_item_id:item.master_item_id, active:!item.active}),
    })
    setSaving(null)
    load()
  }

  const updateCustom = async (item: TenantItem, field: 'custom_title'|'custom_weight', value: string) => {
    await fetch('/api/admin/tenant-items',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        master_item_id: item.master_item_id,
        [field]: field==='custom_weight' ? (parseFloat(value)||null) : (value||null),
      }),
    })
    load()
  }

  const categories = [...new Set(items.map(i=>i.master_items?.category).filter(Boolean))]
  const filtered = items.filter(i => {
    const m = i.master_items
    if (!m) return false
    if (catFilter && m.category !== catFilter) return false
    if (showOnly === 'active'   && !i.active) return false
    if (showOnly === 'inactive' &&  i.active) return false
    if (filter && !m.title.toLowerCase().includes(filter.toLowerCase()) && !m.code.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const groups   = [...new Set(filtered.map(i=>i.master_items?.category))]
  const active   = items.filter(i=>i.active).length
  const inactive = items.filter(i=>!i.active).length

  return (
    <div style={{padding:'24px 28px'}}>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Ítems habilitados',value:active,  color:'var(--ok)'},
          {label:'Ítems desactivados',value:inactive,color:'var(--subtle)'},
          {label:'Total disponibles', value:items.length,color:'var(--ink)'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'14px 16px'}}>
            <div style={{fontSize:10,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,fontWeight:600}}>{s.label}</div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:28,color:s.color,lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <input
          value={filter} onChange={e=>setFilter(e.target.value)}
          placeholder="Buscar ítem…"
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',outline:'none',width:200}}
        />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
          <option value="">Todas las categorías</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{display:'flex',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',overflow:'hidden'}}>
          {(['all','active','inactive'] as const).map(v=>(
            <button key={v} onClick={()=>setShowOnly(v)} style={{
              padding:'7px 12px',fontSize:12,border:'none',cursor:'pointer',
              fontFamily:'inherit',
              background:showOnly===v?'var(--ink)':'var(--white)',
              color:showOnly===v?'white':'var(--subtle)',
            }}>{v==='all'?'Todos':v==='active'?'Activos':'Inactivos'}</button>
          ))}
        </div>
        <span style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>{filtered.length} ítems</span>
      </div>

      {loading ? (
        <div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>
      ) : (
        groups.map(group=>(
          <div key={group} style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
              <div style={{height:1,width:12,background:'var(--border)'}}/>
              {group}
              <div style={{flex:1,height:1,background:'var(--border)'}}/>
              <span style={{fontFamily:'var(--font-mono)',fontWeight:400}}>
                {filtered.filter(i=>i.master_items?.category===group&&i.active).length}/{filtered.filter(i=>i.master_items?.category===group).length} activos
              </span>
            </div>

            <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
              {filtered.filter(i=>i.master_items?.category===group).map((item,i,arr)=>{
                const m    = item.master_items
                const tier = TIER_BADGE[m.plan_tier_required] ?? TIER_BADGE.starter
                const isSaving = saving === item.master_item_id
                return (
                  <div key={item.id} style={{
                    display:'flex',alignItems:'center',gap:14,padding:'13px 16px',
                    borderBottom:i<arr.length-1?'1px solid var(--border2)':'none',
                    opacity:item.active?1:.5,transition:'opacity .2s',
                  }}>
                    {/* Toggle */}
                    <button
                      onClick={()=>toggle(item)}
                      disabled={isSaving}
                      style={{
                        width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',
                        background:item.active?'var(--ink)':'var(--border)',
                        position:'relative',transition:'background .2s',flexShrink:0,
                      }}
                    >
                      <div style={{
                        width:16,height:16,borderRadius:'50%',background:'white',
                        position:'absolute',top:3,
                        left:item.active?'calc(100% - 19px)':3,
                        transition:'left .2s',
                      }}/>
                    </button>

                    {/* Ícono */}
                    <div style={{fontSize:20,flexShrink:0}}>{m.icon}</div>

                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',background:'var(--surface)',padding:'1px 5px',borderRadius:4,border:'1px solid var(--border)'}}>{m.code}</span>
                        <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{item.custom_title || m.title}</span>
                        {item.custom_title&&<span style={{fontSize:10,color:'var(--ink)',fontWeight:600}}>personalizado</span>}
                        {m.ai_enabled&&<span style={{fontSize:10,color:'var(--ink)',background:'var(--surface)',padding:'1px 5px',borderRadius:4,border:'1px solid var(--border)'}}>✨ IA</span>}
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:11,color:'var(--subtle)'}}>
                        <span>{m.category}</span>
                        <span>Peso: {item.custom_weight ?? 'default'}</span>
                      </div>
                    </div>

                    {/* Plan requerido */}
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 9px',borderRadius:20,background:tier.bg,color:tier.color,flexShrink:0}}>{tier.label}</span>

                    {/* Personalización */}
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <input
                        placeholder="Título personalizado"
                        defaultValue={item.custom_title??''}
                        onBlur={e=>{ if(e.target.value!==item.custom_title) updateCustom(item,'custom_title',e.target.value) }}
                        style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'5px 9px',fontSize:11,fontFamily:'inherit',outline:'none',width:160,color:'var(--ink)'}}
                      />
                      <input
                        placeholder="Peso"
                        type="number"
                        step="0.1"
                        defaultValue={item.custom_weight??''}
                        onBlur={e=>{ if(e.target.value!==(item.custom_weight?.toString()??'')) updateCustom(item,'custom_weight',e.target.value) }}
                        style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'5px 9px',fontSize:11,fontFamily:'inherit',outline:'none',width:60,color:'var(--ink)'}}
                      />
                    </div>
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
