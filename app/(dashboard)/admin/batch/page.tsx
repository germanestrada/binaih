'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'

interface BatchJob {
  id:string; status:string; source_path:string; storage_provider:string
  total_images?:number; processed_images:number; auto_approved:number
  pending_review:number; failed_images:number
  created_at:string; started_at?:string; completed_at?:string
  locations?:{name:string;city:string}
  audit_types?:{name:string;icon:string}
  audit_id?:string
}
interface Location {id:string;name:string;city:string}
interface AuditType {id:string;name:string;icon:string}

const STATUS_BADGE: Record<string,{label:string;bg:string;color:string}> = {
  pending:    {label:'Pendiente',  bg:'var(--surface)',color:'var(--subtle)'},
  processing: {label:'Procesando', bg:'var(--warn-bg)', color:'var(--warn)'},
  completed:  {label:'Completado', bg:'var(--ok-bg)',   color:'var(--ok)'},
  partial:    {label:'Parcial',    bg:'var(--warn-bg)', color:'var(--warn)'},
  failed:     {label:'Fallido',    bg:'var(--err-bg)',  color:'var(--err)'},
}

const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:12,background:'white'}
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--ink)':'var(--surface)',color:p?'white':'var(--mid)',border:`1px solid ${p?'var(--ink)':'var(--border)'}`,padding:'8px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:480,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.25)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',display:'flex'}}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function BatchPage() {
  const router = useRouter()
  const [jobs,      setJobs]      = useState<BatchJob[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [types,     setTypes]     = useState<AuditType[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [processing,setProcessing]= useState<string|null>(null)
  const [form,      setForm]      = useState({location_id:'',audit_type_id:'',source_path:'inbox/',storage_provider:'r2'})
  const [imageUrls, setImageUrls] = useState('')
  const [error,     setError]     = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/ai/batch').then(r=>r.json()),
      fetch('/api/stores').then(r=>r.json()),
      fetch('/api/audit-types').then(r=>r.json()),
    ]).then(([b,l,t])=>{setJobs(b.data??[]);setLocations(l.data??[]);setTypes(t.data??[]);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const create = async () => {
    setError('')
    if(!form.location_id||!form.audit_type_id||!form.source_path){setError('Completa todos los campos');return}
    const res  = await fetch('/api/ai/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(false);load()
  }

  const process = async (job: BatchJob) => {
    const urls = imageUrls.split('\n').map(u=>u.trim()).filter(Boolean)
    if(!urls.length){alert('Ingresa al menos una URL de imagen');return}
    setProcessing(job.id)
    const res  = await fetch(`/api/ai/batch/${job.id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageUrls:urls})})
    const data = await res.json()
    setProcessing(null)
    if(data.auditId) router.push(`/auditorias/${data.auditId}`)
    else load()
  }

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px'}}>Análisis Batch — Modo automático</div>
          <div style={{fontSize:12,color:'var(--subtle)',marginTop:4}}>El cliente deposita imágenes → la IA analiza → propone resultados</div>
        </div>
        <button onClick={()=>setModal(true)} style={BTN(true)}>+ Nuevo job</button>
      </div>

      {/* Instrucciones */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'16px 20px',marginBottom:20,fontSize:12,color:'var(--mid)',lineHeight:1.7}}>
        <strong style={{color:'var(--ink)'}}>Flujo del Modo 3:</strong><br/>
        1. Configura las credenciales del storage en <strong>Admin → Configuración → grupo "storage"</strong><br/>
        2. Crea un job indicando la locación, tipo de auditoría y ruta de las imágenes<br/>
        3. El sistema descarga las imágenes, las analiza con IA y crea una auditoría automática<br/>
        4. Los ítems con confianza ≥ umbral se auto-aprueban. Los demás quedan en revisión<br/>
        5. El admin/auditor revisa solo los ítems de baja confianza
      </div>

      {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(
        jobs.length===0?(
          <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>
            Sin jobs de batch. Crea el primero para empezar.
          </div>
        ):(
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {jobs.map((job,i)=>{
              const b   = STATUS_BADGE[job.status]??STATUS_BADGE.pending
              const pct = job.total_images ? Math.round(job.processed_images/job.total_images*100) : 0
              return (
                <div key={job.id} style={{padding:'16px 20px',borderBottom:i<jobs.length-1?'1px solid var(--border2)':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:job.status==='processing'?10:0}}>
                    <div style={{fontSize:24,flexShrink:0}}>{job.audit_types?.icon??'📋'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:2}}>
                        {job.audit_types?.name} — {job.locations?.name??'—'}
                      </div>
                      <div style={{fontSize:11,color:'var(--subtle)'}}>
                        {job.storage_provider.toUpperCase()} · {job.source_path} · {new Date(job.created_at).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                      {job.total_images&&(
                        <div style={{textAlign:'center',fontSize:11,color:'var(--subtle)'}}>
                          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{job.auto_approved}</div>
                          <div>auto</div>
                        </div>
                      )}
                      {job.pending_review>0&&(
                        <div style={{textAlign:'center',fontSize:11,color:'var(--warn)'}}>
                          <div style={{fontFamily:'var(--font-serif)',fontSize:18}}>{job.pending_review}</div>
                          <div>revisión</div>
                        </div>
                      )}
                      <span style={{fontSize:11,fontWeight:500,padding:'3px 10px',borderRadius:20,background:b.bg,color:b.color}}>{b.label}</span>
                      {job.audit_id&&<button onClick={()=>router.push(`/auditorias/${job.audit_id}`)} style={{background:'none',border:'1px solid var(--border)',padding:'5px 12px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--mid)',fontFamily:'inherit'}}>Ver auditoría</button>}
                      {job.status==='pending'&&(
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          <textarea value={imageUrls} onChange={e=>setImageUrls(e.target.value)} placeholder="URLs de imágenes (una por línea)" style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'6px 8px',fontSize:11,fontFamily:'var(--font-mono)',width:240,height:60,resize:'none',outline:'none'}}/>
                          <button onClick={()=>process(job)} disabled={processing===job.id} style={{...BTN(true),padding:'6px 12px',fontSize:11}}>
                            {processing===job.id?'Procesando…':'▶ Iniciar análisis'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {job.status==='processing'&&job.total_images&&(
                    <div>
                      <div style={{height:4,background:'var(--border2)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:'var(--warn)',borderRadius:2,transition:'width .3s'}}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--subtle)',marginTop:4}}>{job.processed_images}/{job.total_images} imágenes procesadas</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {modal&&(
        <Modal title="Nuevo job de análisis batch" onClose={()=>setModal(false)}>
          <select style={{...INP,cursor:'pointer'}} value={form.location_id} onChange={e=>setForm(p=>({...p,location_id:e.target.value}))}>
            <option value="">Selecciona una locación *</option>
            {locations.map((l:any)=><option key={l.id} value={l.id}>{l.name} ({l.city})</option>)}
          </select>
          <select style={{...INP,cursor:'pointer'}} value={form.audit_type_id} onChange={e=>setForm(p=>({...p,audit_type_id:e.target.value}))}>
            <option value="">Selecciona tipo de auditoría *</option>
            {types.map(t=><option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
          </select>
          <input style={INP} placeholder="Ruta en el bucket (ej: inbox/tienda-001/)" value={form.source_path} onChange={e=>setForm(p=>({...p,source_path:e.target.value}))}/>
          <select style={{...INP,cursor:'pointer'}} value={form.storage_provider} onChange={e=>setForm(p=>({...p,storage_provider:e.target.value}))}>
            <option value="r2">Cloudflare R2</option>
            <option value="s3">AWS S3</option>
            <option value="gcs">Google Cloud Storage</option>
            <option value="ftp">FTP/SFTP</option>
          </select>
          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(false)} style={BTN()}>Cancelar</button>
            <button onClick={create} style={BTN(true)}>Crear job</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
