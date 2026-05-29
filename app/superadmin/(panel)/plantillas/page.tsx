'use client'
import { useEffect, useState } from 'react'

interface Template { id:string; name:string; description?:string; icon:string; color:string; category?:string; active:boolean; items:TemplateItem[] }
interface TemplateItem { id:string; template_id:string; master_item_id:string; section:string; order_index:number; master_items?:{code:string;title:string;icon:string;category:string} }
interface MasterItem  { id:string; code:string; title:string; icon:string; category:string }

const ICONS   = ['📋','🛡️','🏷️','📦','🧹','📊','🔍','✅','⚠️','🏪']
const COLORS  = ['#111111','#1558b0','#8b1a1a','#7a5200','#1a6b3a','#6d28d9']
const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',marginBottom:8,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:18,color:'white',fontWeight:300}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function PlantillasPage() {
  const [templates,  setTemplates]  = useState<Template[]>([])
  const [masterItems,setMasterItems]= useState<MasterItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<'create'|'edit'|'items'|null>(null)
  const [selected,   setSelected]   = useState<Template|null>(null)
  const [form,       setForm]       = useState({name:'',description:'',icon:'📋',color:'#111111',category:''})
  const [error,      setError]      = useState('')
  const [itemFilter, setItemFilter] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/superadmin/templates').then(r=>r.json()),
      fetch('/api/superadmin/master-items').then(r=>r.json()),
    ]).then(([t,m])=>{setTemplates(t.data??[]);setMasterItems(m.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement>) => setForm(p=>({...p,[k]:e.target.value}))

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

  const filteredMaster = masterItems.filter(m=>!itemFilter||m.title.toLowerCase().includes(itemFilter.toLowerCase()))

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px'}}>{templates.length} plantillas globales</div>
        <button onClick={()=>{setForm({name:'',description:'',icon:'📋',color:'#111111',category:''});setError('');setModal('create')}} style={BTN(true)}>+ Nueva plantilla</button>
      </div>

      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {templates.map(t=>(
            <div key={t.id} style={{background:'#111',border:`1px solid ${t.color}33`,borderRadius:12,padding:'18px 20px',opacity:t.active?1:.5}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:t.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{t.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:'white'}}>{t.name}</div>
                  {t.description&&<div style={{fontSize:11,color:'#555',marginTop:2}}>{t.description}</div>}
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
                <button onClick={()=>{setSelected(t);setForm({name:t.name,description:t.description??'',icon:t.icon,color:t.color,category:t.category??''});setError('');setModal('edit')}} style={{...BTN(),padding:'5px 10px'}}>Editar</button>
                <button onClick={()=>{setSelected(t);setModal('items')}} style={{...BTN(),padding:'5px 10px'}}>Gestionar ítems</button>
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
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:'#444',marginBottom:6}}>Ícono</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {ICONS.map(ic=><button key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))} style={{width:36,height:36,fontSize:18,borderRadius:8,border:`2px solid ${form.icon===ic?'white':'#2a2a2a'}`,background:'none',cursor:'pointer'}}>{ic}</button>)}
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:'#444',marginBottom:6}}>Color</div>
            <div style={{display:'flex',gap:6}}>
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
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:'#888',marginBottom:8}}>Ítems en la plantilla ({selected.items.length})</div>
            <div style={{maxHeight:180,overflowY:'auto',marginBottom:12}}>
              {selected.items.length===0&&<div style={{fontSize:12,color:'#444',padding:'12px 0'}}>Sin ítems — agrega desde la tabla maestra</div>}
              {selected.items.map(item=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #1a1a1a'}}>
                  <span style={{fontSize:16}}>{item.master_items?.icon}</span>
                  <div style={{flex:1,fontSize:12,color:'#ccc'}}>{item.master_items?.title}</div>
                  <span style={{fontSize:10,color:'#444'}}>{item.section}</span>
                  <button onClick={()=>removeItem(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:16,padding:0}}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{borderTop:'1px solid #1e1e1e',paddingTop:14}}>
            <div style={{fontSize:11,fontWeight:600,color:'#888',marginBottom:8}}>Agregar desde tabla maestra</div>
            <input value={itemFilter} onChange={e=>setItemFilter(e.target.value)} placeholder="Buscar ítem…"
              style={{...INP,marginBottom:8}}/>
            <div style={{maxHeight:200,overflowY:'auto'}}>
              {filteredMaster.filter(m=>!selected.items.find(i=>i.master_item_id===m.id)).map(m=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #1a1a1a'}}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'#ccc'}}>{m.title}</div>
                    <div style={{fontSize:10,color:'#444'}}>{m.code} · {m.category}</div>
                  </div>
                  <button onClick={()=>addItem(selected.id,m.id)} style={{...BTN(true),padding:'4px 10px',fontSize:11}}>+</button>
                </div>
              ))}
              {filteredMaster.filter(m=>!selected.items.find(i=>i.master_item_id===m.id)).length===0&&<div style={{fontSize:12,color:'#444',padding:'12px 0'}}>Todos los ítems ya están en la plantilla</div>}
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
