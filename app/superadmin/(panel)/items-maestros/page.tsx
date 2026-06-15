'use client'
import { useEffect, useState, useRef } from 'react'

interface MasterItem { id:string; code:string; title:string; description?:string; icon:string; category:string; response_type:string; weight_default:number; max_score_default:number; required_default:boolean; ai_enabled:boolean; ai_visual_category?:string; ai_confidence_threshold:number; plan_tier_required:string; active:boolean; ai_prompt?:string; ai_criteria?:string }

const RESPONSE_TYPES = ['binary','scale_5','scale_10','numeric','text','photo']
const AI_CATEGORIES  = ['pricing','ppe','cleanliness','order','signage','inventory','infrastructure','customer','general']
const PLAN_TIERS     = ['starter','professional','enterprise']

const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',marginBottom:8,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

const EMPTY = {code:'',title:'',description:'',icon:'📋',category:'exhibicion',response_type:'binary',weight_default:'1.0',max_score_default:'10',required_default:true,ai_enabled:false,ai_visual_category:'general',ai_confidence_threshold:'80',plan_tier_required:'starter',active:true,ai_prompt:'',ai_criteria:''}

const CSV_TEMPLATE = `code,title,description,icon,category,response_type,weight_default,max_score_default,required_default,ai_enabled,ai_visual_category,ai_confidence_threshold,plan_tier_required,active,ai_prompt,ai_criteria
EXH-001,Exhibición de productos,Verificar exhibición correcta en góndola,📦,exhibicion,binary,1,10,true,false,general,80,starter,true,,
PRE-001,Etiquetas de precio,Todos los productos deben tener precio visible,🏷️,precios,binary,1,10,true,true,pricing,85,starter,true,Analiza si todos los productos tienen etiqueta de precio visible,CUMPLE: todos los productos tienen precio. NO CUMPLE: productos sin precio visible
`

