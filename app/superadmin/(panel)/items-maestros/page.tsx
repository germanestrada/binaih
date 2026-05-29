'use client'
import { useEffect, useState } from 'react'

interface MasterItem { id:string; code:string; title:string; description?:string; icon:string; category:string; response_type:string; weight_default:number; max_score_default:number; required_default:boolean; ai_enabled:boolean; ai_visual_category?:string; ai_confidence_threshold:number; plan_tier_required:string; active:boolean; ai_prompt?:string; ai_criteria?:string }

const RESPONSE_TYPES = ['binary','scale_5','scale_10','numeric','text','photo']
const AI_CATEGORIES  = ['pricing','ppe','cleanliness','order','signage','inventory','infrastructure','customer','general']
const PLAN_TIERS     = ['starter','professional','enterprise']

const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',marginBottom:8,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

const EMPTY = {code:'',title:'',description:'',icon:'📋',category:'exhibicion',response_type:'binary',weight_default:'1.0',max_score_default:'10',required_default:true,ai_enabled:false,ai_visual_category:'general',ai_confidence_threshold:'80',plan_tier_required:'starter',active:true,ai_prompt:'',ai_criteria:''}

export default function ItemsMaestrosAdminPage() {
  const [items,   setItems]   = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'create'|'edit'|null>(null)
  const [selected,setSelected]= useState<MasterItem|null>(null)
  const [form,    setForm]    = useState<any>(EMPTY)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('')

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
    const body = {
      ...form,
      weight_default:        parseFloat(form.weight_default)||1,
      max_score_default:     parseInt(form.max_score_default)||10,
      ai_confidence_threshold: parseInt(form.ai_confidence_threshold)||80,
    }
    const res  = await fetch(url,{method:isCreate?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null);load()
  }

  const del = async (item:MasterItem) => {
    if(!confirm(`¿Eliminar "${item.title}"?`))return
    const res = await fetch(`/api/superadmin/master-items/${item.id}`,{method:'DELETE'})
    if(!res.ok){const d=await res.json();alert(d.error);return}
    load()
  }

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm((p:any) => ({...p,[k]:e.target.type==='checkbox'?(e.target as HTMLInputElement).checked:e.target.value}))

  const filtered = items.filter(i=>!filter||i.title.toLowerCase().includes(filter.toLowerCase())||i.code.toLowerCase().includes(filter.toLowerCase()))
  const groups   = [...new Set(filtered.map(i=>i.category))]

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20}}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar ítem…"
          style={{border:'1px solid #2a2a2a',borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:'inherit',color:'white',outline:'none',background:'rgba(255,255,255,.04)',width:240}}/>
        <span style={{fontSize:11,color:'#444',fontFamily:'monospace',marginRight:'auto'}}>{filtered.length} ítems</span>
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

      {modal&&(
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
              <div><div style={{fontSize:10,color:'#555',marginBottom:3}}>Categoría</div>
                <input style={INP} value={form.category} onChange={f('category')}/></div>
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
    </div>
  )
}
