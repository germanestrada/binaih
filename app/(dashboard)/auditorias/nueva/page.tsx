'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'

interface AuditType { id:string; name:string; icon:string; description?:string }
interface Location  { id:string; name:string; city:string; zone?:string }
interface User      { id:string; name:string; email:string; role_name:string }

const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:0,background:'white'}

function Field({label,children,required=false}:{label:string;children:React.ReactNode;required?:boolean}) {
  return (
    <div style={{marginBottom:18}}>
      <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:7}}>
        {label}{required&&<span style={{color:'var(--err)',marginLeft:3}}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function NuevaAuditoriaPage() {
  const router = useRouter()
  const [types,     setTypes]     = useState<AuditType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [auditors,  setAuditors]  = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [form,      setForm]      = useState({
    type_id:'', location_id:'', auditor_id:'',
    scheduled_at:'', notes:'',
  })

  useEffect(()=>{
    Promise.all([
      fetch('/api/audit-types').then(r=>r.json()),
      fetch('/api/stores').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
    ]).then(([t,l,u])=>{
      setTypes(t.data??[])
      setLocations(l.data??[])
      setAuditors((u.data??[]).filter((u:User)=>['admin','auditor'].includes(u.role_name)))
      setLoading(false)
    })
  },[])

  const f = (k:keyof typeof form) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p=>({...p,[k]:e.target.value}))

  const submit = async () => {
    setError('')
    if(!form.type_id||!form.location_id||!form.auditor_id||!form.scheduled_at) {
      setError('Completa todos los campos requeridos'); return
    }
    setSaving(true)
    const res  = await fetch('/api/audits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error al crear');setSaving(false);return}
    router.push(`/auditorias/${data.data.id}`)
  }

  const selectedType = types.find(t=>t.id===form.type_id)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      <PageHeader title="Nueva auditoría" backHref="/auditorias" backLabel="Auditorías"/>
      <div style={{flex:1,overflowY:'auto',padding:'32px',display:'flex',justifyContent:'center'}}>
        <div style={{width:'100%',maxWidth:560}}>
          {loading?(
            <div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>
          ):(
            <>
              {/* Tipo de auditoría */}
              <Field label="Tipo de auditoría" required>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                  {types.map(t=>(
                    <button key={t.id} onClick={()=>setForm(p=>({...p,type_id:t.id}))} style={{
                      display:'flex',alignItems:'center',gap:10,padding:'12px 14px',
                      border:`2px solid ${form.type_id===t.id?'var(--ink)':'var(--border)'}`,
                      borderRadius:'var(--r-lg)',background:form.type_id===t.id?'var(--surface)':'white',
                      cursor:'pointer',textAlign:'left',fontFamily:'inherit',transition:'all .15s',
                    }}>
                      <span style={{fontSize:22}}>{t.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{t.name}</div>
                        {t.description&&<div style={{fontSize:11,color:'var(--subtle)'}}>{t.description}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>

              {selectedType&&(
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'10px 14px',marginBottom:18,fontSize:12,color:'var(--mid)',display:'flex',alignItems:'center',gap:8}}>
                  <Icon name="check" size={13} color="var(--ok)"/>
                  Tipo seleccionado: <strong>{selectedType.name}</strong>
                </div>
              )}

              {/* Locación */}
              <Field label="Locación" required>
                <select style={INP} value={form.location_id} onChange={f('location_id')}>
                  <option value="">Selecciona una locación…</option>
                  {locations.map((l:any)=>(
                    <option key={l.id} value={l.id}>{l.id} — {l.name} ({l.city})</option>
                  ))}
                </select>
              </Field>

              {/* Auditor */}
              <Field label="Auditor asignado" required>
                <select style={INP} value={form.auditor_id} onChange={f('auditor_id')}>
                  <option value="">Selecciona un auditor…</option>
                  {auditors.map(u=>(
                    <option key={u.id} value={u.id}>{u.name} ({u.role_name})</option>
                  ))}
                </select>
              </Field>

              {/* Fecha */}
              <Field label="Fecha y hora programada" required>
                <input type="datetime-local" style={INP} value={form.scheduled_at} onChange={f('scheduled_at')}/>
              </Field>

              {/* Notas */}
              <Field label="Notas (opcional)">
                <textarea style={{...INP,minHeight:80,resize:'vertical'}} placeholder="Instrucciones especiales, contexto, etc." value={form.notes} onChange={f('notes')}/>
              </Field>

              {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:16,padding:'10px 12px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>router.push('/auditorias')} style={{background:'none',border:'1px solid var(--border)',color:'var(--mid)',padding:'10px 20px',borderRadius:'var(--r-sm)',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  Cancelar
                </button>
                <button onClick={submit} disabled={saving} style={{background:saving?'var(--subtle)':'var(--ink)',color:'white',border:'none',padding:'10px 24px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:saving?'default':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:7}}>
                  <Icon name="calendar" size={13} color="white"/>
                  {saving?'Creando…':'Programar auditoría'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
