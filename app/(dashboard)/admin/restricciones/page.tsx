'use client'
import { useEffect, useState } from 'react'

interface Restriction {
  id:string; role_name?:string; user_id?:string
  ip_enabled:boolean; ip_whitelist?:string[]
  schedule_enabled:boolean; timezone:string
  schedule?:Array<{enabled:boolean;start:string;end:string}>
  active:boolean; created_at:string
}
interface User { id:string; name:string; email:string; role_name:string }

const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const ROLES = ['admin','auditor','viewer']
const DEFAULT_SCHEDULE = DAYS.map((_,i)=>({enabled:i>=1&&i<=5,start:'07:00',end:'19:00'}))
const INP: React.CSSProperties = {border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 10px',fontSize:12,fontFamily:'inherit',color:'var(--ink)',outline:'none',background:'var(--white)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--accent)':'var(--surface)',color:p?'var(--accent-ink)':'var(--mid)',border:`1px solid ${p?'var(--accent)':'var(--border)'}`,padding:'7px 16px',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:540,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',fontSize:18}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function RestriccionesPage() {
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [users,        setUsers]        = useState<User[]>([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState<'create'|'edit'|null>(null)
  const [selected,     setSelected]     = useState<Restriction|null>(null)
  const [error,        setError]        = useState('')
  const [form,         setForm]         = useState<any>({
    role_name:'auditor', user_id:'', ip_enabled:false, ip_whitelist_text:'',
    schedule_enabled:false, timezone:'America/Bogota',
    schedule:DEFAULT_SCHEDULE, active:true,
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/access-restrictions').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
    ]).then(([r,u])=>{setRestrictions(r.data??[]);setUsers(u.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const openCreate = () => {
    setForm({role_name:'auditor',user_id:'',ip_enabled:false,ip_whitelist_text:'',schedule_enabled:false,timezone:'America/Bogota',schedule:DEFAULT_SCHEDULE,active:true})
    setError(''); setModal('create')
  }
  const openEdit = (r:Restriction) => {
    setSelected(r)
    setForm({...r, ip_whitelist_text:(r.ip_whitelist??[]).join('\n'), schedule:r.schedule??DEFAULT_SCHEDULE})
    setError(''); setModal('edit')
  }

  const save = async () => {
    setError('')
    const isCreate = modal==='create'
    const url = isCreate?'/api/admin/access-restrictions':`/api/admin/access-restrictions/${selected?.id}`
    const body = {
      ...form,
      role_name:    form.user_id ? null : form.role_name || null,
      user_id:      form.user_id || null,
      ip_whitelist: form.ip_enabled ? form.ip_whitelist_text.split('\n').map((s:string)=>s.trim()).filter(Boolean) : [],
    }
    delete body.ip_whitelist_text
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const toggle = async (r:Restriction) => {
    await fetch(`/api/admin/access-restrictions/${r.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!r.active})})
    load()
  }

  const del = async (r:Restriction) => {
    if(!confirm('¿Eliminar esta restricción?'))return
    await fetch(`/api/admin/access-restrictions/${r.id}`,{method:'DELETE'})
    load()
  }

  const updateScheduleDay = (dayIdx:number, field:string, value:any) => {
    const s = [...form.schedule]
    s[dayIdx] = {...s[dayIdx],[field]:value}
    setForm((p:any)=>({...p,schedule:s}))
  }

  return (
    <div style={{padding:'24px 28px'}}>
      {/* Info */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'14px 18px',marginBottom:20,fontSize:12,color:'var(--mid)',lineHeight:1.7}}>
        <strong style={{color:'var(--ink)'}}>Restricciones de acceso</strong> — Define reglas de IP y horario por rol o usuario individual.
        Las restricciones se verifican en cada intento de inicio de sesión. Si se bloquea un acceso, se notifica al admin por email.
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>{restrictions.length} reglas configuradas</div>
        <button onClick={openCreate} style={BTN(true)}>+ Nueva restricción</button>
      </div>

      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        restrictions.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>
            Sin restricciones configuradas. Todos los usuarios pueden acceder sin límites.
          </div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {restrictions.map((r,i)=>{
              const user = users.find(u=>u.id===r.user_id)
              return (
                <div key={r.id} style={{padding:'16px',borderBottom:i<restrictions.length-1?'1px solid var(--border2)':'none',opacity:r.active?1:.5}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{flex:1}}>
                      {/* Scope */}
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:'var(--ink)'}}>
                          {user ? `${user.name} (${user.role_name})` : r.role_name ? `Rol: ${r.role_name}` : 'Todos los usuarios'}
                        </span>
                        {r.active
                          ? <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--ok-bg)',color:'var(--ok)',fontWeight:600}}>Activa</span>
                          : <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--surface)',color:'var(--subtle)',fontWeight:600}}>Inactiva</span>
                        }
                      </div>
                      {/* Restricciones */}
                      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                        {/* IP */}
                        <div style={{fontSize:11,padding:'4px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',color:r.ip_enabled?'var(--ink)':'var(--subtle)',background:r.ip_enabled?'var(--surface)':'transparent'}}>
                          🌐 IP: {r.ip_enabled?(r.ip_whitelist?.join(', ')||'lista vacía'):'sin restricción'}
                        </div>
                        {/* Horario */}
                        <div style={{fontSize:11,padding:'4px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',color:r.schedule_enabled?'var(--ink)':'var(--subtle)',background:r.schedule_enabled?'var(--surface)':'transparent'}}>
                          🕐 Horario: {r.schedule_enabled?(
                            r.schedule?.map((d,idx)=>d.enabled?`${DAYS[idx]} ${d.start}-${d.end}`:'').filter(Boolean).join(' · ')||'sin días'
                          ):'sin restricción'}
                        </div>
                        {r.schedule_enabled&&<span style={{fontSize:10,color:'var(--subtle)'}}>{r.timezone}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button onClick={()=>openEdit(r)} style={{...BTN(),padding:'5px 10px'}}>Editar</button>
                      <button onClick={()=>toggle(r)} style={{...BTN(),padding:'5px 10px'}}>{r.active?'Desactivar':'Activar'}</button>
                      <button onClick={()=>del(r)} style={{background:'none',border:'1px solid var(--err-bg)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--err)',fontFamily:'inherit'}}>Eliminar</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {modal&&(
        <Modal title={modal==='create'?'Nueva restricción':'Editar restricción'} onClose={()=>setModal(null)}>
          {/* Scope */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Aplica a</div>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <select style={{...INP,flex:1,cursor:'pointer'}} value={form.user_id?'user':form.role_name||'all'} onChange={e=>{
                const v=e.target.value
                if(v==='all') setForm((p:any)=>({...p,role_name:null,user_id:''}))
                else if(v==='user') setForm((p:any)=>({...p,role_name:null}))
                else setForm((p:any)=>({...p,role_name:v,user_id:''}))
              }}>
                <option value="all">Todos los usuarios</option>
                {ROLES.map(r=><option key={r} value={r}>Rol: {r}</option>)}
                <option value="user">Usuario específico</option>
              </select>
              {!form.role_name&&!form.user_id===false&&(
                <select style={{...INP,flex:1,cursor:'pointer'}} value={form.user_id} onChange={e=>setForm((p:any)=>({...p,user_id:e.target.value}))}>
                  <option value="">Selecciona usuario…</option>
                  {users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role_name})</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Restricción de IP */}
          <div style={{marginBottom:14,padding:'12px',background:'var(--surface)',borderRadius:'var(--r-md)',border:'1px solid var(--border2)'}}>
            <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:form.ip_enabled?10:0,cursor:'pointer'}}>
              <input type="checkbox" checked={form.ip_enabled} onChange={e=>setForm((p:any)=>({...p,ip_enabled:e.target.checked}))}/>
              <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>🌐 Restricción de IP</span>
            </label>
            {form.ip_enabled&&(
              <div>
                <div style={{fontSize:11,color:'var(--subtle)',marginBottom:6}}>IPs permitidas (una por línea, soporta CIDR como 192.168.1.0/24)</div>
                <textarea value={form.ip_whitelist_text} onChange={e=>setForm((p:any)=>({...p,ip_whitelist_text:e.target.value}))}
                  placeholder={'192.168.1.0/24\n10.0.0.1\n200.100.50.25'}
                  style={{...INP,width:'100%',minHeight:80,resize:'vertical',fontFamily:'var(--font-mono)',fontSize:11}}/>
              </div>
            )}
          </div>

          {/* Restricción de horario */}
          <div style={{marginBottom:14,padding:'12px',background:'var(--surface)',borderRadius:'var(--r-md)',border:'1px solid var(--border2)'}}>
            <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:form.schedule_enabled?12:0,cursor:'pointer'}}>
              <input type="checkbox" checked={form.schedule_enabled} onChange={e=>setForm((p:any)=>({...p,schedule_enabled:e.target.checked}))}/>
              <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>🕐 Restricción de horario</span>
            </label>
            {form.schedule_enabled&&(
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:11,color:'var(--subtle)'}}>Zona horaria:</span>
                  <select style={{...INP,cursor:'pointer'}} value={form.timezone} onChange={e=>setForm((p:any)=>({...p,timezone:e.target.value}))}>
                    {['America/Bogota','America/Lima','America/Mexico_City','America/Buenos_Aires','America/Santiago','America/Caracas'].map(tz=>(
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {form.schedule.map((day:any,idx:number)=>(
                    <div key={idx} style={{display:'flex',alignItems:'center',gap:10}}>
                      <label style={{display:'flex',alignItems:'center',gap:6,width:48,cursor:'pointer',flexShrink:0}}>
                        <input type="checkbox" checked={day.enabled} onChange={e=>updateScheduleDay(idx,'enabled',e.target.checked)}/>
                        <span style={{fontSize:11,color:day.enabled?'var(--ink)':'var(--subtle)',fontWeight:day.enabled?600:400}}>{DAYS[idx]}</span>
                      </label>
                      {day.enabled&&(
                        <>
                          <input type="time" value={day.start} onChange={e=>updateScheduleDay(idx,'start',e.target.value)}
                            style={{...INP,width:90}}/>
                          <span style={{fontSize:11,color:'var(--subtle)'}}>—</span>
                          <input type="time" value={day.end} onChange={e=>updateScheduleDay(idx,'end',e.target.value)}
                            style={{...INP,width:90}}/>
                        </>
                      )}
                      {!day.enabled&&<span style={{fontSize:11,color:'var(--subtle)'}}>Sin acceso</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,cursor:'pointer'}}>
            <input type="checkbox" checked={form.active} onChange={e=>setForm((p:any)=>({...p,active:e.target.checked}))}/>
            <span style={{fontSize:13,color:'var(--mid)'}}>Restricción activa</span>
          </label>

          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12,padding:'8px 12px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
