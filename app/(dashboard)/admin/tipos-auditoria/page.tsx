'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'

interface AuditType { id:string; name:string; description?:string; icon:string; color:string; active:boolean; is_custom:boolean; template_id?:string; min_role:string }
interface Template  { id:string; name:string; description?:string; icon:string; color:string; sector?:string; subsector?:string }

const ICONS  = ['📋','🛡️','🏷️','📦','🧹','📊','🔍','✅','⚠️','🏪','📐','🚨']
const COLORS = ['#111111','#1558b0','#8b1a1a','#7a5200','#1a6b3a','#6d28d9','#0e7490','#854d0e']

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

const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:12,background:'var(--white)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--ink)':'var(--surface)',color:p?'white':'var(--mid)',border:`1px solid ${p?'var(--ink)':'var(--border)'}`,padding:'8px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})
const SEL: React.CSSProperties = {border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 10px',fontSize:12,fontFamily:'inherit',color:'var(--ink)',outline:'none',background:'var(--white)',cursor:'pointer'}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:540,boxShadow:'0 24px 64px rgba(0,0,0,.25)',maxHeight:'90vh',overflowY:'auto'}}>
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
  const [modal,      setModal]      = useState<'create'|'edit'|'blocked'|null>(null)
  const [selected,   setSelected]   = useState<AuditType|null>(null)
  const [error,      setError]      = useState('')
  const [form,       setForm]       = useState({name:'',description:'',icon:'📋',color:'#111111',template_id:'',min_role:'auditor'})
  const [blockedCount, setBlockedCount] = useState(0)
  // Filtros de plantillas
  const [tplSector,    setTplSector]    = useState('')
  const [tplSubsector, setTplSubsector] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/admin/audit-types').then(r=>r.json()).then(d=>{
      setTypes(d.data??[])
      setTemplates(d.templates??[])
      setLoading(false)
    })
  }
  useEffect(()=>{load()},[])

  const openCreate = () => {
    setForm({name:'',description:'',icon:'📋',color:'#111111',template_id:'',min_role:'auditor'})
    setTplSector(''); setTplSubsector('')
    setError(''); setModal('create')
  }
  const openEdit = (t:AuditType) => {
    setSelected(t)
    setForm({name:t.name,description:t.description??'',icon:t.icon,color:t.color,template_id:t.template_id??'',min_role:t.min_role})
    setError(''); setModal('edit')
  }

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
    const res  = await fetch(`/api/admin/audit-types/${t.id}/check`)
    const data = await res.json()
    if (data.count > 0) { setSelected(t); setBlockedCount(data.count); setModal('blocked'); return }
    if (!confirm(`¿Eliminar "${t.name}"?`)) return
    const delRes = await fetch(`/api/admin/audit-types/${t.id}`,{method:'DELETE'})
    if (!delRes.ok){const d=await delRes.json();alert(d.error??'Error');return}
    load()
  }

  // Filtrar plantillas por sector/subsector
  const filteredTemplates = templates.filter(t=>{
    if (tplSector    && t.sector    !== tplSector)    return false
    if (tplSubsector && t.subsector !== tplSubsector) return false
    return true
  })

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

      {/* Modal crear/editar */}
      {(modal==='create'||modal==='edit')&&(
        <Modal title={modal==='create'?'Nuevo tipo de auditoría':'Editar tipo'} onClose={()=>setModal(null)}>
          {modal==='create'&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>
                Basar en plantilla (opcional)
              </div>

              {/* Filtros de plantilla */}
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <select value={tplSector} onChange={e=>{setTplSector(e.target.value);setTplSubsector('');setForm(f=>({...f,template_id:''}))}} style={{...SEL,flex:1}}>
                  <option value="">Todos los sectores</option>
                  {Object.keys(SECTORS).map(s=><option key={s} value={s}>{SECTOR_LABELS[s]??s}</option>)}
                </select>
                {tplSector&&(
                  <select value={tplSubsector} onChange={e=>{setTplSubsector(e.target.value);setForm(f=>({...f,template_id:''}))}} style={{...SEL,flex:1}}>
                    <option value="">Todos los subsectores</option>
                    {SECTORS[tplSector]?.map(s=><option key={s} value={s}>{SUBSECTOR_LABELS[s]??s}</option>)}
                  </select>
                )}
              </div>

              {/* Grid de plantillas filtradas */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8,maxHeight:260,overflowY:'auto'}}>
                <button onClick={()=>setForm(f=>({...f,template_id:''}))}
                  style={{padding:'8px 12px',border:`2px solid ${!form.template_id?'var(--ink)':'var(--border)'}`,borderRadius:'var(--r-md)',background:!form.template_id?'var(--surface)':'white',cursor:'pointer',fontSize:12,color:'var(--mid)',fontFamily:'inherit'}}>
                  Sin plantilla (personalizado)
                </button>
                {filteredTemplates.map(t=>(
                  <button key={t.id} onClick={()=>setForm(f=>({...f,template_id:t.id,name:f.name||t.name,icon:t.icon,color:t.color}))}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:`2px solid ${form.template_id===t.id?'var(--ink)':'var(--border)'}`,borderRadius:'var(--r-md)',background:form.template_id===t.id?'var(--surface)':'white',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                    <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,color:'var(--ink)',fontWeight:form.template_id===t.id?600:400}}>{t.name}</div>
                      {t.sector&&<div style={{fontSize:10,color:'var(--subtle)'}}>{SECTOR_LABELS[t.sector]??t.sector}{t.subsector?` · ${SUBSECTOR_LABELS[t.subsector]??t.subsector}`:''}</div>}
                    </div>
                  </button>
                ))}
                {filteredTemplates.length===0&&(
                  <div style={{gridColumn:'1/-1',padding:'16px',textAlign:'center',color:'var(--subtle)',fontSize:12}}>
                    Sin plantillas para este filtro
                  </div>
                )}
              </div>

              {selectedTemplate&&(
                <div style={{fontSize:11,color:'var(--ok)',padding:'6px 10px',background:'var(--ok-bg)',borderRadius:'var(--r-sm)',marginBottom:4}}>
                  ✓ Se copiarán los ítems de la plantilla "{selectedTemplate.name}"
                  {selectedTemplate.sector&&<span style={{color:'var(--ok)',opacity:.7}}> — {SECTOR_LABELS[selectedTemplate.sector]??selectedTemplate.sector}</span>}
                </div>
              )}
            </div>
          )}

          <input style={INP} placeholder="Nombre del tipo *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input style={INP} placeholder="Descripción (opcional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>

          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--subtle)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>Ícono</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {ICONS.map(ic=><button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{width:40,height:40,fontSize:20,borderRadius:'var(--r-md)',border:`2px solid ${form.icon===ic?'var(--ink)':'var(--border)'}`,background:form.icon===ic?'var(--surface)':'none',cursor:'pointer'}}>{ic}</button>)}
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--subtle)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>Color</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {COLORS.map(c=><button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:32,height:32,borderRadius:'var(--r-sm)',background:c,border:`3px solid ${form.color===c?'var(--ink)':'transparent'}`,cursor:'pointer'}}/>)}
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

      {/* Modal bloqueado */}
      {modal==='blocked'&&selected&&(
        <Modal title="No se puede eliminar" onClose={()=>setModal(null)}>
          <div style={{background:'var(--err-bg)',border:'1px solid var(--err)',borderRadius:'var(--r-md)',padding:'14px 16px',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600,color:'var(--err)',marginBottom:6}}>⚠️ Tipo en uso</div>
            <div style={{fontSize:13,color:'var(--err)',lineHeight:1.6}}>
              El tipo <strong>{selected.name}</strong> está asociado a <strong>{blockedCount} auditoría{blockedCount!==1?'s':''}</strong>. No es posible eliminarlo mientras tenga auditorías registradas.
            </div>
          </div>
          <div style={{fontSize:13,color:'var(--mid)',lineHeight:1.6,marginBottom:16}}>
            Puedes desactivarlo para que no aparezca en nuevas programaciones, sin afectar el historial existente.
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cerrar</button>
            <button onClick={async()=>{await toggle(selected);setModal(null)}} style={BTN(true)}>Desactivar en su lugar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}