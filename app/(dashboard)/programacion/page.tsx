'use client'
import { useEffect, useState, useCallback } from 'react'

interface Schedule {
  id:string; frequency:string; scheduled_time:string; timezone:string
  starts_at:string; ends_at?:string; active:boolean; next_run_at?:string
  last_run_at?:string; notes?:string; week_days?:number[]; month_day?:number
  locations:{id:string;name:string;city:string}
  audit_types:{id:string;name:string;icon:string;color:string}
  users:{id:string;name:string;email:string}
}
interface Location    { id:string; name:string; city:string }
interface AuditType   { id:string; name:string; icon:string }
interface User        { id:string; name:string; role_name:string }

const FREQ_LABEL: Record<string,string> = {
  once:'Una vez', daily:'Diaria', weekly:'Semanal', monthly:'Mensual'
}
const FREQ_COLOR: Record<string,string> = {
  once:'#64748b', daily:'#1558b0', weekly:'#7c3aed', monthly:'#059669'
}
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const EMPTY_FORM = {
  location_id:'', audit_type_id:'', auditor_id:'',
  frequency:'weekly', week_days:[1,3,5], month_day:1,
  scheduled_time:'08:00', timezone:'America/Bogota',
  starts_at: new Date().toISOString().slice(0,10),
  ends_at:'', notes:'',
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--white)',borderRadius:'var(--r-xl)',padding:28,width:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:18,color:'var(--ink)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--subtle)',fontSize:18}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function ProgramacionPage() {
  const [schedules,  setSchedules]  = useState<Schedule[]>([])
  const [locations,  setLocations]  = useState<Location[]>([])
  const [auditTypes, setAuditTypes] = useState<AuditType[]>([])
  const [users,      setUsers]      = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState<'calendar'|'list'>('calendar')
  const [modal,      setModal]      = useState<'create'|'edit'|null>(null)
  const [selected,   setSelected]   = useState<Schedule|null>(null)
  const [form,       setForm]       = useState<any>(EMPTY_FORM)
  const [error,      setError]      = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/schedules').then(r=>r.json()),
      fetch('/api/stores').then(r=>r.json()),
      fetch('/api/audit-types').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
    ]).then(([s,loc,at,u])=>{
      setSchedules(s.data??[])
      setLocations(loc.data??[])
      setAuditTypes(at.data??[])
      setUsers((u.data??[]).filter((u:User)=>['admin','auditor'].includes(u.role_name)))
      setLoading(false)
    })
  },[])

  useEffect(()=>{load()},[load])

  const INP: React.CSSProperties = {width:'100%',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'8px 10px',fontSize:13,fontFamily:'inherit',color:'var(--ink)',outline:'none',marginBottom:10}
  const BTN = (p=false): React.CSSProperties => ({background:p?'var(--ink)':'var(--surface)',color:p?'white':'var(--mid)',border:`1px solid ${p?'var(--ink)':'var(--border)'}`,padding:'8px 18px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'})

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm((p:any)=>({...p,[k]:e.target.value}))

  const save = async () => {
    setError('')
    const isEdit = modal==='edit'
    const url  = isEdit ? `/api/schedules/${selected?.id}` : '/api/schedules'
    const body = {
      ...form,
      week_days: form.frequency==='weekly' ? form.week_days : null,
      month_day: form.frequency==='monthly' ? parseInt(form.month_day) : null,
      ends_at:   form.ends_at || null,
    }
    const res  = await fetch(url,{method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    if(!res.ok){setError(data.error??'Error');return}
    setModal(null); load()
  }

  const toggle = async (s:Schedule) => {
    await fetch(`/api/schedules/${s.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!s.active})})
    load()
  }

  const del = async (s:Schedule) => {
    if(!confirm(`¿Eliminar la programación de "${s.locations.name}"?`))return
    await fetch(`/api/schedules/${s.id}`,{method:'DELETE'})
    load()
  }

  const openEdit = (s:Schedule) => {
    setSelected(s)
    setForm({
      location_id:s.locations.id, audit_type_id:s.audit_types.id,
      auditor_id:s.users.id, frequency:s.frequency,
      week_days:s.week_days??[1], month_day:s.month_day??1,
      scheduled_time:s.scheduled_time, timezone:s.timezone,
      starts_at:s.starts_at, ends_at:s.ends_at??'', notes:s.notes??'',
    })
    setError(''); setModal('edit')
  }

  // ── Calendario ────────────────────────────────────────────
  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()

  // Mapear schedules a días del mes actual
  const calendarEvents: Record<number, Schedule[]> = {}
  schedules.filter(s=>s.active).forEach(s => {
    if (!s.next_run_at) return
    const d = new Date(s.next_run_at)
    if (d.getFullYear()===year && d.getMonth()===month) {
      const day = d.getDate()
      if (!calendarEvents[day]) calendarEvents[day] = []
      calendarEvents[day].push(s)
    }
  })

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()-1))
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+1))

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 24px',borderBottom:'1px solid var(--border)',background:'var(--white)',flexShrink:0}}>
        <div style={{display:'flex',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',overflow:'hidden'}}>
          {(['calendar','list'] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:'7px 14px',fontSize:12,border:'none',cursor:'pointer',fontFamily:'inherit',
              background:view===v?'var(--ink)':'var(--white)',
              color:view===v?'white':'var(--subtle)',
            }}>{v==='calendar'?'📅 Calendario':'📋 Lista'}</button>
          ))}
        </div>
        {view==='calendar'&&(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={prevMonth} style={{...BTN(),padding:'7px 10px'}}>‹</button>
            <span style={{fontSize:14,fontWeight:500,color:'var(--ink)',minWidth:120,textAlign:'center'}}>
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} style={{...BTN(),padding:'7px 10px'}}>›</button>
          </div>
        )}
        <span style={{fontSize:11,color:'var(--subtle)',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>
          {schedules.filter(s=>s.active).length} programaciones activas
        </span>
        <button onClick={()=>{setForm(EMPTY_FORM);setError('');setModal('create')}} style={BTN(true)}>
          + Nueva programación
        </button>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
        {loading?<div style={{color:'var(--subtle)',fontSize:13}}>Cargando…</div>:(

          view==='calendar' ? (
            /* ── Vista Calendario ── */
            <div>
              {/* Cabecera días */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,marginBottom:1}}>
                {DAYS.map(d=>(
                  <div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px',padding:'8px 0'}}>{d}</div>
                ))}
              </div>
              {/* Grid de días */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
                {Array.from({length:firstDay}).map((_,i)=>(
                  <div key={`e${i}`} style={{minHeight:100,background:'var(--surface)',borderRadius:'var(--r-sm)'}}/>
                ))}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day    = i+1
                  const events = calendarEvents[day] ?? []
                  const isToday = new Date().getDate()===day && new Date().getMonth()===month && new Date().getFullYear()===year
                  return (
                    <div key={day} style={{
                      minHeight:100,background:'var(--white)',borderRadius:'var(--r-sm)',
                      border:`1px solid ${isToday?'var(--ink)':'var(--border2)'}`,
                      padding:'6px',
                    }}>
                      <div style={{fontSize:12,fontWeight:isToday?600:400,color:isToday?'var(--ink)':'var(--subtle)',marginBottom:4}}>{day}</div>
                      {events.map(ev=>(
                        <div key={ev.id} onClick={()=>openEdit(ev)} style={{
                          fontSize:10,padding:'2px 5px',borderRadius:4,marginBottom:2,
                          background:(ev.audit_types.color||'#1558b0')+'22',
                          color:ev.audit_types.color||'#1558b0',
                          cursor:'pointer',lineHeight:1.4,
                          border:`1px solid ${ev.audit_types.color||'#1558b0'}44`,
                        }}>
                          {ev.audit_types.icon} {ev.locations.name.slice(0,14)}
                          <span style={{float:'right',opacity:.6}}>{ev.scheduled_time}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* ── Vista Lista ── */
            schedules.length===0?(
              <div style={{textAlign:'center',padding:'48px',color:'var(--subtle)',fontSize:13}}>
                Sin programaciones. Crea la primera con el botón de arriba.
              </div>
            ):(
              <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
                {schedules.map((s,i)=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:i<schedules.length-1?'1px solid var(--border2)':'none',opacity:s.active?1:.5}}>
                    {/* Tipo auditoría */}
                    <div style={{width:40,height:40,borderRadius:'var(--r-md)',background:(s.audit_types.color||'#111')+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                      {s.audit_types.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                        <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{s.locations.name}</span>
                        <span style={{fontSize:10,color:'var(--subtle)'}}>{s.locations.city}</span>
                        <span style={{fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:20,background:(FREQ_COLOR[s.frequency]||'#111')+'22',color:FREQ_COLOR[s.frequency]||'#111'}}>
                          {FREQ_LABEL[s.frequency]}
                        </span>
                        {s.frequency==='weekly'&&s.week_days&&(
                          <span style={{fontSize:10,color:'var(--subtle)'}}>{s.week_days.map(d=>DAYS[d]).join(', ')}</span>
                        )}
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:11,color:'var(--subtle)',flexWrap:'wrap'}}>
                        <span>🕐 {s.scheduled_time}</span>
                        <span>👤 {s.users.name}</span>
                        <span>📋 {s.audit_types.name}</span>
                        {s.next_run_at&&<span style={{color:'var(--ink)'}}>Próxima: {new Date(s.next_run_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}</span>}
                        {s.last_run_at&&<span>Última: {new Date(s.last_run_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short'})}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button onClick={()=>openEdit(s)} style={{...BTN(),padding:'5px 10px',fontSize:11}}>Editar</button>
                      <button onClick={()=>toggle(s)} style={{...BTN(),padding:'5px 10px',fontSize:11}}>{s.active?'Pausar':'Activar'}</button>
                      <button onClick={()=>del(s)} style={{background:'none',border:'1px solid var(--err-bg)',padding:'5px 10px',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:11,color:'var(--err)',fontFamily:'inherit'}}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>

      {/* Modal crear/editar */}
      {modal&&(
        <Modal title={modal==='create'?'Nueva programación':'Editar programación'} onClose={()=>setModal(null)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:2}}>
            <div>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Locación *</div>
              <select style={{...INP}} value={form.location_id} onChange={f('location_id')}>
                <option value="">Selecciona…</option>
                {locations.map(l=><option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Tipo de auditoría *</div>
              <select style={{...INP}} value={form.audit_type_id} onChange={f('audit_type_id')}>
                <option value="">Selecciona…</option>
                {auditTypes.map(at=><option key={at.id} value={at.id}>{at.icon} {at.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Auditor asignado *</div>
          <select style={{...INP}} value={form.auditor_id} onChange={f('auditor_id')}>
            <option value="">Selecciona…</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role_name})</option>)}
          </select>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Frecuencia *</div>
              <select style={{...INP}} value={form.frequency} onChange={f('frequency')}>
                <option value="once">Una vez</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Hora de ejecución</div>
              <input type="time" style={{...INP}} value={form.scheduled_time} onChange={f('scheduled_time')}/>
            </div>
          </div>

          {/* Días de la semana para weekly */}
          {form.frequency==='weekly'&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:6}}>Días de la semana</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {DAYS.map((d,i)=>{
                  const sel = (form.week_days??[]).includes(i)
                  return (
                    <button key={i} type="button" onClick={()=>setForm((p:any)=>({...p,week_days:sel?p.week_days.filter((x:number)=>x!==i):[...(p.week_days??[]),i].sort()}))}
                      style={{padding:'5px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',cursor:'pointer',fontSize:12,fontFamily:'inherit',background:sel?'var(--ink)':'var(--surface)',color:sel?'white':'var(--mid)',transition:'all .15s'}}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Día del mes para monthly */}
          {form.frequency==='monthly'&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Día del mes (1-31)</div>
              <input type="number" min="1" max="31" style={{...INP}} value={form.month_day} onChange={f('month_day')}/>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Fecha inicio *</div>
              <input type="date" style={{...INP}} value={form.starts_at} onChange={f('starts_at')}/>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Fecha fin (opcional)</div>
              <input type="date" style={{...INP}} value={form.ends_at} onChange={f('ends_at')}/>
            </div>
          </div>

          <div style={{fontSize:10,color:'var(--subtle)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Notas</div>
          <textarea style={{...INP,minHeight:56,resize:'vertical'}} value={form.notes} onChange={f('notes')} placeholder="Instrucciones para el auditor…"/>

          {error&&<div style={{fontSize:12,color:'var(--err)',marginBottom:10,padding:'8px 12px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <button onClick={()=>setModal(null)} style={BTN()}>Cancelar</button>
            <button onClick={save} style={BTN(true)}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}