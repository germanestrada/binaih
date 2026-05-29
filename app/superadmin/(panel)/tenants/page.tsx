'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant { id:string; name:string; nit?:string; sector?:string; status:string; plan_id:string; trial_ends_at?:string; created_at:string; plans?:{name:string;tier:string} }
interface Plan   { id:string; name:string; tier:string }

const STATUS_OPTS = ['active','trial','suspended','cancelled']
const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'white',outline:'none',marginBottom:10,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:460,boxShadow:'0 32px 80px rgba(0,0,0,.6)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:18,color:'white',fontWeight:300}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function TenantsPage() {
  const router  = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans,   setPlans]   = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'create'|'edit'|null>(null)
  const [selected,setSelected]= useState<Tenant|null>(null)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState({name:'',nit:'',sector:'',plan_id:'',status:'trial',trial_ends_at:''})

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/superadmin/tenants').then(r=>r.json()),
      fetch('/api/superadmin/planes').then(r=>r.json()),
    ]).then(([t,p])=>{setTenants(t.data??[]);setPlans(p.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const openCreate = () => {
    const trialEnd = new Date(Date.now()+30*86400000).toISOString().slice(0,10)
    setForm({name:'',nit:'',sector:'',plan_id:plans[0]?.id??'',status:'trial',trial_ends_at:trialEnd})
    setError(''); setModal('create')
  }
  const openEdit = (t:Tenant) => {
    setSelected(t)
    setForm({name:t.name,nit:t.nit??'',sector:t.sector??'',plan_id:t.plan_id,status:t.status,trial_ends_at:t.trial_ends_at?.slice(0,10)??''})
    setError(''); setModal('edit')
  }

  const save = async () => {
    setError('')
    const isCreate = modal==='create'
    const url = isCreate?'/api/superadmin/tenants':`/api/superadmin/tenants/${selected?.id}`
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:e.target.value}))

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px'}}>{tenants.length} tenants</div>
        <button onClick={openCreate} style={BTN(true)}>+ Nuevo tenant</button>
      </div>

      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,overflow:'hidden'}}>
          {tenants.map((t,i)=>{
            const sc = t.status==='active'?{bg:'rgba(74,222,128,.1)',c:'#4ade80'}:t.status==='trial'?{bg:'rgba(250,204,21,.1)',c:'#facc15'}:{bg:'rgba(255,255,255,.05)',c:'#555'}
            return (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:i<tenants.length-1?'1px solid #161616':'none'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:'white',marginBottom:2}}>{t.name}</div>
                  <div style={{display:'flex',gap:10,fontSize:11,color:'#444'}}>
                    {t.nit&&<span>NIT: {t.nit}</span>}
                    {t.plans&&<span>{t.plans.name} ({t.plans.tier})</span>}
                    {t.trial_ends_at&&t.status==='trial'&&<span style={{color:'#facc15'}}>Trial hasta {new Date(t.trial_ends_at).toLocaleDateString('es-CO')}</span>}
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:500,padding:'2px 9px',borderRadius:20,background:sc.bg,color:sc.c}}>{t.status}</span>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>openEdit(t)} style={{background:'none',border:'1px solid #2a2a2a',padding:'5px 10px',borderRadius:6,cursor:'pointer',fontSize:11,color:'#888',fontFamily:'inherit'}}>Editar</button>
                  <button onClick={()=>router.push(`/superadmin/tenants/${t.id}`)} style={{background:'none',border:'1px solid #2a2a2a',padding:'5px 10px',borderRadius:6,cursor:'pointer',fontSize:11,color:'#888',fontFamily:'inherit'}}>Ver detalle</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal&&(
        <Modal title={modal==='create'?'Nuevo tenant':'Editar tenant'} onClose={()=>setModal(null)}>
          <input style={INP} placeholder="Nombre de la empresa *" value={form.name} onChange={f('name')}/>
          <input style={INP} placeholder="NIT (opcional)" value={form.nit} onChange={f('nit')}/>
          <input style={INP} placeholder="Sector" value={form.sector} onChange={f('sector')}/>
          <select style={{...INP,cursor:'pointer'}} value={form.plan_id} onChange={f('plan_id')}>
            <option value="">Selecciona un plan *</option>
            {plans.map(p=><option key={p.id} value={p.id}>{p.name} ({p.tier})</option>)}
          </select>
          <select style={{...INP,cursor:'pointer'}} value={form.status} onChange={f('status')}>
            {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {form.status==='trial'&&(
            <input style={INP} type="date" value={form.trial_ends_at} onChange={f('trial_ends_at')} placeholder="Fin del trial"/>
          )}
          {error&&<div style={{fontSize:12,color:'#f87171',marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
