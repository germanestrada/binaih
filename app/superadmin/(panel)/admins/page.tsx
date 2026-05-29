'use client'
import { useEffect, useState } from 'react'

interface Admin { id:string; name:string; email:string; totp_enabled:boolean; status:string; last_login?:string; login_count:number }
const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'white',outline:'none',marginBottom:10,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

export default function AdminsPage() {
  const [admins,  setAdmins]  = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState({name:'',email:'',password:''})
  const [error,   setError]   = useState('')

  const load = () => { setLoading(true); fetch('/api/superadmin/admins').then(r=>r.json()).then(d=>{setAdmins(d.data??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const create = async () => {
    setError('')
    const res  = await fetch('/api/superadmin/admins',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(false);setForm({name:'',email:'',password:''});load()
  }

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px'}}>{admins.length} administradores TVEO</div>
        <button onClick={()=>setModal(true)} style={BTN(true)}>+ Nuevo admin</button>
      </div>
      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,overflow:'hidden'}}>
          {admins.map((a,i)=>(
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:i<admins.length-1?'1px solid #161616':'none'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:'white',flexShrink:0}}>
                {a.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:'white'}}>{a.name}</div>
                <div style={{fontSize:11,color:'#444',fontFamily:'monospace'}}>{a.email}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:a.totp_enabled?'rgba(74,222,128,.1)':'rgba(250,204,21,.1)',color:a.totp_enabled?'#4ade80':'#facc15'}}>
                  {a.totp_enabled?'2FA activo':'Sin 2FA'}
                </span>
                <span style={{fontSize:10,color:'#444'}}>{a.login_count} accesos</span>
                {a.last_login&&<span style={{fontSize:10,color:'#444',fontFamily:'monospace'}}>Último: {new Date(a.last_login).toLocaleDateString('es-CO')}</span>}
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:a.status==='active'?'rgba(74,222,128,.1)':'rgba(255,255,255,.05)',color:a.status==='active'?'#4ade80':'#555'}}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:420,boxShadow:'0 32px 80px rgba(0,0,0,.6)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:18,color:'white',fontWeight:300}}>Nuevo administrador</div>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
            </div>
            <input style={INP} placeholder="Nombre completo" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            <input style={INP} type="email" placeholder="Email @tveo.co" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            <input style={INP} type="password" placeholder="Contraseña inicial" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
            {error&&<div style={{fontSize:12,color:'#f87171',marginBottom:12}}>{error}</div>}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(false)} style={BTN()}>Cancelar</button>
              <button onClick={create} style={BTN(true)}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
