'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id:string; type:string; title:string; body:string
  link?:string; read:boolean; created_at:string
}

const TYPE_ICON: Record<string,string> = {
  audit_scheduled: '📋',
  audit_completed: '✅',
  plan_limit:      '⚠️',
}

export default function NotificationBell() {
  const router  = useRouter()
  const [notifs,   setNotifs]   = useState<Notification[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  const load = () => {
    setLoading(true)
    fetch('/api/notifications?unread=false')
      .then(r => r.json())
      .then(d => { setNotifs(d.data ?? []); setLoading(false) })
  }

  useEffect(() => {
    load()
    // Refrescar cada 60 segundos
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ all: true }) })
    setNotifs(n => n.map(x => ({...x, read: true})))
  }

  const markRead = async (id: string, link?: string) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ids: [id] }) })
    setNotifs(n => n.map(x => x.id === id ? {...x, read: true} : x))
    setOpen(false)
    if (link) router.push(link)
  }

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {/* Campana */}
      <button onClick={() => setOpen(o => !o)} style={{
        position:'relative', background:'none', border:'none',
        cursor:'pointer', padding:6, color:'var(--shell-dim)',
        display:'flex', alignItems:'center', borderRadius:6,
        transition:'color .15s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'white'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--shell-dim)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position:'absolute', top:2, right:2,
            width:16, height:16, borderRadius:'50%',
            background:'#ef4444', color:'white',
            fontSize:9, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid var(--shell)',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0,
          width:360, background:'white', borderRadius:12,
          boxShadow:'0 8px 32px rgba(0,0,0,.15)',
          border:'1px solid #e5e7eb', zIndex:500,
          overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #f0f0f0'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#111'}}>
              Notificaciones {unread > 0 && <span style={{fontSize:11,color:'#6b7280',fontWeight:400}}>({unread} sin leer)</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{fontSize:11,color:'#1558b0',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{maxHeight:400,overflowY:'auto'}}>
            {loading ? (
              <div style={{padding:'24px',textAlign:'center',color:'#9ca3af',fontSize:13}}>Cargando…</div>
            ) : notifs.length === 0 ? (
              <div style={{padding:'32px',textAlign:'center',color:'#9ca3af',fontSize:13}}>
                Sin notificaciones
              </div>
            ) : notifs.map((n, i) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id, n.link)}
                style={{
                  display:'flex', gap:12, padding:'12px 16px',
                  borderBottom: i < notifs.length-1 ? '1px solid #f9f9f9' : 'none',
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.read ? 'white' : '#f0f7ff',
                  transition:'background .1s',
                }}
                onMouseEnter={e => { if (n.link) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5' }}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = n.read ? 'white' : '#f0f7ff'}
              >
                <div style={{fontSize:20,flexShrink:0,lineHeight:1.4}}>{TYPE_ICON[n.type] ?? '🔔'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:n.read?400:600,color:'#111',marginBottom:2}}>{n.title}</div>
                  <div style={{fontSize:11,color:'#6b7280',lineHeight:1.5}}>{n.body}</div>
                  <div style={{fontSize:10,color:'#d1d5db',marginTop:4}}>
                    {new Date(n.created_at).toLocaleDateString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
                {!n.read && (
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#1558b0',flexShrink:0,marginTop:4}}/>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}