export default function ItemsMaestrosAdminPage() {
  const [items,    setItems]    = useState<MasterItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'create'|'edit'|'bulk'|'blocked'|null>(null)
  const [selected, setSelected] = useState<MasterItem|null>(null)
  const [form,     setForm]     = useState<any>(EMPTY)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState('')
  // Bulk import state
  const [bulkFile,    setBulkFile]    = useState<File|null>(null)
  const [bulkPreview, setBulkPreview] = useState<any[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult,  setBulkResult]  = useState<any>(null)
  const [bulkError,   setBulkError]   = useState('')
  // Delete blocked state
  const [blockedInfo, setBlockedInfo] = useState<{auditTypeItems:number;templateItems:number}|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileKey, setFileKey] = useState(0)

  const load = () => { setLoading(true); fetch('/api/superadmin/master-items').then(r=>r.json()).then(d=>{setItems(d.data??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const openEdit = (item:MasterItem) => {
    setSelected(item)
    setForm({...item,weight_default:String(item.weight_default),max_score_default:String(item.max_score_default),ai_confidence_threshold:String(item.ai_confidence_threshold)})
    setError(''); setModal('edit')
  }

  const save = async () => {
    setError('')
    const isCreate = modal==='create'
    const url = isCreate?'/api/superadmin/master-items':`/api/superadmin/master-items/${selected?.id}`
    const body = {...form,weight_default:parseFloat(form.weight_default)||1,max_score_default:parseInt(form.max_score_default)||10,ai_confidence_threshold:parseInt(form.ai_confidence_threshold)||80}
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const del = async (item:MasterItem) => {
    // Verificar si está en uso
    const checkRes = await fetch(`/api/superadmin/master-items/${item.id}/check`)
    const check    = await checkRes.json()
    if (check.inUse) {
      setSelected(item)
      setBlockedInfo({auditTypeItems:check.auditTypeItems, templateItems:check.templateItems})
      setModal('blocked')
      return
    }
    if (!confirm(`¿Eliminar "${item.title}"?`)) return
    const res = await fetch(`/api/superadmin/master-items/${item.id}`,{method:'DELETE'})
    if (!res.ok){const d=await res.json();alert(d.error);return}
    load()
  }

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm((p:any)=>({...p,[k]:e.target.type==='checkbox'?(e.target as HTMLInputElement).checked:e.target.value}))

  // ── Bulk import ──────────────────────────────────────────
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], {type:'text/csv'})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url; a.download = 'tveo-master-items-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h=>h.trim())
    return lines.slice(1).filter(l=>l.trim()).map(line => {
      const vals = line.split(',')
      return Object.fromEntries(headers.map((h,i)=>[h, vals[i]?.trim()??'']))
    })
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBulkFile(file)
    setBulkError('')
    setBulkResult(null)
    setBulkPreview([])
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      setBulkPreview(rows.slice(0, 5))
    } catch (err) {
      setBulkError('Error al leer el archivo: ' + String(err))
    }
  }

  const importBulk = async () => {
    if (!bulkFile) return
    setBulkLoading(true); setBulkError(''); setBulkResult(null)
    const text = await bulkFile.text()
    const items = parseCSV(text)
    if (!items.length) { setBulkError('No se encontraron filas en el archivo'); setBulkLoading(false); return }
    const res  = await fetch('/api/superadmin/master-items/bulk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})})
    const data = await res.json()
    setBulkLoading(false)
    if (!res.ok){setBulkError(data.error??'Error');return}
    setBulkResult(data)
    load()
  }

  const filtered = items.filter(i=>!filter||i.title.toLowerCase().includes(filter.toLowerCase())||i.code.toLowerCase().includes(filter.toLowerCase()))
  const groups   = [...new Set(filtered.map(i=>i.category))]

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20}}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar ítem…"
          style={{border:'1px solid #2a2a2a',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',background:'rgba(255,255,255,.04)',width:240}}/>
        <span style={{fontSize:11,color:'#444',fontFamily:'monospace',marginRight:'auto'}}>{filtered.length} ítems</span>
        <button onClick={()=>{setBulkFile(null);setBulkPreview([]);setBulkResult(null);setBulkError('');setFileKey(k=>k+1);setModal('bulk')}} style={{...BTN(),color:'#a78bfa',borderColor:'rgba(167,139,250,.3)'}}>⬆ Cargue masivo</button>
        <button onClick={()=>{setForm(EMPTY);setError('');setModal('create')}} style={BTN(true)}>+ Nuevo ítem</button>
      </div>

      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        groups.map(group=>(
          <div key={group} style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
              <div style={{height:1,width:12,background:'#1e1e1e'}}/>{group}<div style={{flex:1,height:1,background:'#1e1e1e'}}/>
            </div>
            <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,overflow:'hidden'}}>
              {filtered.filter(i=>i.category===group).map((item,i,arr)=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<arr.length-1?'1px solid #161616':'none',opacity:item.active?1:.4}}>
                  <div style={{fontSize:20,flexShrink:0}}>{item.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:2,flexWrap:'wrap'}}>
                      <span style={{fontFamily:'monospace',fontSize:10,color:'#444',background:'#1a1a1a',padding:'1px 6px',borderRadius:4}}>{item.code}</span>
                      <span style={{fontSize:12,fontWeight:500,color:'white'}}>{item.title}</span>
                      {item.ai_enabled&&<span style={{fontSize:10,color:'#a78bfa',background:'rgba(167,139,250,.1)',padding:'1px 6px',borderRadius:4}}>✨ IA · {item.ai_visual_category}</span>}
                    </div>
                    <div style={{fontSize:11,color:'#444'}}>{item.response_type} · max {item.max_score_default} · peso {item.weight_default}</div>
                  </div>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:item.plan_tier_required==='starter'?'rgba(74,222,128,.1)':item.plan_tier_required==='professional'?'rgba(250,204,21,.1)':'rgba(255,255,255,.05)',color:item.plan_tier_required==='starter'?'#4ade80':item.plan_tier_required==='professional'?'#facc15':'#888',flexShrink:0}}>{item.plan_tier_required}</span>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <button onClick={()=>openEdit(item)} style={{...BTN(),padding:'4px 10px'}}>Editar</button>
                    <button onClick={()=>del(item)} style={{background:'none',border:'1px solid rgba(248,113,113,.3)',padding:'4px 10px',borderRadius:6,cursor:'pointer',fontSize:11,color:'#f87171',fontFamily:'inherit'}}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal crear/editar */}
      {(modal==='create'||modal==='edit')&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:540,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,.6)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:18,color:'white',fontWeight:300}}>{modal==='create'?'Nuevo ítem maestro':'Editar ítem'}</div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Código *</div><input style={INP} placeholder="EXH-001" value={form.code} onChange={f('code')}/></div>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Ícono</div><input style={INP} placeholder="🏷️" value={form.icon} onChange={f('icon')}/></div>
            </div>
            <div style={{fontSize:10,color:'#555',marginBottom:3}}>Título *</div>
            <input style={INP} placeholder="Nombre del ítem" value={form.title} onChange={f('title')}/>
            <div style={{fontSize:10,color:'#555',marginBottom:3}}>Descripción</div>
            <textarea style={{...INP,minHeight:56,resize:'vertical'}} placeholder="Descripción detallada" value={form.description??''} onChange={f('description')}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Categoría</div><input style={INP} value={form.category} onChange={f('category')}/></div>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Tipo respuesta</div>
                <select style={{...INP,cursor:'pointer'}} value={form.response_type} onChange={f('response_type')}>
                  {RESPONSE_TYPES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Peso default</div><input style={INP} type="number" step="0.1" value={form.weight_default} onChange={f('weight_default')}/></div>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Score máx</div><input style={INP} type="number" value={form.max_score_default} onChange={f('max_score_default')}/></div>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Plan requerido</div>
                <select style={{...INP,cursor:'pointer'}} value={form.plan_tier_required} onChange={f('plan_tier_required')}>
                  {PLAN_TIERS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Cat. visual IA</div>
                <select style={{...INP,cursor:'pointer'}} value={form.ai_visual_category??'general'} onChange={f('ai_visual_category')}>
                  {AI_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:16,margin:'8px 0 12px'}}>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#888',cursor:'pointer'}}>
                <input type="checkbox" checked={form.required_default} onChange={f('required_default')}/>Requerido</label>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#888',cursor:'pointer'}}>
                <input type="checkbox" checked={form.ai_enabled} onChange={f('ai_enabled')}/>✨ IA habilitada</label>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#888',cursor:'pointer'}}>
                <input type="checkbox" checked={form.active} onChange={f('active')}/>Activo</label>
            </div>
            {form.ai_enabled&&(
              <>
                <div style={{fontSize:10,color:'#555',marginBottom:3}}>Prompt de IA</div>
                <textarea style={{...INP,minHeight:72,resize:'vertical'}} value={form.ai_prompt??''} onChange={f('ai_prompt')} placeholder="Instrucción principal para el modelo de visión"/>
                <div style={{fontSize:10,color:'#555',marginBottom:3}}>Criterios de evaluación</div>
                <textarea style={{...INP,minHeight:72,resize:'vertical'}} value={form.ai_criteria??''} onChange={f('ai_criteria')} placeholder="CUMPLE: ... NO CUMPLE: ... PARCIAL: ..."/>
                <div style={{fontSize:10,color:'#555',marginBottom:3}}>Umbral de confianza (%)</div>
                <input style={INP} type="number" min="0" max="100" value={form.ai_confidence_threshold} onChange={f('ai_confidence_threshold')}/>
              </>
            )}
            {error&&<div style={{fontSize:12,color:'#f87171',marginBottom:12}}>{error}</div>}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
              <button onClick={save} style={BTN(true)}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cargue masivo */}
      {modal==='bulk'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:600,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,.6)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:18,color:'white',fontWeight:300}}>Cargue masivo de ítems</div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
            </div>

            {/* Instrucciones */}
            <div style={{background:'rgba(167,139,250,.08)',border:'1px solid rgba(167,139,250,.2)',borderRadius:8,padding:'12px 16px',marginBottom:16,fontSize:12,color:'#c4b5fd',lineHeight:1.6}}>
              <div style={{fontWeight:600,marginBottom:6}}>Formato requerido (CSV)</div>
              Columnas: <span style={{fontFamily:'monospace'}}>code, title, description, icon, category, response_type, weight_default, max_score_default, required_default, ai_enabled, ai_visual_category, ai_confidence_threshold, plan_tier_required, active, ai_prompt, ai_criteria</span>
              <div style={{marginTop:8}}>Si el código ya existe, se actualizará el ítem (upsert por código).</div>
            </div>

            {/* Descargar plantilla */}
            <button onClick={downloadTemplate} style={{...BTN(),marginBottom:16,color:'#a78bfa',borderColor:'rgba(167,139,250,.3)',width:'100%',padding:'10px'}}>
              ⬇ Descargar plantilla CSV
            </button>

            {/* File picker */}
            <input key={fileKey} ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{display:'none'}}/>
            <div onClick={()=>fileRef.current?.click()} style={{
              border:'1px dashed #2a2a2a',borderRadius:10,padding:'24px',textAlign:'center',cursor:'pointer',marginBottom:16,
              background:bulkFile?'rgba(74,222,128,.05)':'rgba(255,255,255,.02)',
              transition:'background .2s',
            }}>
              {bulkFile?(
                <div style={{color:'#4ade80',fontSize:13}}>✓ {bulkFile.name} · {Math.round(bulkFile.size/1024)}KB</div>
              ):(
                <div style={{color:'#555',fontSize:12}}>Haz clic para seleccionar el archivo CSV<br/><span style={{fontSize:10,color:'#333',marginTop:4,display:'block'}}>Máximo 200 ítems por cargue</span></div>
              )}
            </div>

            {/* Preview */}
            {bulkPreview.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,color:'#555',marginBottom:6,textTransform:'uppercase',letterSpacing:'1px'}}>Vista previa (primeras {bulkPreview.length} filas)</div>
                <div style={{background:'#0a0a0a',borderRadius:8,padding:'10px',overflow:'auto',maxHeight:160}}>
                  {bulkPreview.map((row,i)=>(
                    <div key={i} style={{fontSize:11,color:'#888',fontFamily:'monospace',marginBottom:4,display:'flex',gap:8}}>
                      <span style={{color:'#444',width:20,flexShrink:0}}>{i+1}</span>
                      <span style={{color:'#a78bfa'}}>{row.code}</span>
                      <span style={{color:'white'}}>{row.title}</span>
                      <span style={{color:'#555'}}>{row.category}</span>
                      <span style={{color:'#555'}}>{row.response_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado */}
            {bulkResult&&(
              <div style={{marginBottom:12}}>
                <div style={{background:bulkResult.errors>0?'rgba(251,191,36,.08)':'rgba(74,222,128,.08)',border:`1px solid ${bulkResult.errors>0?'rgba(251,191,36,.2)':'rgba(74,222,128,.2)'}`,borderRadius:8,padding:'12px 16px',marginBottom:8,fontSize:12,color:bulkResult.errors>0?'#fbbf24':'#4ade80'}}>
                  {bulkResult.errors===0?'✓':'⚠'} {bulkResult.created} procesados · {bulkResult.errors} errores de {(bulkResult.created+bulkResult.errors)} total
                </div>
                {bulkResult.log?.filter((l:any)=>l.status==='error').length>0&&(
                  <div style={{background:'#0a0a0a',borderRadius:8,padding:'10px 12px',maxHeight:180,overflowY:'auto'}}>
                    <div style={{fontSize:10,color:'#555',marginBottom:6,textTransform:'uppercase',letterSpacing:'1px'}}>Errores detallados</div>
                    {bulkResult.log.filter((l:any)=>l.status==='error').map((l:any,i:number)=>(
                      <div key={i} style={{fontSize:11,color:'#f87171',fontFamily:'monospace',marginBottom:3,display:'flex',gap:8}}>
                        <span style={{color:'#444',width:20}}>F{l.row}</span>
                        <span style={{color:'#a78bfa',flexShrink:0}}>{l.code}</span>
                        <span style={{color:'#888',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</span>
                        <span style={{color:'#f87171',flexShrink:0}}>{l.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {bulkError&&<div style={{fontSize:12,color:'#f87171',marginBottom:12,padding:'8px 12px',background:'rgba(248,113,113,.08)',borderRadius:6}}>{bulkError}</div>}

            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>{setModal(null);setFileKey(k=>k+1)}} style={BTN()}>Cerrar</button>
              <button onClick={importBulk} disabled={!bulkFile||bulkLoading} style={{...BTN(true),opacity:!bulkFile||bulkLoading?.5:1,cursor:!bulkFile?'default':'pointer'}}>
                {bulkLoading?'Importando…':'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bloqueado */}
      {modal==='blocked'&&selected&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:440,boxShadow:'0 32px 80px rgba(0,0,0,.6)'}}>
            <div style={{fontSize:18,color:'white',fontWeight:300,marginBottom:16}}>No se puede eliminar</div>
            <div style={{background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:8,padding:'14px 16px',marginBottom:16,fontSize:13,color:'#f87171',lineHeight:1.6}}>
              <div style={{fontWeight:600,marginBottom:6}}>⚠️ Ítem en uso</div>
              El ítem <strong style={{color:'white'}}>{selected.title}</strong> ({selected.code}) está siendo utilizado:
              {blockedInfo?.auditTypeItems ? <div style={{marginTop:6}}>· En {blockedInfo.auditTypeItems} tipo{blockedInfo.auditTypeItems!==1?'s':''} de auditoría</div> : null}
              {blockedInfo?.templateItems  ? <div style={{marginTop:2}}>· En {blockedInfo.templateItems} plantilla{blockedInfo.templateItems!==1?'s':''}</div> : null}
            </div>
            <div style={{fontSize:12,color:'#555',marginBottom:20,lineHeight:1.6}}>
              Para eliminarlo, primero retíralo de los tipos de auditoría y plantillas donde está siendo usado. Puedes desactivarlo si no quieres que esté disponible para nuevas auditorías.
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(null)} style={BTN()}>Cerrar</button>
              <button onClick={async()=>{
                await fetch(`/api/superadmin/master-items/${selected.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:false})})
                setModal(null); load()
              }} style={{...BTN(),color:'#facc15',borderColor:'rgba(250,204,21,.3)'}}>Desactivar en su lugar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}