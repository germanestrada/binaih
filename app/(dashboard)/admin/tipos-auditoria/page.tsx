'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'

interface AuditType { id:string; name:string; description?:string; icon:string; color:string; active:boolean; is_custom:boolean; template_id?:string; min_role:string }
interface Template  { id:string; name:string; description?:string; icon:string; color:string }

const ICONS = ['📋','🛡️','🏷️','📦','🧹','📊','🔍','✅','⚠️','🏪','📐','🚨']
const COLORS = ['#111111','#1558b0','#8b1a1a','#7a5200','#1a6b3a','#6d28d9','#0e7490','#854d0e']
const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:12,background:'white'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--ink)':'var(--surface)',color:p?'white':'var(--mid)',border:`1px solid ${p?'var(--ink)':'var(--border)'}`,padding:'8px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:500,boxShadow:'0 24px 64px rgba(0,0,0,.25)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',display:'flex'}}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function TiposAuditoriaPage() {
  const router = useRouter()
  const [types,      setTypes]      = useState<AuditType[]>([])
  const [templates,  setTemplates]  = useState<Template[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<'create'|'edit'|null>(null)
  const [selected,   setSelected]   = useState<AuditType|null>(null)
  const [error,      setError]      = useState('')
  const [form,       setForm]       = useState({name:'',description:'',icon:'📋',color:'#111111',template_id:'',min_role:'auditor'})

  const load = () => { setLoading(true); fetch('/api/admin/audit-types').then(r=>r.json()).then(d=>{setTypes(d.data??[]);setTemplates(d.templates??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const openCreate = () => { setForm({name:'',description:'',icon:'📋',color:'#111111',template_id:'',min_role:'auditor'}); setError(''); setModal('create') }
  const openEdit   = (t:AuditType) => { setSelected(t); setForm({name:t.name,description:t.description??'',icon:t.icon,color:t.color,template_id:t.template_id??'',min_role:t.min_role}); setError(''); setModal('edit') }

  const save = async () => {
    setError('')
    const isCreate = modal==='create'
    const url = isCreate?'/api/admin/audit-types':`/api/admin/audit-types/${selected?.id}`
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const toggle = async (t:AuditType) => {
    await fetch(`/api/admin/audit-types/${t.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!t.active})})
    load()
  }

  const del = async (t:AuditType) => {
    if(!confirm(`¿Eliminar "${t.name}"? Solo es posible si no tiene auditorías asociadas.`))return
    const res = await fetch(`/api/admin/audit-types/${t.id}`,{method:'DELETE'})
    if(!res.ok){const d=await res.json();alert(d.error);return}
    load()
  }

  const selectedTemplate = templates.find(t=>t.id===form.template_id)

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>{types.length} tipos de auditoría</div>
        <button onClick={openCreate} style={BTN(true)}>+ Nuevo tipo</button>
      </div>

      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          {types.length===0&&<div style={{padding:'40px',textAlign:'center',color:'var(--subtle)',fontSize:13}}>Sin tipos de auditoría</div>}
          {types.map((t,i)=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderBottom:i<types.length-1?'1px solid var(--border2)':'none'}}>
              <div style={{width:40,height:40,borderRadius:'var(--r-md)',background:t.color+'22',border:`1px solid ${t.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{t.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{t.name}</div>
                  {!t.is_custom&&<span style={{fontSize:10,color:'var(--subtle)',background:'var(--surface)',padding:'1px 6px',borderRadius:4,border:'1px solid var(--border)'}}>plantilla</span>}
                </div>
                {t.description&&<div style={{fontSize:11,color:'var(--subtle)'}}>{t.description}</div>}
                <div style={{fontSize:10,color:'var(--subtle)',marginTop:2}}>Rol mínimo: {t.min_role}</div>
              </div>
              <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:t.active?'var(--ok-bg)':'var(--surface)',color:t.active?'var(--ok)':'var(--subtle)'}}>{t.active?'Activo':'Inactivo'}</span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>router.push(`/admin/tipos-auditoria/${t.id}`)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Ítems</button>
                <button onClick={()=>openEdit(t)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Editar</button>
                <button onClick={()=>toggle(t)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>{t.active?'Desactivar':'Activar'}</button>
                <button onClick={()=>del(t)} style={{background:'none',border:'1px solid var(--err-bg)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--err)',fontFamily:'inherit'}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <Modal title={modal==='create'?'Nuevo tipo de auditoría':'Editar tipo'} onClose={()=>setModal(null)}>
          {/* Plantilla (solo en creación) */}
          {modal==='create'&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Basar en plantilla (opcional)</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <button onClick={()=>setForm(f=>({...f,template_id:''}))} style={{padding:'8px 12px',border:`2px solid ${!form.template_id?'var(--ink)':'var(--border)'}`,borderRadius:'var(--r-md)',background:!form.template_id?'var(--surface)':'white',cursor:'pointer',fontSize:12,color:'var(--mid)',fontFamily:'inherit'}}>
                  Sin plantilla (personalizado)
                </button>
                {templates.map(t=>(
                  <button key={t.id} onClick={()=>setForm(f=>({...f,template_id:t.id,name:f.name||t.name,icon:t.icon,color:t.color}))} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:`2px solid ${form.template_id===t.id?'var(--ink)':'var(--border)'}`,borderRadius:'var(--r-md)',background:form.template_id===t.id?'var(--surface)':'white',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                    <span style={{fontSize:16}}>{t.icon}</span>
                    <span style={{fontSize:12,color:'var(--ink)'}}>{t.name}</span>
                  </button>
                ))}
              </div>
              {selectedTemplate&&<div style={{fontSize:11,color:'var(--ok)',padding:'6px 10px',background:'var(--ok-bg)',borderRadius:'var(--r-sm)',marginBottom:4}}>✓ Se copiarán los ítems de la plantilla "{selectedTemplate.name}"</div>}
            </div>
          )}

          <input style={INP} placeholder="Nombre del tipo *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input style={INP} placeholder="Descripción (opcional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>

          {/* Ícono */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--subtle)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>Ícono</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {ICONS.map(ic=>(
                <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{width:40,height:40,fontSize:20,borderRadius:'var(--r-md)',border:`2px solid ${form.icon===ic?'var(--ink)':'var(--border)'}`,background:form.icon===ic?'var(--surface)':'none',cursor:'pointer'}}>{ic}</button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--subtle)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>Color</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:32,height:32,borderRadius:'var(--r-sm)',background:c,border:`3px solid ${form.color===c?'var(--ink)':'transparent'}`,cursor:'pointer'}}/>
              ))}
            </div>
          </div>

          <select style={{...INP,cursor:'pointer'}} value={form.min_role} onChange={e=>setForm(f=>({...f,min_role:e.target.value}))}>
            <option value="auditor">Auditor (puede crear este tipo)</option>
            <option value="admin">Solo Admin</option>
          </select>

          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
