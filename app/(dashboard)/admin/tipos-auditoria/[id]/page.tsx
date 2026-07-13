'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'

interface AuditTypeDetail {
  id:string; name:string; icon:string; color:string; active:boolean
  items: AuditItem[]
}
interface AuditItem {
  id:string; title:string; description?:string; section:string
  order_index:number; response_type:string; max_score:number
  weight:number; required:boolean; ai_enabled:boolean; active:boolean
  scale_min_label?:string; scale_max_label?:string
}
interface MasterItem {
  id:string; code:string; title:string; icon:string; category:string
  response_type:string; ai_enabled:boolean; sector?:string; subsector?:string
  description?:string
}

const RESPONSE_TYPES  = ['binary','scale_5','scale_10','numeric','text','photo']
const RESPONSE_LABELS: Record<string,string> = {binary:'Binario',scale_5:'Escala 1-5',scale_10:'Escala 1-10',numeric:'Numérico',text:'Texto',photo:'Foto'}

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

const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:10,background:'var(--white)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--accent)':'var(--surface)',color:p?'var(--accent-ink)':'var(--mid)',border:`1px solid ${p?'var(--accent)':'var(--border)'}`,padding:'7px 16px',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})
const SEL: React.CSSProperties = {border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 10px',fontSize:12,fontFamily:'inherit',color:'var(--ink)',outline:'none',background:'var(--white)',cursor:'pointer'}

function Modal({title,onClose,children,wide}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:wide?680:480,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.25)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',display:'flex'}}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMPTY_FORM = {title:'',description:'',section:'General',order_index:'0',response_type:'binary',max_score:'10',weight:'1.0',required:true,ai_enabled:false,scale_min_label:'',scale_max_label:''}

export default function TipoAuditoriaDetailPage() {
  const params = useParams()
  const typeId = params.id as string

  const [detail,       setDetail]       = useState<AuditTypeDetail|null>(null)
  const [masterItems,  setMasterItems]  = useState<MasterItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState<'add'|'add-master'|'edit'|null>(null)
  const [selected,     setSelected]     = useState<AuditItem|null>(null)
  const [error,        setError]        = useState('')
  const [form,         setForm]         = useState(EMPTY_FORM)
  // Filtros del modal maestro
  const [masterFilter,    setMasterFilter]    = useState('')
  const [masterSector,    setMasterSector]    = useState('')
  const [masterSubsector, setMasterSubsector] = useState('')
  const [addedIds,        setAddedIds]        = useState<Set<string>>(new Set())

  const load = useCallback(()=>{
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/audit-types/${typeId}`).then(r=>r.json()),
      fetch('/api/admin/master-items').then(r=>r.json()),
    ]).then(([d,m])=>{
      setDetail(d)
      setMasterItems(m.data??[])
      setLoading(false)
    })
  },[typeId])

  useEffect(()=>{load()},[load])

  // Actualizar set de ítems ya agregados
  useEffect(()=>{
    if(detail) setAddedIds(new Set(detail.items.map(i=>i.title)))
  },[detail])

  const f = (k:keyof typeof EMPTY_FORM) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p=>({...p,[k]:e.target.value}))

  const openAdd = () => { setForm(EMPTY_FORM); setError(''); setModal('add') }
  const openEdit = (item:AuditItem) => {
    setSelected(item)
    setForm({title:item.title,description:item.description??'',section:item.section,order_index:String(item.order_index),response_type:item.response_type,max_score:String(item.max_score),weight:String(item.weight),required:item.required,ai_enabled:item.ai_enabled,scale_min_label:item.scale_min_label??'',scale_max_label:item.scale_max_label??''})
    setError(''); setModal('edit')
  }

  const openMaster = () => {
    setMasterFilter(''); setMasterSector(''); setMasterSubsector('')
    setModal('add-master')
  }

  const addFromMaster = async (master:MasterItem) => {
    if(addedIds.has(master.title)){return} // ya agregado
    const maxOrder = Math.max(0,...(detail?.items.map(i=>i.order_index)??[]))
    const res = await fetch(`/api/admin/audit-types/${typeId}/items`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        title:master.title, description:master.description||null,
        section:'General', order_index:maxOrder+1,
        response_type:master.response_type, max_score:10, weight:1.0,
        required:true, ai_enabled:master.ai_enabled, active:true,
      }),
    })
    if(!res.ok){const d=await res.json();alert(d.error);return}
    // Actualizar localmente sin cerrar el modal
    setAddedIds(prev=>new Set([...prev, master.title]))
    setDetail(prev=>prev?{...prev,items:[...prev.items,{
      id:Date.now().toString(), title:master.title, section:'General',
      order_index:maxOrder+1, response_type:master.response_type,
      max_score:10, weight:1.0, required:true, ai_enabled:master.ai_enabled, active:true,
    }]}:prev)
  }

  const save = async () => {
    setError('')
    const isEdit = modal==='edit'
    const url = isEdit?`/api/admin/audit-types/${typeId}/items/${selected?.id}`:`/api/admin/audit-types/${typeId}/items`
    const body = {
      title:form.title, description:form.description||null, section:form.section,
      order_index:parseInt(form.order_index)||0, response_type:form.response_type,
      max_score:parseInt(form.max_score)||10, weight:parseFloat(form.weight)||1.0,
      required:form.required, ai_enabled:form.ai_enabled,
      scale_min_label:form.scale_min_label||null, scale_max_label:form.scale_max_label||null,
      active:true,
    }
    const res = await fetch(url,{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null); load()
  }

  const deleteItem = async (item:AuditItem) => {
    if(!confirm(`¿Quitar "${item.title}" del tipo de auditoría?`))return
    await fetch(`/api/admin/audit-types/${typeId}/items/${item.id}`,{method:'DELETE'})
    load()
  }

  // Filtrado inteligente del catálogo maestro
  const filteredMaster = masterItems.filter(m=>{
    if(masterSector    && m.sector    !== masterSector)    return false
    if(masterSubsector && m.subsector !== masterSubsector) return false
    if(masterFilter){
      const q = masterFilter.toLowerCase()
      return m.title.toLowerCase().includes(q) ||
             m.code.toLowerCase().includes(q)  ||
             m.category.toLowerCase().includes(q)
    }
    return true
  })

  const pendingCount  = filteredMaster.filter(m=>!addedIds.has(m.title)).length
  const addedCount    = filteredMaster.filter(m=>addedIds.has(m.title)).length
  const sections      = detail ? [...new Set(detail.items.map(i=>i.section))] : []

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--subtle)',fontSize:13}}>Cargando…</div>
  if(!detail) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--subtle)',fontSize:13}}>No encontrado.</div>

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      <PageHeader
        title={detail.icon+' '+detail.name}
        highlight=""
        meta={[{label:'Ítems',value:String(detail.items.length)}]}
        backHref="/admin/tipos-auditoria"
        backLabel="Tipos de auditoría"
      />
      <div style={{padding:'20px 24px',flex:1,overflowY:'auto'}}>
        <div style={{display:'flex',gap:10,marginBottom:20}}>
          <button onClick={openAdd} style={BTN(true)}>+ Ítem personalizado</button>
          <button onClick={openMaster} style={BTN()}>+ Desde catálogo maestro</button>
        </div>

        {sections.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>Sin ítems. Agrega uno para comenzar.</div>
        ):sections.map(section=>(
          <div key={section} style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
              <div style={{height:1,width:12,background:'var(--border)'}}/>
              {section}
              <div style={{flex:1,height:1,background:'var(--border)'}}/>
            </div>
            <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
              {detail.items.filter(i=>i.section===section).sort((a,b)=>a.order_index-b.order_index).map((item,i,arr)=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid var(--border2)':'none'}}>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',width:24,textAlign:'right'}}>{item.order_index}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{item.title}</span>
                      {item.required&&<span style={{fontSize:10,color:'var(--err)',fontWeight:600}}>requerido</span>}
                      {item.ai_enabled&&<span style={{fontSize:10,color:'var(--ink)',background:'var(--surface)',padding:'1px 5px',borderRadius:4,border:'1px solid var(--border)'}}>✨ IA</span>}
                    </div>
                    <div style={{display:'flex',gap:10,fontSize:11,color:'var(--subtle)'}}>
                      <span>{RESPONSE_LABELS[item.response_type]??item.response_type}</span>
                      <span>Score máx: {item.max_score}</span>
                      <span>Peso: {item.weight}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>openEdit(item)} style={{background:'none',border:'1px solid var(--border)',padding:'4px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Editar</button>
                    <button onClick={()=>deleteItem(item)} style={{background:'none',border:'1px solid var(--err-bg)',padding:'4px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--err)',fontFamily:'inherit'}}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal ítem personalizado / editar */}
      {(modal==='add'||modal==='edit')&&(
        <Modal title={modal==='add'?'Nuevo ítem':'Editar ítem'} onClose={()=>setModal(null)}>
          <input style={INP} placeholder="Título del ítem *" value={form.title} onChange={f('title')}/>
          <input style={INP} placeholder="Descripción (opcional)" value={form.description} onChange={f('description')}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <input style={{...INP,marginBottom:0}} placeholder="Sección" value={form.section} onChange={f('section')}/>
            <input style={{...INP,marginBottom:0}} placeholder="Orden" type="number" value={form.order_index} onChange={f('order_index')}/>
          </div>
          <div style={{height:10}}/>
          <select style={{...INP,cursor:'pointer'}} value={form.response_type} onChange={f('response_type')}>
            {RESPONSE_TYPES.map(r=><option key={r} value={r}>{RESPONSE_LABELS[r]}</option>)}
          </select>
          {(form.response_type==='scale_5'||form.response_type==='scale_10')&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input style={{...INP,marginBottom:0}} placeholder="Etiqueta mínimo" value={form.scale_min_label} onChange={f('scale_min_label')}/>
              <input style={{...INP,marginBottom:0}} placeholder="Etiqueta máximo" value={form.scale_max_label} onChange={f('scale_max_label')}/>
            </div>
          )}
          <div style={{height:10}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <input style={{...INP,marginBottom:0}} placeholder="Score máx" type="number" value={form.max_score} onChange={f('max_score')}/>
            <input style={{...INP,marginBottom:0}} placeholder="Peso" type="number" step="0.1" value={form.weight} onChange={f('weight')}/>
          </div>
          <div style={{height:10}}/>
          <div style={{display:'flex',gap:16,marginBottom:12}}>
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--mid)',cursor:'pointer'}}>
              <input type="checkbox" checked={form.required} onChange={e=>setForm(p=>({...p,required:e.target.checked}))}/>
              Requerido
            </label>
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--mid)',cursor:'pointer'}}>
              <input type="checkbox" checked={form.ai_enabled} onChange={e=>setForm(p=>({...p,ai_enabled:e.target.checked}))}/>
              ✨ Habilitado para IA
            </label>
          </div>
          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* Modal: catálogo maestro con búsqueda inteligente */}
      {modal==='add-master'&&(
        <Modal title="Agregar desde catálogo maestro" onClose={()=>{setModal(null);load()}} wide>
          {/* Filtros */}
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            <input
              placeholder="Buscar por nombre o código…"
              value={masterFilter} onChange={e=>setMasterFilter(e.target.value)}
              style={{...SEL,flex:1,minWidth:160,padding:'7px 12px'}}
            />
            <select value={masterSector} onChange={e=>{setMasterSector(e.target.value);setMasterSubsector('')}} style={SEL}>
              <option value="">Todos los sectores</option>
              {Object.keys(SECTORS).map(s=><option key={s} value={s}>{SECTOR_LABELS[s]??s}</option>)}
            </select>
            {masterSector&&(
              <select value={masterSubsector} onChange={e=>setMasterSubsector(e.target.value)} style={SEL}>
                <option value="">Todos los subsectores</option>
                {SECTORS[masterSector]?.map(s=><option key={s} value={s}>{SUBSECTOR_LABELS[s]??s}</option>)}
              </select>
            )}
          </div>

          {/* Contador */}
          <div style={{display:'flex',gap:12,marginBottom:10,fontSize:11,color:'var(--subtle)'}}>
            <span>{pendingCount} disponibles</span>
            {addedCount>0&&<span style={{color:'var(--ok)'}}>✓ {addedCount} ya agregados</span>}
            <span style={{marginLeft:'auto'}}>{filteredMaster.length} en total</span>
          </div>

          {/* Lista */}
          <div style={{maxHeight:440,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
            {filteredMaster.length===0?(
              <div style={{padding:'32px',textAlign:'center',color:'var(--subtle)',fontSize:12}}>Sin resultados — prueba con otro filtro</div>
            ):filteredMaster.map((m,i)=>{
              const alreadyAdded = addedIds.has(m.title)
              return (
                <div key={m.id} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                  borderBottom:i<filteredMaster.length-1?'1px solid var(--border2)':'none',
                  background:alreadyAdded?'var(--ok-bg)':'white',
                  opacity:alreadyAdded?.7:1,
                }}>
                  <div style={{fontSize:18,flexShrink:0}}>{m.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2,flexWrap:'wrap'}}>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',background:'var(--surface)',padding:'1px 5px',borderRadius:3}}>{m.code}</span>
                      <span style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>{m.title}</span>
                      {m.ai_enabled&&<span style={{fontSize:10,color:'#7c3aed',background:'#f5f3ff',padding:'1px 5px',borderRadius:3}}>✨ IA</span>}
                    </div>
                    <div style={{fontSize:10,color:'var(--subtle)',display:'flex',gap:8}}>
                      <span>{RESPONSE_LABELS[m.response_type]??m.response_type}</span>
                      {m.sector&&<span style={{color:'#6366f1'}}>{SECTOR_LABELS[m.sector]??m.sector}{m.subsector?` · ${SUBSECTOR_LABELS[m.subsector]??m.subsector}`:''}</span>}
                    </div>
                  </div>
                  {alreadyAdded?(
                    <span style={{fontSize:11,color:'var(--ok)',fontWeight:600,flexShrink:0}}>✓ Agregado</span>
                  ):(
                    <button onClick={()=>addFromMaster(m)} style={{background:'var(--accent)',color:'var(--accent-ink)',border:'none',padding:'5px 12px',borderRadius:'var(--r-sm)',fontSize:11,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                      + Agregar
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
            <button onClick={()=>{setModal(null);load()}} style={BTN(true)}>Listo</button>
          </div>
        </Modal>
      )}
    </div>
  )
}