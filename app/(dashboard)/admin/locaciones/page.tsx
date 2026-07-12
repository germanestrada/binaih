'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

interface Loc { id:string; name:string; city:string; zone?:string; status:string; current_score?:number; manager_name?:string; type_id?:string }
interface LocType { id:string; name:string; icon:string }
interface AuditCount { total:number; completed:number; location:{id:string;name:string}|null }

const ZONES = ['Norte','Sur','Oriente','Occidente','Centro']
const STATUS_OPTS = ['active','inactive','critical','closed']
const STATUS_BADGE: Record<string,{label:string;bg:string;color:string}> = {
  active:   {label:'Activa',  bg:'var(--ok-bg)',  color:'var(--ok)'},
  critical: {label:'Crítica', bg:'var(--err-bg)', color:'var(--err)'},
  inactive: {label:'Inactiva',bg:'var(--surface)',color:'var(--subtle)'},
  closed:   {label:'Cerrada', bg:'var(--surface)',color:'var(--subtle)'},
}
const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:12,background:'var(--white)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--ink)':'var(--surface)',color:p?'white':'var(--mid)',border:`1px solid ${p?'var(--ink)':'var(--border)'}`,padding:'9px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:480,boxShadow:'0 24px 64px rgba(0,0,0,.25)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',display:'flex'}}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMPTY = {name:'',type_id:'',address:'',city:'',zone:'',lat:'',lng:'',manager_name:'',manager_phone:'',area_sqm:'',status:'active',notes:''}

