'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useRouter } from 'next/navigation'

interface User { id:string; name:string; email:string; role_name:string; zone?:string; status:string; last_login?:string }

const ROLES = ['admin','auditor','viewer']
const ZONES = ['Norte','Sur','Oriente','Occidente','Centro']
const BADGE: Record<string,{label:string;bg:string;color:string}> = {
  active:   {label:'Activo',   bg:'var(--ok-bg)',   color:'var(--ok)'},
  inactive: {label:'Inactivo', bg:'var(--surface)',  color:'var(--subtle)'},
  pending:  {label:'Pendiente',bg:'var(--warn-bg)',  color:'var(--warn)'},
}
const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:12,background:'var(--white)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--ink)':'var(--surface)',color:p?'white':'var(--mid)',border:`1px solid ${p?'var(--ink)':'var(--border)'}`,padding:'9px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:440,boxShadow:'0 24px 64px rgba(0,0,0,.25)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',display:'flex'}}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const router = useRouter()
  const [users,    setUsers]    = useState<User[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [selected, setSelected] = useState<User|null>(null)
  const [error,    setError]    = useState('')
  const [notice,   setNotice]   = useState('')
  const [resending,setResending]= useState<string|null>(null)
  const [form,     setForm]     = useState({name:'',email:'',password:'',role_name:'viewer',zone:'',status:'active'})

  const load = () => { setLoading(true); fetch('/api/admin/users').then(r=>r.json()).then(d=>{setUsers(d.data??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const openCreate = () => { setForm({name:'',email:'',password:'',role_name:'viewer',zone:'',status:'active'}); setError(''); setNotice(''); setModal('create') }
  const openEdit   = (u:User) => { setSelected(u); setForm({name:u.name,email:u.email,password:'',role_name:u.role_name,zone:u.zone??'',status:u.status}); setError(''); setNotice(''); setModal('edit') }

  const save = async () => {
    setError(''); setNotice('')
    const isCreate = modal==='create'
    const url  = isCreate?'/api/admin/users':`/api/admin/users/${selected?.id}`
    const body: Record<string,string|null> = {name:form.name,role_name:form.role_name,zone:form.zone||null,status:form.status}
    if (isCreate) body.email=form.email
    else if(form.password)body.password=form.password
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    if (isCreate) {
      if (data.inviteSent) setNotice(`Usuario creado. Se envió la invitación a ${form.email} para que defina su contraseña.`)
      else if (data.inviteError) setNotice(`Usuario creado, pero la invitación no se pudo enviar (${data.inviteError}). Puedes reenviarla desde la lista.`)
      load()
      setTimeout(()=>{setModal(null);setNotice('')}, 3500)
      return
    }
    setModal(null);load()
  }

  const resendInvite = async (u:User) => {
    setResending(u.id)
    const res = await fetch(`/api/admin/users/${u.id}/resend-invite`,{method:'POST'})
    const data = await res.json()
    setResending(null)
    alert(res.ok ? `Invitación reenviada a ${u.email}` : (data.error ?? 'Error al reenviar'))
  }

  // Solo inactivar — nunca eliminar
  const suspend = async (u:User) => {
    const newStatus = u.status==='active' ? 'inactive' : 'active'
    await fetch(`/api/admin/users/${u.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})})
    load()
  }

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>{users.length} usuarios</div>
        <button onClick={openCreate} style={BTN(true)}>+ Nuevo usuario</button>
      </div>
      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          {users.length===0&&<div style={{padding:'40px',textAlign:'center',color:'var(--subtle)',fontSize:13}}>Sin usuarios</div>}
          {users.map((u,i)=>{
            const b = BADGE[u.status]??BADGE.inactive
            return(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderBottom:i<users.length-1?'1px solid var(--border2)':'none'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:'var(--ink)',flexShrink:0}}>
                  {u.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{u.name}</div>
                  <div style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)'}}>{u.email}</div>
                </div>
                <span style={{fontSize:11,fontWeight:600,padding:'2px 9px',borderRadius:20,background:'var(--surface)',color:'var(--mid)',border:'1px solid var(--border)'}}>{u.role_name}</span>
                {u.zone&&<span style={{fontSize:11,color:'var(--subtle)'}}>{u.zone}</span>}
                {u.last_login&&<span style={{fontSize:10,color:'var(--subtle)',fontFamily:'var(--font-mono)'}}>Último: {new Date(u.last_login).toLocaleDateString('es-CO')}</span>}
                <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:b.bg,color:b.color}}>{b.label}</span>
                <div style={{display:'flex',gap:6}}>
                  {u.status==='pending'&&(
                    <button onClick={()=>resendInvite(u)} disabled={resending===u.id} style={{background:'none',border:'1px solid var(--accent-border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:resending===u.id?'default':'pointer',fontSize:11,color:'var(--accent)',fontFamily:'inherit'}}>
                      {resending===u.id?'Enviando…':'Reenviar invitación'}
                    </button>
                  )}
                  <button onClick={()=>router.push(`/admin/usuarios/${u.id}`)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Ver ficha</button>
                  <button onClick={()=>openEdit(u)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Editar</button>
                  {/* Solo inactivar — no eliminar */}
                  <button onClick={()=>suspend(u)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>
                    {u.status==='active'?'Inactivar':'Activar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {modal&&(
        <Modal title={modal==='create'?'Nuevo usuario':'Editar usuario'} onClose={()=>setModal(null)}>
          <input style={INP} placeholder="Nombre completo" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          {modal==='create'&&<input style={INP} type="email" placeholder="Correo" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>}
          {modal==='create' ? (
            <div style={{fontSize:11,color:'var(--subtle)',marginBottom:12,lineHeight:1.5}}>
              Le enviaremos un correo para que defina su propia contraseña.
            </div>
          ) : (
            <input style={INP} type="password" placeholder="Nueva contraseña (opcional)" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
          )}
          <select style={{...INP,cursor:'pointer'}} value={form.role_name} onChange={e=>setForm(f=>({...f,role_name:e.target.value}))}>
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <select style={{...INP,cursor:'pointer'}} value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))}>
            <option value="">Sin zona</option>
            {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
          {modal==='edit'&&(
            <select style={{...INP,cursor:'pointer'}} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          )}
          {notice&&<div style={{fontSize:12,color:'var(--ok)',background:'var(--ok-bg)',borderRadius:'var(--r-sm)',padding:'8px 12px',marginBottom:12,lineHeight:1.5}}>{notice}</div>}
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