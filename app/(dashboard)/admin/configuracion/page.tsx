'use client'
import { useEffect, useState } from 'react'

interface Config { id:string; key:string; value:string; type:string; group_name:string; label:string; description?:string; is_secret:boolean; active:boolean }
const BTN = (p=false): React.CSSProperties => ({background:p?'var(--accent)':'var(--surface)',color:p?'var(--accent-ink)':'var(--mid)',border:`1px solid ${p?'var(--accent)':'var(--border)'}`,padding:'7px 16px',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

export default function ConfigPage() {
  const [configs,setConfigs] = useState<Config[]>([])
  const [loading,setLoading] = useState(true)
  const [editing,setEditing] = useState<string|null>(null)
  const [values,setValues]   = useState<Record<string,string>>({})
  const [saved,setSaved]     = useState<string|null>(null)

  const load = () => { setLoading(true); fetch('/api/admin/config').then(r=>r.json()).then(d=>{setConfigs(d.data??[]);setLoading(false)}) }
  useEffect(()=>{load()},[])

  const groups = [...new Set(configs.map(c=>c.group_name))]

  const save = async (c:Config) => {
    const newVal = values[c.id] ?? c.value
    await fetch('/api/admin/config',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,value:newVal})})
    setSaved(c.id); setTimeout(()=>setSaved(null),2000)
    setEditing(null); load()
  }

  const toggleActive = async (c:Config) => {
    await fetch('/api/admin/config',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,active:!c.active})})
    load()
  }

  if(loading) return <div style={{padding:32,color:'var(--subtle)',fontSize:13}}>Cargando…</div>

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:20}}>
        Parámetros del sistema
      </div>
      {groups.map(group=>(
        <div key={group} style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--mid)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <div style={{height:1,width:12,background:'var(--border)'}}/>
            {group}
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {configs.filter(c=>c.group_name===group).map((c,i,arr)=>(
              <div key={c.id} style={{padding:'14px 16px',borderBottom:i<arr.length-1?'1px solid var(--border2)':'none',opacity:c.active?1:.5}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{c.label}</span>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)',background:'var(--surface)',padding:'1px 6px',borderRadius:4,border:'1px solid var(--border)'}}>{c.key}</span>
                      {c.is_secret&&<span style={{fontSize:10,color:'var(--warn)',fontWeight:600}}>🔒 secreto</span>}
                      <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--subtle)'}}>{c.type}</span>
                    </div>
                    {c.description&&<div style={{fontSize:11,color:'var(--subtle)',marginBottom:8}}>{c.description}</div>}
                    {editing===c.id?(
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input
                          type={c.is_secret?'password':'text'}
                          defaultValue={c.is_secret?'':c.value}
                          placeholder={c.is_secret?'Nuevo valor secreto…':'Valor'}
                          onChange={e=>setValues(v=>({...v,[c.id]:e.target.value}))}
                          style={{flex:1,border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'7px 10px',fontSize:12,fontFamily:'var(--font-mono)',color:'var(--ink)',outline:'none'}}
                        />
                        <button onClick={()=>save(c)} style={BTN(true)}>Guardar</button>
                        <button onClick={()=>setEditing(null)} style={BTN()}>Cancelar</button>
                      </div>
                    ):(
                      <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:c.value?'var(--ink)':'var(--subtle)',background:'var(--surface)',padding:'6px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border2)'}}>
                        {c.is_secret?'••••••••':(c.value||'— sin valor —')}
                        {saved===c.id&&<span style={{color:'var(--ok)',marginLeft:8,fontSize:11}}>✓ guardado</span>}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0,paddingTop:2}}>
                    {editing!==c.id&&<button onClick={()=>setEditing(c.id)} style={BTN()}>Editar</button>}
                    <button onClick={()=>toggleActive(c)} style={{...BTN(),color:c.active?'var(--warn)':'var(--ok)'}}>{c.active?'Desactivar':'Activar'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
