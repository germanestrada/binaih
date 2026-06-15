'use client'
import { useEffect, useState } from 'react'

interface Template { id:string; name:string; description?:string; icon:string; color:string; category?:string; sector?:string; subsector?:string; active:boolean; items:TemplateItem[] }
interface TemplateItem { id:string; template_id:string; master_item_id:string; section:string; order_index:number; master_items?:{code:string;title:string;icon:string;category:string} }
interface MasterItem  { id:string; code:string; title:string; icon:string; category:string; sector?:string; subsector?:string }

const ICONS   = ['📋','🛡️','🏷️','📦','🧹','📊','🔍','✅','⚠️','🏪','🏥','💊','🔬','🚛','🏭']
const COLORS  = ['#111111','#1558b0','#8b1a1a','#7a5200','#1a6b3a','#6d28d9','#0e7490','#854d0e','#dc2626','#059669']

const SECTORS: Record<string,string[]> = {
  'retail':    ['alimentos','moda_textil','electrodomesticos','general'],
  'salud':     ['clinicas_hospitales','farmacias_droguerias','consultorios_medicos','laboratorios_clinicos','comun'],
  'logistica': ['bodegas','centros_distribucion','transporte'],
  'general':   ['comun'],
}
const SECTOR_LABELS: Record<string,string> = {
  retail:'Retail', salud:'Salud', logistica:'Logística', general:'General',
}
const SUBSECTOR_LABELS: Record<string,string> = {
  alimentos:'Alimentos', moda_textil:'Moda y textil', electrodomesticos:'Electrodomésticos',
  clinicas_hospitales:'Clínicas y hospitales', farmacias_droguerias:'Farmacias y droguerías',
  consultorios_medicos:'Consultorios médicos', laboratorios_clinicos:'Laboratorios clínicos',
  bodegas:'Bodegas', centros_distribucion:'Centros de distribución', transporte:'Transporte',
  comun:'Común (todos)', general:'General',
}

const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',marginBottom:8,background:'rgba(255,255,255,.04)'}
const SEL: React.CSSProperties = {border:'1px solid #2a2a2a',borderRadius:8,padding:'7px 10px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',background:'#111',cursor:'pointer'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:18,color:'white',fontWeight:300}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMPTY_FORM = {name:'',description:'',icon:'📋',color:'#111111',category:'',sector:'',subsector:''}

