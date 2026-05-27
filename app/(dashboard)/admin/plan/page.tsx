'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

interface Stats { plan:any; usage:any; tenant:any }

const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:0,background:'white'}

function Field({label,value,mono=false}:{label:string;value?:string|null;mono?:boolean}) {
  return (
    <div style={{borderBottom:'1px solid var(--border2)',padding:'10px 0'}}>
      <div style={{fontSize:10,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4,fontWeight:600}}>{label}</div>
      <div style={{fontSize:13,color:value?'var(--ink)':'var(--border)',fontFamily:mono?'var(--font-mono)':'inherit'}}>{value||'—'}</div>
    </div>
  )
}

export default function PlanPage() {
  const [stats,   setStats]   = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState<any>({})
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/stats').then(r=>r.json()).then(d=>{
      setStats(d)
      setForm(d.tenant??{})
      setLoading(false)
    })
  }
  useEffect(()=>{load()},[])

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/tenant',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setSaving(false); setEditing(false); load()
  }

  if(loading) return <div style={{padding:32,color:'var(--subtle)',fontSize:13}}>Cargando…</div>
  if(!stats)  return <div style={{padding:32,color:'var(--subtle)',fontSize:13}}>Error al cargar.</div>
  const {plan,usage,tenant} = stats

  return (
    <div style={{padding:'24px 28px'}}>

      {/* Plan activo */}
      <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:16}}>Plan activo</div>
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24,marginBottom:24}}>
        <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:16}}>
          <span style={{fontFamily:'var(--font-serif)',fontSize:28,color:'var(--ink)'}}>{plan.name}</span>
          <span style={{fontSize:12,fontWeight:600,padding:'3px 12px',borderRadius:20,background:'var(--ink)',color:'white'}}>{plan.tier?.toUpperCase()}</span>
          <span style={{fontSize:12,fontWeight:600,padding:'3px 12px',borderRadius:20,background:plan.status==='active'?'var(--ok-bg)':'var(--warn-bg)',color:plan.status==='active'?'var(--ok)':'var(--warn)'}}>{plan.status}</span>
        </div>
        {plan.trialEndsAt&&(
          <div style={{fontSize:13,color:'var(--warn)',marginBottom:16,padding:'10px 14px',background:'var(--warn-bg)',borderRadius:'var(--r-md)'}}>
            ⏰ Trial vence el {new Date(plan.trialEndsAt).toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})}
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
          {[
            {label:'Locaciones máx.',  value:plan.maxLocations,   used:usage.locations},
            {label:'Usuarios máx.',    value:plan.maxUsers,       used:usage.users},
            {label:'Auditorías/mes',   value:plan.maxAuditsMonth, used:usage.auditsThisMonth},
          ].map(s=>(
            <div key={s.label} style={{border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:14}}>
              <div style={{fontSize:10,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,fontWeight:600}}>{s.label}</div>
              <div style={{fontFamily:'var(--font-serif)',fontSize:26,color:'var(--ink)',lineHeight:1,marginBottom:8}}>{s.value}</div>
              <div style={{height:4,background:'var(--border2)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(100,Math.round(s.used/s.value*100))}%`,background:s.used/s.value>.9?'var(--err)':'var(--ok)',borderRadius:2}}/>
              </div>
              <div style={{fontSize:11,color:'var(--subtle)',marginTop:4}}>{s.used} en uso</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {[{label:'Mapa',enabled:plan.mapEnabled},{label:'API',enabled:plan.apiEnabled},{label:'IA / Visión',enabled:plan.aiEnabled}].map(f=>(
            <div key={f.label} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:'var(--r-md)',border:'1px solid var(--border)',background:f.enabled?'var(--ok-bg)':'var(--surface)'}}>
              <Icon name={f.enabled?'check':'x'} size={13} color={f.enabled?'var(--ok)':'var(--subtle)'}/>
              <span style={{fontSize:12,color:f.enabled?'var(--ok)':'var(--subtle)',fontWeight:500}}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Información del tenant */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>
          Empresa contratante
        </div>
        <button onClick={()=>editing?save():setEditing(true)} disabled={saving} style={{
          background:editing?'var(--ink)':'none',color:editing?'white':'var(--mid)',
          border:'1px solid var(--border)',padding:'6px 16px',borderRadius:'var(--r-sm)',
          fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500,
        }}>
          {saving?'Guardando…':editing?'Guardar cambios':'Editar'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

        {/* Datos generales */}
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px 20px'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--mid)',marginBottom:12}}>Identificación</div>
          {editing?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                {key:'name',        label:'Nombre de la empresa'},
                {key:'nit',         label:'NIT / Tax ID'},
                {key:'contactName', label:'Nombre del contacto'},
                {key:'contactEmail',label:'Email de contacto'},
                {key:'contactPhone',label:'Teléfono móvil'},
              ].map(f=>(
                <div key={f.key}>
                  <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>{f.label}</div>
                  <input style={INP} value={form[f.key]??''} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))}/>
                </div>
              ))}
            </div>
          ):(
            <>
              <Field label="Nombre de la empresa" value={tenant?.name}/>
              <Field label="NIT / Tax ID" value={tenant?.nit} mono/>
              <Field label="Contacto" value={tenant?.contactName}/>
              <Field label="Email" value={tenant?.contactEmail} mono/>
              <Field label="Teléfono móvil" value={tenant?.contactPhone} mono/>
            </>
          )}
        </div>

        {/* Dirección de facturación */}
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px 20px'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--mid)',marginBottom:12}}>Dirección de facturación</div>
          {editing?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                {key:'billingAddress',label:'Dirección'},
                {key:'billingCity',   label:'Ciudad'},
                {key:'billingState',  label:'Departamento / Estado'},
                {key:'billingCountry',label:'País'},
                {key:'billingZip',    label:'Código postal'},
              ].map(f=>(
                <div key={f.key}>
                  <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>{f.label}</div>
                  <input style={INP} value={form[f.key]??''} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))}/>
                </div>
              ))}
            </div>
          ):(
            <>
              <Field label="Dirección" value={tenant?.billingAddress}/>
              <Field label="Ciudad" value={tenant?.billingCity}/>
              <Field label="Departamento / Estado" value={tenant?.billingState}/>
              <Field label="País" value={tenant?.billingCountry}/>
              <Field label="Código postal" value={tenant?.billingZip} mono/>
            </>
          )}
        </div>
      </div>

      <div style={{marginTop:16,fontSize:12,color:'var(--subtle)',textAlign:'center'}}>
        Para cambiar de plan contacta a soporte@tveo.co
      </div>
    </div>
  )
}
