'use client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function DemoBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)

  // Solo mostrar para el usuario demo
  if (dismissed) return null
  if (session?.user?.email !== 'demo@tveo.co') return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, background: '#0a0a0a', border: '1px solid var(--accent)',
      borderRadius: 12, padding: '12px 20px', display: 'flex',
      alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      maxWidth: 520, width: 'calc(100% - 40px)',
    }}>
      {/* Pulse indicator */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)' }}/>
        <div style={{
          position:'absolute', inset:-3, borderRadius:'50%',
          border:'2px solid var(--accent)', opacity:.5,
          animation:'ping 1.5s ease-out infinite',
        }}/>
        <style>{`@keyframes ping{0%{transform:scale(1);opacity:.5}100%{transform:scale(2);opacity:0}}`}</style>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'white', marginBottom:2 }}>
          Estás explorando el demo de TVEO
        </div>
        <div style={{ fontSize:11, color:'var(--mid)' }}>
          FashionCo · 15 tiendas · datos de ejemplo · solo lectura
        </div>
      </div>
      <a href="/#contact" style={{
        background:'var(--accent)', color:'var(--accent-ink)', textDecoration:'none',
        padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:500,
        whiteSpace:'nowrap', flexShrink:0,
      }}>
        Solicitar cuenta →
      </a>
      <button onClick={() => setDismissed(true)} style={{
        background:'none', border:'none', cursor:'pointer',
        color:'var(--subtle)', fontSize:16, flexShrink:0, padding:0,
      }}>✕</button>
    </div>
  )
}