export default function PlantillasPage() {
  const [templates,   setTemplates]   = useState<Template[]>([])
  const [masterItems, setMasterItems] = useState<MasterItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState<'create'|'edit'|'items'|null>(null)
  const [selected,    setSelected]    = useState<Template|null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [error,       setError]       = useState('')
  // Filtros lista principal
  const [filterSector,    setFilterSector]    = useState('')
  const [filterSubsector, setFilterSubsector] = useState('')
  // Filtros modal ítems
  const [itemFilter,         setItemFilter]         = useState('')
  const [itemSectorFilter,   setItemSectorFilter]   = useState('')
  const [itemSubsectorFilter,setItemSubsectorFilter]= useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/superadmin/templates').then(r=>r.json()),
      fetch('/api/superadmin/master-items').then(r=>r.json()),
    ]).then(([t,m])=>{setTemplates(t.data??[]);setMasterItems(m.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p=>({...p,[k]:e.target.value}))

  const save = async () => {
    setError('')
    const isEdit = modal==='edit'
    const method = isEdit?'PATCH':'POST'
    const body   = isEdit?{id:selected?.id,...form}:form
    const res    = await fetch('/api/superadmin/templates',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data   = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const del = async (t:Template) => {
    if(!confirm(`¿Eliminar "${t.name}"? Se eliminarán también sus ítems.`))return
    await fetch('/api/superadmin/templates',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:t.id})})
    load()
  }

  const addItem = async (templateId:string, masterItemId:string) => {
    await fetch('/api/superadmin/templates/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template_id:templateId,master_item_id:masterItemId})})
    load()
  }

  const removeItem = async (itemId:string) => {
    await fetch('/api/superadmin/templates/items',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:itemId})})
    load()
  }

  // Filtrar plantillas en lista principal
  const filteredTemplates = templates.filter(t=>{
    if (filterSector    && t.sector    !== filterSector)    return false
    if (filterSubsector && t.subsector !== filterSubsector) return false
    return true
  })

  // Filtrar ítems maestros en modal
  const filteredMaster = masterItems.filter(m=>{
    if (itemSectorFilter    && m.sector    !== itemSectorFilter)    return false
    if (itemSubsectorFilter && m.subsector !== itemSubsectorFilter) return false
    if (itemFilter && !m.title.toLowerCase().includes(itemFilter.toLowerCase()) && !m.code.toLowerCase().includes(itemFilter.toLowerCase())) return false
    return true
  })

  const openEdit = (t:Template) => {
    setSelected(t)
    setForm({name:t.name,description:t.description??'',icon:t.icon,color:t.color,category:t.category??'',sector:t.sector??'',subsector:t.subsector??''})
    setError(''); setModal('edit')
  }

  const openItems = (t:Template) => {
    setSelected(t)
    setItemFilter(''); setItemSectorFilter(''); setItemSubsectorFilter('')
    setModal('items')
  }

  return (
    <div style={{padding:'28px 32px'}}>
      {/* Header */}
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
        <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px',marginRight:'auto'}}>
          {filteredTemplates.length} de {templates.length} plantillas
        </div>
        {/* Filtros */}
        <select value={filterSector} onChange={e=>{setFilterSector(e.target.value);setFilterSubsector('')}} style={SEL}>
          <option value="">Todos los sectores</option>
          {Object.keys(SECTORS).map(s=><option key={s} value={s}>{SECTOR_LABELS[s]??s}</option>)}
        </select>
        {filterSector&&(
          <select value={filterSubsector} onChange={e=>setFilterSubsector(e.target.value)} style={SEL}>
            <option value="">Todos los subsectores</option>
            {SECTORS[filterSector]?.map(s=><option key={s} value={s}>{SUBSECTOR_LABELS[s]??s}</option>)}
          </select>
        )}
        <button onClick={()=>{setForm(EMPTY_FORM);setError('');setModal('create')}} style={BTN(true)}>+ Nueva plantilla</button>
      </div>

      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {filteredTemplates.length===0&&(
            <div style={{gridColumn:'1/-1',padding:'40px',textAlign:'center',color:'#444',fontSize:13}}>Sin plantillas para este filtro</div>
          )}
          {filteredTemplates.map(t=>(
            <div key={t.id} style={{background:'#111',border:`1px solid ${t.color}33`,borderRadius:12,padding:'18px 20px',opacity:t.active?1:.5}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:t.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{t.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:'white'}}>{t.name}</div>
                  {t.description&&<div style={{fontSize:11,color:'#555',marginTop:2}}>{t.description}</div>}
                  {(t.sector||t.subsector)&&(
                    <div style={{fontSize:10,color:'#6366f1',marginTop:2}}>
                      {t.sector?SECTOR_LABELS[t.sector]??t.sector:''}{t.subsector?` · ${SUBSECTOR_LABELS[t.subsector]??t.subsector}`:''}
                    </div>
                  )}
                </div>
              </div>
              <div style={{fontSize:11,color:'#444',marginBottom:12}}>{t.items.length} ítems · {t.category||'sin categoría'}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                {t.items.slice(0,4).map(i=>(
                  <span key={i.id} style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(255,255,255,.06)',color:'#666'}}>{i.master_items?.icon} {i.master_items?.title?.slice(0,20)}</span>
                ))}
                {t.items.length>4&&<span style={{fontSize:10,color:'#444'}}>+{t.items.length-4} más</span>}
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>openEdit(t)} style={{...BTN(),padding:'5px 10px'}}>Editar</button>
                <button onClick={()=>openItems(t)} style={{...BTN(),padding:'5px 10px'}}>Gestionar ítems</button>
                <button onClick={()=>del(t)} style={{background:'none',border:'1px solid rgba(248,113,113,.3)',padding:'5px 10px',borderRadius:8,cursor:'pointer',fontSize:11,color:'#f87171',fontFamily:'inherit'}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {(modal==='create'||modal==='edit')&&(
        <Modal title={modal==='create'?'Nueva plantilla':'Editar plantilla'} onClose={()=>setModal(null)}>
          <input style={INP} placeholder="Nombre *" value={form.name} onChange={f('name')}/>
          <input style={INP} placeholder="Descripción" value={form.description} onChange={f('description')}/>
          <input style={INP} placeholder="Categoría" value={form.category} onChange={f('category')}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:'#555',marginBottom:4}}>Sector</div>
              <select style={{...INP,marginBottom:0,cursor:'pointer'}} value={form.sector}
                onChange={e=>{setForm(p=>({...p,sector:e.target.value,subsector:SECTORS[e.target.value]?.[0]??''}))}}>
                <option value="">Sin sector</option>
                {Object.keys(SECTORS).map(s=><option key={s} value={s}>{SECTOR_LABELS[s]??s}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'#555',marginBottom:4}}>Subsector</div>
              <select style={{...INP,marginBottom:0,cursor:'pointer'}} value={form.subsector} onChange={f('subsector')}>
                <option value="">Sin subsector</option>
                {(SECTORS[form.sector]??[]).map(s=><option key={s} value={s}>{SUBSECTOR_LABELS[s]??s}</option>)}
              </select>
            </div>
          </div>
          <div style={{height:4}}/>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:'#444',marginBottom:6}}>Ícono</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {ICONS.map(ic=><button key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))} style={{width:36,height:36,fontSize:18,borderRadius:8,border:`2px solid ${form.icon===ic?'white':'#2a2a2a'}`,background:'none',cursor:'pointer'}}>{ic}</button>)}
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:'#444',marginBottom:6}}>Color</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {COLORS.map(c=><button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:28,height:28,borderRadius:6,background:c,border:`3px solid ${form.color===c?'white':'transparent'}`,cursor:'pointer'}}/>)}
            </div>
          </div>
          {error&&<div style={{fontSize:12,color:'#f87171',marginBottom:10}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* Modal gestión de ítems */}
      {modal==='items'&&selected&&(
        <Modal title={`Ítems — ${selected.name}`} onClose={()=>setModal(null)}>
          {/* Ítems actuales */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:'#888',marginBottom:8}}>En la plantilla ({selected.items.length})</div>
            <div style={{maxHeight:160,overflowY:'auto',marginBottom:4}}>
              {selected.items.length===0&&<div style={{fontSize:12,color:'#444',padding:'12px 0'}}>Sin ítems — agrega desde el catálogo maestro</div>}
              {selected.items.map(item=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #1a1a1a'}}>
                  <span style={{fontSize:16}}>{item.master_items?.icon}</span>
                  <div style={{flex:1,fontSize:12,color:'#ccc',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.master_items?.title}</div>
                  <span style={{fontSize:10,color:'#444',flexShrink:0}}>{item.section}</span>
                  <button onClick={()=>removeItem(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:16,padding:0,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Agregar desde catálogo */}
          <div style={{borderTop:'1px solid #1e1e1e',paddingTop:14}}>
            <div style={{fontSize:11,fontWeight:600,color:'#888',marginBottom:8}}>Agregar desde catálogo maestro</div>
            {/* Filtros */}
            <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
              <input value={itemFilter} onChange={e=>setItemFilter(e.target.value)} placeholder="Buscar…"
                style={{...INP,marginBottom:0,flex:1,minWidth:120}}/>
              <select value={itemSectorFilter} onChange={e=>{setItemSectorFilter(e.target.value);setItemSubsectorFilter('')}}
                style={{...SEL,fontSize:11}}>
                <option value="">Sector</option>
                {Object.keys(SECTORS).map(s=><option key={s} value={s}>{SECTOR_LABELS[s]??s}</option>)}
              </select>
              {itemSectorFilter&&(
                <select value={itemSubsectorFilter} onChange={e=>setItemSubsectorFilter(e.target.value)}
                  style={{...SEL,fontSize:11}}>
                  <option value="">Subsector</option>
                  {SECTORS[itemSectorFilter]?.map(s=><option key={s} value={s}>{SUBSECTOR_LABELS[s]??s}</option>)}
                </select>
              )}
            </div>
            <div style={{maxHeight:220,overflowY:'auto'}}>
              {filteredMaster.filter(m=>!selected.items.find(i=>i.master_item_id===m.id)).map(m=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #1a1a1a'}}>
                  <span style={{fontSize:16,flexShrink:0}}>{m.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:'#ccc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title}</div>
                    <div style={{fontSize:10,color:'#444'}}>{m.code}
                      {m.sector&&<span style={{color:'#6366f1',marginLeft:6}}>{SECTOR_LABELS[m.sector]??m.sector}{m.subsector?` · ${SUBSECTOR_LABELS[m.subsector]??m.subsector}`:''}</span>}
                    </div>
                  </div>
                  <button onClick={()=>addItem(selected.id,m.id)} style={{...BTN(true),padding:'4px 10px',fontSize:11,flexShrink:0}}>+</button>
                </div>
              ))}
              {filteredMaster.filter(m=>!selected.items.find(i=>i.master_item_id===m.id)).length===0&&(
                <div style={{fontSize:12,color:'#444',padding:'12px 0'}}>Todos los ítems ya están en la plantilla o no hay resultados</div>
              )}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}>
            <button onClick={()=>{setModal(null);load()}} style={BTN(true)}>Listo</button>
          </div>
        </Modal>
      )}
    </div>
  )
}