export default function LocacionesAdminPage() {
  const [locs,     setLocs]     = useState<Loc[]>([])
  const [types,    setTypes]    = useState<LocType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'create'|'edit'|'delete'|'bulk-delete'|null>(null)
  const [selected, setSelected] = useState<Loc|null>(null)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState<typeof EMPTY>(EMPTY)
  // Estado para eliminación
  const [auditCount,   setAuditCount]   = useState<AuditCount|null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [delConfirm,   setDelConfirm]   = useState('')
  const [deleting,     setDeleting]     = useState(false)
  const [backupReady,  setBackupReady]  = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/locations').then(r=>r.json()),
      fetch('/api/admin/location-types').then(r=>r.json()),
    ]).then(([l,t])=>{setLocs(l.data??[]);setTypes(t.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const openCreate = () => { setForm(EMPTY); setError(''); setModal('create') }
  const openEdit   = (l:Loc) => {
    setSelected(l)
    setForm({...EMPTY,name:l.name,type_id:l.type_id??'',city:l.city,zone:l.zone??'',status:l.status,manager_name:l.manager_name??''})
    setError(''); setModal('edit')
  }

  const f = (k:keyof typeof EMPTY) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(p=>({...p,[k]:e.target.value}))

  const save = async () => {
    setError('')
    const isCreate = modal==='create'
    const url  = isCreate?'/api/admin/locations':`/api/admin/locations/${selected?.id}`
    const body: Record<string,string|number|null> = {
      name:form.name, type_id:form.type_id||null, address:form.address||null,
      city:form.city, zone:form.zone||null, status:form.status,
      manager_name:form.manager_name||null, manager_phone:form.manager_phone||null,
      area_sqm:form.area_sqm?parseInt(form.area_sqm):null,
      lat:form.lat?parseFloat(form.lat):null, lng:form.lng?parseFloat(form.lng):null,
      notes:form.notes||null,
    }
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  // ── Eliminar locación ──────────────────────────────────────
  const openDelete = async (l:Loc) => {
    setSelected(l)
    setAuditCount(null)
    setLoadingCount(true)
    setModal('delete')
    const res  = await fetch(`/api/admin/locations/${l.id}/audits`)
    const data = await res.json() as AuditCount
    setAuditCount(data)
    setLoadingCount(false)
  }

  const confirmDelete = async () => {
    if (!selected) return
    setDeleting(true)
    const res  = await fetch(`/api/admin/locations/${selected.id}`,{method:'DELETE'})
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) {
      setError(data.message ?? data.error ?? 'Error al eliminar')
      return
    }
    setModal(null); load()
  }

  // ── Borrado masivo de auditorías ──────────────────────────
  const openBulkDelete = async (l:Loc) => {
    setSelected(l)
    setAuditCount(null)
    setDelConfirm('')
    setBackupReady(false)
    setError('')
    setLoadingCount(true)
    setModal('bulk-delete')
    const res  = await fetch(`/api/admin/locations/${l.id}/audits`)
    const data = await res.json() as AuditCount
    setAuditCount(data)
    setLoadingCount(false)
  }

  const downloadBackup = async () => {
    if (!selected) return
    // Descargar CSV de respaldo antes de eliminar
    const res  = await fetch(`/api/admin/export?type=audits&location_id=${selected.id}`)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `respaldo-auditorias-${selected.name.replace(/\s+/g,'-')}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setBackupReady(true)
  }

  const confirmBulkDelete = async () => {
    if (!selected || delConfirm !== 'ELIMINAR') return
    setDeleting(true)
    const res  = await fetch(`/api/admin/locations/${selected.id}/audits`,{
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({confirmed:true, locationName:selected.name}),
    })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { setError(data.error??'Error'); return }
    setModal(null)
    load()
    alert(`✅ ${data.deleted} auditorías eliminadas correctamente.`)
  }

  const changeStatus = async (l:Loc, status:string) => {
    await fetch(`/api/admin/locations/${l.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})})
    load()
  }

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>{locs.length} locaciones</div>
        <button onClick={openCreate} style={BTN(true)}>+ Nueva locación</button>
      </div>

      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          {locs.length===0&&<div style={{padding:'40px',textAlign:'center',color:'var(--subtle)',fontSize:13}}>Sin locaciones</div>}
          {locs.map((l,i)=>{
            const b    = STATUS_BADGE[l.status]??STATUS_BADGE.inactive
            const type = types.find(t=>t.id===l.type_id)
            return (
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderBottom:i<locs.length-1?'1px solid var(--border2)':'none'}}>
                {type&&<div style={{fontSize:18,flexShrink:0}}>{type.icon}</div>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{l.name}</div>
                  <div style={{fontSize:11,color:'var(--subtle)'}}>{l.city}{l.zone?` · ${l.zone}`:''}</div>
                </div>
                {l.current_score!=null&&<div style={{fontFamily:'var(--font-serif)',fontSize:20,color:'var(--ink)',flexShrink:0}}>{l.current_score}</div>}
                <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:b.bg,color:b.color,flexShrink:0}}>{b.label}</span>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>openEdit(l)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Editar</button>
                  <select value={l.status} onChange={e=>changeStatus(l,e.target.value)} style={{border:'1px solid var(--border)',padding:'5px 8px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit',background:'none'}}>
                    {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>openBulkDelete(l)} style={{background:'none',border:'1px solid var(--warn-bg)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--warn)',fontFamily:'inherit'}}>Eliminar Auditorías</button>
                  <button onClick={()=>openDelete(l)} style={{background:'none',border:'1px solid var(--err-bg)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--err)',fontFamily:'inherit'}}>Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal editar/crear */}
      {(modal==='create'||modal==='edit')&&(
        <Modal title={modal==='create'?'Nueva locación':'Editar locación'} onClose={()=>setModal(null)}>
          <input style={INP} placeholder="Nombre *" value={form.name} onChange={f('name')}/>
          <input style={INP} placeholder="Ciudad *" value={form.city} onChange={f('city')}/>
          <select style={{...INP,cursor:'pointer'}} value={form.type_id} onChange={f('type_id')}>
            <option value="">Sin tipo</option>
            {types.map(t=><option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
          </select>
          <select style={{...INP,cursor:'pointer'}} value={form.zone} onChange={f('zone')}>
            <option value="">Sin zona</option>
            {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
          <input style={INP} placeholder="Dirección" value={form.address} onChange={f('address')}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <input style={{...INP,marginBottom:0}} placeholder="Latitud" value={form.lat} onChange={f('lat')}/>
            <input style={{...INP,marginBottom:0}} placeholder="Longitud" value={form.lng} onChange={f('lng')}/>
          </div>
          <div style={{height:12}}/>
          <input style={INP} placeholder="Gerente" value={form.manager_name} onChange={f('manager_name')}/>
          <input style={INP} placeholder="Teléfono gerente" value={form.manager_phone} onChange={f('manager_phone')}/>
          <input style={INP} placeholder="Área m²" type="number" value={form.area_sqm} onChange={f('area_sqm')}/>
          <select style={{...INP,cursor:'pointer'}} value={form.status} onChange={f('status')}>
            {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <textarea style={{...INP,minHeight:72,resize:'vertical'}} placeholder="Notas" value={form.notes} onChange={f('notes')}/>
          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* Modal eliminar locación */}
      {modal==='delete'&&selected&&(
        <Modal title="Eliminar locación" onClose={()=>setModal(null)}>
          {loadingCount?(
            <div style={{color:'var(--subtle)',fontSize:13,padding:'20px 0'}}>Verificando auditorías…</div>
          ):auditCount&&auditCount.total>0?(
            <div>
              <div style={{background:'var(--err-bg)',border:'1px solid var(--err)',borderRadius:'var(--r-md)',padding:'14px 16px',marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--err)',marginBottom:6}}>⚠️ No se puede eliminar</div>
                <div style={{fontSize:13,color:'var(--err)',lineHeight:1.6}}>
                  <strong>{selected.name}</strong> tiene <strong>{auditCount.total} auditoría{auditCount.total!==1?'s':''}</strong> asociada{auditCount.total!==1?'s':''}, de las cuales <strong>{auditCount.completed} están completadas</strong>.
                </div>
              </div>
              <div style={{fontSize:13,color:'var(--mid)',lineHeight:1.6,marginBottom:16}}>
                Para eliminar esta locación debes primero eliminar todas sus auditorías usando el botón <strong>"Auditorías"</strong> en la lista.
              </div>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button onClick={()=>setModal(null)} style={BTN(true)}>Entendido</button>
              </div>
            </div>
          ):(
            <div>
              <div style={{fontSize:13,color:'var(--mid)',lineHeight:1.6,marginBottom:20}}>
                ¿Estás seguro que deseas eliminar <strong>{selected.name}</strong>? Esta acción no se puede deshacer.
              </div>
              {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12,padding:'8px 12px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
                <button onClick={confirmDelete} disabled={deleting} style={{...BTN(true),background:'var(--err)',borderColor:'var(--err)'}}>
                  {deleting?'Eliminando…':'Eliminar locación'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal borrado masivo de auditorías */}
      {modal==='bulk-delete'&&selected&&(
        <Modal title="Eliminar auditorías" onClose={()=>setModal(null)}>
          {loadingCount?(
            <div style={{color:'var(--subtle)',fontSize:13,padding:'20px 0'}}>Contando auditorías…</div>
          ):(
            <div>
              {/* Advertencia */}
              <div style={{background:'#fffbeb',border:'1px solid #f59e0b',borderRadius:'var(--r-md)',padding:'14px 16px',marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:600,color:'#92400e',marginBottom:6}}>⚠️ Acción irreversible</div>
                <div style={{fontSize:13,color:'#92400e',lineHeight:1.6}}>
                  Estás a punto de eliminar <strong>{auditCount?.total ?? 0} auditoría{(auditCount?.total??0)!==1?'s':''}</strong> ({auditCount?.completed ?? 0} completadas) de <strong>{selected.name}</strong>.
                  Esta acción <strong>no se puede deshacer</strong>. Se eliminarán también todos los hallazgos, resultados y logs de IA asociados.
                </div>
              </div>

              {/* Paso 1: Respaldo */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--ink)',marginBottom:8}}>Paso 1 — Descarga un respaldo antes de continuar</div>
                <button onClick={downloadBackup} style={{
                  display:'flex',alignItems:'center',gap:8,
                  background:backupReady?'var(--ok-bg)':'var(--surface)',
                  border:`1px solid ${backupReady?'var(--ok)':'var(--border)'}`,
                  color:backupReady?'var(--ok)':'var(--mid)',
                  padding:'9px 16px',borderRadius:'var(--r-sm)',fontSize:13,
                  cursor:'pointer',fontFamily:'inherit',width:'100%',justifyContent:'center',
                }}>
                  <Icon name="export" size={14} color="currentColor"/>
                  {backupReady?'✓ Respaldo descargado':'Descargar respaldo CSV'}
                </button>
              </div>

              {/* Paso 2: Confirmación */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--ink)',marginBottom:8}}>
                  Paso 2 — Escribe <strong style={{color:'var(--err)'}}>ELIMINAR</strong> para confirmar
                </div>
                <input
                  value={delConfirm}
                  onChange={e=>setDelConfirm(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  style={{...INP,marginBottom:0,borderColor:delConfirm==='ELIMINAR'?'var(--err)':'var(--border)'}}
                />
              </div>

              {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12,padding:'8px 12px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={delConfirm!=='ELIMINAR'||deleting}
                  style={{
                    ...BTN(true),
                    background:delConfirm==='ELIMINAR'?'var(--err)':'var(--subtle)',
                    borderColor:delConfirm==='ELIMINAR'?'var(--err)':'var(--subtle)',
                    cursor:delConfirm==='ELIMINAR'?'pointer':'default',
                  }}
                >
                  {deleting?'Eliminando…':'Confirmar eliminación'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}