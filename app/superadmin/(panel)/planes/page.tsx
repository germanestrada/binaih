'use client'
import { useEffect, useState } from 'react'

interface Plan { id:string; name:string; tier:string; max_locations:number; max_users:number; max_audits_month:number; map_enabled:boolean; api_enabled:boolean; ai_enabled:boolean; price_usd:number; active:boolean }
const INP: React.CSSProperties = {width:'100%',border:'1px solid #2a2a2a',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'white',outline:'none',marginBottom:10,background:'rgba(255,255,255,.04)'}
const BTN = (p=false): React.CSSProperties => ({background:p?'white':'rgba(255,255,255,.06)',color:p?'#0a0a0a':'#888',border:`1px solid ${p?'white':'#2a2a2a'}`,padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

const EMPTY_PLAN = {name:'',tier:'starter',max_locations:'10',max_users:'5',max_audits_month:'20',price_usd:'0',map_enabled:false,api_enabled:false,ai_enabled:false,active:true}

export default function PlanesPage() {
  const [creating, setCreating] = useState(false)
  const [newForm,  setNewForm]  = useState<any>(EMPTY_PLAN)
  const [newError, setNewError] = useState('')
  const [plans,   setPlans]   = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string|null>(null)
  const [vals,    setVals]    = useState<Record<string,any>>({})

  const load = () => { setLoading(true); fetch('/api/superadmin/planes').then(r=>r.json()).then(d=>{setPlans(d.data??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const save = async (id:string) => {
    await fetch('/api/superadmin/planes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...vals[id]})})
    setEditing(null);load()
  }

  const startEdit = (p:Plan) => {
    setVals(v=>({...v,[p.id]:{name:p.name,max_locations:p.max_locations,max_users:p.max_users,max_audits_month:p.max_audits_month,price_usd:p.price_usd,map_enabled:p.map_enabled,api_enabled:p.api_enabled,ai_enabled:p.ai_enabled,active:p.active}}))
    setEditing(p.id)
  }

  const fv = (id:string,k:string) => (e:React.ChangeEvent<HTMLInputElement>) => setVals(v=>({...v,[id]:{...v[id],[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}}))

  const createPlan = async () => {
    setNewError('')
    const body = {...newForm, max_locations:parseInt(newForm.max_locations), max_users:parseInt(newForm.max_users), max_audits_month:parseInt(newForm.max_audits_month), price_usd:parseFloat(newForm.price_usd)||0}
    const res  = await fetch('/api/superadmin/planes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setNewError(data.error??'Error');return}
    setCreating(false); setNewForm(EMPTY_PLAN); load()
  }
  const nf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setNewForm((p:any)=>({...p,[k]:e.target.type==='checkbox'?(e.target as HTMLInputElement).checked:e.target.value}))

  return (
    <div style={{padding:'28px 32px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:600,color:'#444',textTransform:'uppercase',letterSpacing:'1.2px'}}>Planes de suscripción</div>
        <button onClick={()=>setCreating(true)} style={BTN(true)}>+ Nuevo plan</button>
      </div>
      {loading?<div style={{color:'#444',fontSize:13}}>Cargando…</div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {plans.map(p=>(
            <div key={p.id} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,padding:'20px',opacity:p.active?1:.5}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  {editing===p.id?<input style={{...INP,marginBottom:0,fontSize:18,fontWeight:300}} value={vals[p.id]?.name} onChange={fv(p.id,'name')}/>:
                  <div style={{fontSize:20,fontWeight:300,color:'white'}}>{p.name}</div>}
                  <div style={{fontSize:11,color:'#555',marginTop:2}}>{p.tier}</div>
                </div>
              </div>
              {editing===p.id?(
                <div>
                  {[['max_locations','Locaciones máx.'],['max_users','Usuarios máx.'],['max_audits_month','Auditorías/mes'],['price_usd','Precio USD/mes']].map(([k,l])=>(
                    <div key={k}>
                      <div style={{fontSize:10,color:'#444',marginBottom:3}}>{l}</div>
                      <input style={{...INP}} type="number" value={vals[p.id]?.[k]??''} onChange={fv(p.id,k)}/>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:12,marginBottom:12}}>
                    {[['map_enabled','Mapa'],['api_enabled','API'],['ai_enabled','IA']].map(([k,l])=>(
                      <label key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#888',cursor:'pointer'}}>
                        <input type="checkbox" checked={vals[p.id]?.[k]??false} onChange={fv(p.id,k)}/>{l}
                      </label>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setEditing(null)} style={BTN()}>Cancelar</button>
                    <button onClick={()=>save(p.id)} style={BTN(true)}>Guardar</button>
                  </div>
                </div>
              ):(
                <div>
                  {[['Locaciones',p.max_locations],['Usuarios',p.max_users],['Auditorías/mes',p.max_audits_month],['Precio','$'+p.price_usd+' USD']].map(([l,v])=>(
                    <div key={String(l)} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:'1px solid #1a1a1a'}}>
                      <span style={{color:'#555'}}>{l}</span><span style={{color:'#aaa'}}>{v}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                    {[['Mapa',p.map_enabled],['API',p.api_enabled],['IA',p.ai_enabled]].map(([l,v])=>(
                      <span key={String(l)} style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:v?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)',color:v?'#4ade80':'#444'}}>{v?'✓':'-'} {l}</span>
                    ))}
                  </div>
                  <button onClick={()=>startEdit(p)} style={{...BTN(),marginTop:12,width:'100%'}}>Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {creating&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#111',border:'1px solid #222',borderRadius:16,padding:28,width:440,boxShadow:'0 32px 80px rgba(0,0,0,.6)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:18,color:'white',fontWeight:300}}>Nuevo plan</div>
              <button onClick={()=>setCreating(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:18}}>✕</button>
            </div>
            <div style={{fontSize:10,color:'#444',marginBottom:3}}>Nombre</div><input style={INP} value={newForm.name} onChange={nf('name')} placeholder="Professional"/>
            <div style={{fontSize:10,color:'#444',marginBottom:3}}>Tier</div>
            <select style={{...INP,cursor:'pointer'}} value={newForm.tier} onChange={nf('tier')}>
              {['starter','professional','enterprise'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            {[['max_locations','Locaciones máx.'],['max_users','Usuarios máx.'],['max_audits_month','Auditorías/mes'],['price_usd','Precio USD/mes']].map(([k,l])=>(
              <div key={k}><div style={{fontSize:10,color:'#444',marginBottom:3}}>{l}</div><input style={INP} type="number" value={newForm[k]} onChange={nf(k)}/></div>
            ))}
            <div style={{display:'flex',gap:12,margin:'8px 0 12px'}}>
              {[['map_enabled','Mapa'],['api_enabled','API'],['ai_enabled','IA']].map(([k,l])=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#888',cursor:'pointer'}}>
                  <input type="checkbox" checked={newForm[k]} onChange={nf(k)}/>{l}
                </label>
              ))}
            </div>
            {newError&&<div style={{fontSize:12,color:'#f87171',marginBottom:12}}>{newError}</div>}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setCreating(false)} style={BTN()}>Cancelar</button>
              <button onClick={createPlan} style={BTN(true)}>Crear plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
