'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface TenantDetail {
  id:string; name:string; nit?:string; sector?:string; status:string
  plan_id:string; trial_ends_at?:string; created_at:string
  contact_name?:string; contact_email?:string; contact_phone?:string
  billing_address?:string; billing_city?:string; billing_state?:string
  billing_country?:string; billing_zip?:string; tax_id?:string
  plans?:{name:string;tier:string}
}
interface Usage { users:number; locations:number; audits:number; aiLogs:number }

const STATUS_OPTS = ['active','trial','suspended','cancelled']
const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',marginBottom:8,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'var(--surface)':'var(--subtle)',border:`1px solid ${p?'white':'var(--border)'}`,padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Section({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div style={{background:'var(--white)',border:'1px solid var(--border2)',borderRadius:12,padding:'20px',marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:600,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:16}}>{title}</div>
      {children}
    </div>
  )
}

function Field({label,value,mono=false}:{label:string;value?:string|null;mono?:boolean}) {
  return (
    <div style={{borderBottom:'1px solid var(--border2)',padding:'8px 0'}}>
      <div style={{fontSize:10,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:3,fontWeight:600}}>{label}</div>
      <div style={{fontSize:12,color:value?'var(--ink2)':'var(--subtle)',fontFamily:mono?'monospace':'inherit'}}>{value||'—'}</div>
    </div>
  )
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id     = params.id as string

  const [tenant,  setTenant]  = useState<TenantDetail|null>(null)
  const [usage,   setUsage]   = useState<Usage|null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState<any>({})
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/superadmin/tenants/${id}`).then(r=>r.json()),
      fetch(`/api/superadmin/tenants/${id}/usage`).then(r=>r.json()),
    ]).then(([t,u])=>{
      setTenant(t.data)
      setUsage(u)
      setForm(t.data??{})
      setLoading(false)
    })
  }
  useEffect(()=>{load()},[id])

  const save = async () => {
    setSaving(true)
    await fetch(`/api/superadmin/tenants/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setSaving(false); setEditing(false); load()
  }

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm((p:any)=>({...p,[k]:e.target.value}))

  if(loading) return <div style={{padding:32,color:'var(--mid)',fontSize:13}}>Cargando…</div>
  if(!tenant) return <div style={{padding:32,color:'var(--mid)',fontSize:13}}>Tenant no encontrado.</div>

  const sc = tenant.status==='active'?{bg:'rgba(74,222,128,.1)',c:'var(--accent)'}:tenant.status==='trial'?{bg:'rgba(250,204,21,.1)',c:'var(--warn)'}:{bg:'rgba(255,255,255,.05)',c:'var(--mid)'}

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>router.push('/superadmin/tenants')} style={{background:'none',border:'none',color:'var(--mid)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>← Tenants</button>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:300,color:'white'}}>{tenant.name}</div>
          <div style={{fontSize:11,color:'var(--mid)',fontFamily:'monospace',marginTop:2}}>{tenant.id}</div>
        </div>
        <span style={{fontSize:12,fontWeight:500,padding:'4px 12px',borderRadius:20,background:sc.bg,color:sc.c}}>{tenant.status}</span>
        <button onClick={()=>editing?save():setEditing(true)} disabled={saving} style={BTN(editing)}>
          {saving?'Guardando…':editing?'Guardar':'Editar'}
        </button>
        {editing&&<button onClick={()=>setEditing(false)} style={BTN()}>Cancelar</button>}
      </div>

      {/* Usage stats */}
      {usage&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[
            {label:'Usuarios',    value:usage.users},
            {label:'Locaciones',  value:usage.locations},
            {label:'Auditorías',  value:usage.audits},
            {label:'Análisis IA', value:usage.aiLogs},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--white)',border:'1px solid var(--border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:28,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <Section title="Identificación">
            {editing?(
              <>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Nombre</div><input style={INP} value={form.name??''} onChange={f('name')}/>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>NIT / Tax ID</div><input style={INP} value={form.nit??form.tax_id??''} onChange={f('nit')}/>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Sector</div><input style={INP} value={form.sector??''} onChange={f('sector')}/>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Estado</div>
                <select style={{...INP,cursor:'pointer'}} value={form.status??''} onChange={f('status')}>
                  {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Fin del trial</div>
                <input style={INP} type="date" value={form.trial_ends_at?.slice(0,10)??''} onChange={f('trial_ends_at')}/>
              </>
            ):(
              <>
                <Field label="Nombre"        value={tenant.name}/>
                <Field label="NIT / Tax ID"  value={tenant.nit??tenant.tax_id} mono/>
                <Field label="Sector"        value={tenant.sector}/>
                <Field label="Plan"          value={tenant.plans?`${tenant.plans.name} (${tenant.plans.tier})`:'—'}/>
                <Field label="Creado"        value={new Date(tenant.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})}/>
                {tenant.trial_ends_at&&<Field label="Trial hasta" value={new Date(tenant.trial_ends_at).toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})}/>}
              </>
            )}
          </Section>

          <Section title="Contacto">
            {editing?(
              <>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Nombre contacto</div><input style={INP} value={form.contact_name??''} onChange={f('contact_name')}/>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Email</div><input style={INP} value={form.contact_email??''} onChange={f('contact_email')}/>
                <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>Teléfono</div><input style={INP} value={form.contact_phone??''} onChange={f('contact_phone')}/>
              </>
            ):(
              <>
                <Field label="Contacto" value={tenant.contact_name}/>
                <Field label="Email"    value={tenant.contact_email} mono/>
                <Field label="Teléfono" value={tenant.contact_phone} mono/>
              </>
            )}
          </Section>
        </div>

        <div>
          <Section title="Facturación">
            {editing?(
              <>
                {[['billing_address','Dirección'],['billing_city','Ciudad'],['billing_state','Dpto/Estado'],['billing_country','País'],['billing_zip','Código postal']].map(([k,l])=>(
                  <div key={k}>
                    <div style={{fontSize:10,color:'var(--mid)',marginBottom:3}}>{l}</div>
                    <input style={INP} value={(form as any)[k]??''} onChange={f(k)}/>
                  </div>
                ))}
              </>
            ):(
              <>
                <Field label="Dirección"   value={tenant.billing_address}/>
                <Field label="Ciudad"      value={tenant.billing_city}/>
                <Field label="Dpto/Estado" value={tenant.billing_state}/>
                <Field label="País"        value={tenant.billing_country}/>
                <Field label="Código postal" value={tenant.billing_zip} mono/>
              </>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
