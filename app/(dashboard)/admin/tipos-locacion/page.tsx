'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

interface LocType { id:string; name:string; icon:string; description?:string; active:boolean }
const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:12,background:'var(--white)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--accent)':'var(--surface)',color:p?'var(--accent-ink)':'var(--mid)',border:`1px solid ${p?'var(--accent)':'var(--border)'}`,padding:'9px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})
const ICONS = ['🏪','📦','🏭','🏢','🌙','🏬','🏗️','🏨','🛒','📍']

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:440,boxShadow:'0 24px 64px rgba(0,0,0,.25)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',display:'flex'}}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function TiposLocacionPage() {
  const [items,    setItems]    = useState<LocType[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'create'|'edit'|'blocked'|null>(null)
  const [selected, setSelected] = useState<LocType|null>(null)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState({name:'',icon:'🏪',description:''})
  const [blockedCount, setBlockedCount] = useState(0)

  const load = () => { setLoading(true); fetch('/api/admin/location-types').then(r=>r.json()).then(d=>{setItems(d.data??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const openCreate = () => { setForm({name:'',icon:'🏪',description:''}); setError(''); setModal('create') }
  const openEdit   = (t:LocType) => { setSelected(t); setForm({name:t.name,icon:t.icon,description:t.description??''}); setError(''); setModal('edit') }

  const save = async () => {
    setError('')
    const isCreate = modal==='create'
    const url = isCreate?'/api/admin/location-types':`/api/admin/location-types/${selected?.id}`
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const toggle = async (t:LocType) => {
    await fetch(`/api/admin/location-types/${t.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!t.active})})
    load()
  }

  const del = async (t:LocType) => {
    // Verificar si tiene locaciones asociadas
    const res  = await fetch(`/api/admin/location-types/${t.id}/check`)
    const data = await res.json()
    if (data.count > 0) {
      setSelected(t)
      setBlockedCount(data.count)
      setModal('blocked')
      return
    }
    if (!confirm(`¿Eliminar "${t.name}"?`)) return
    const delRes = await fetch(`/api/admin/location-types/${t.id}`,{method:'DELETE'})
    if (!delRes.ok){const d=await delRes.json();alert(d.error??'Error');return}
    load()
  }

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>{items.length} tipos</div>
        <button onClick={openCreate} style={BTN(true)}>+ Nuevo tipo</button>
      </div>
      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          {items.length===0&&<div style={{padding:'40px',textAlign:'center',color:'var(--subtle)',fontSize:13}}>Sin tipos de locación</div>}
          {items.map((t,i)=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderBottom:i<items.length-1?'1px solid var(--border2)':'none'}}>
              <div style={{width:40,height:40,borderRadius:'var(--r-md)',background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{t.name}</div>
                {t.description&&<div style={{fontSize:11,color:'var(--subtle)'}}>{t.description}</div>}
              </div>
              <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:t.active?'var(--ok-bg)':'var(--surface)',color:t.active?'var(--ok)':'var(--subtle)'}}>{t.active?'Activo':'Inactivo'}</span>
              <div style={{display:'flex',gap:6}}>
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
        <Modal title={modal==='create'?'Nuevo tipo':'Editar tipo'} onClose={()=>setModal(null)}>
          <input style={INP} placeholder="Nombre del tipo" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--subtle)',marginBottom:8}}>Ícono</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {ICONS.map(ic=>(
                <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{width:40,height:40,fontSize:20,borderRadius:'var(--r-md)',border:`2px solid ${form.icon===ic?'var(--ink)':'var(--border)'}`,background:form.icon===ic?'var(--surface)':'none',cursor:'pointer'}}>{ic}</button>
              ))}
            </div>
          </div>
          <input style={INP} placeholder="Descripción (opcional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
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
              El tipo <strong>{selected.name}</strong> está asignado a <strong>{blockedCount} locación{blockedCount!==1?'es':''}</strong>. Reasigna o elimina esas locaciones antes de eliminar este tipo.
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={BTN(true)}>Entendido</button>
          </div>
        </Modal>
      )}
    </div>
  )
}