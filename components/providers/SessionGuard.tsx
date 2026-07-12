'use client'
import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const IDLE_TIMEOUT_MS   = 30 * 60 * 1000  // 30 minutos
const WARNING_BEFORE_MS =  2 * 60 * 1000  // Aviso 2 min antes

export default function SessionGuard() {
  const router        = useRouter()
  const idleTimer     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const warnTimer     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [showWarn,  setShowWarn]  = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [countdown, setCountdown] = useState(120)

  const reset = () => {
    clearTimeout(idleTimer.current)
    clearTimeout(warnTimer.current)
    setShowWarn(false)

    warnTimer.current = setTimeout(()=>{
      setShowWarn(true)
      setCountdown(120)
      // Countdown visual
      const interval = setInterval(()=>{
        setCountdown(c => {
          if (c <= 1) { clearInterval(interval); return 0 }
          return c - 1
        })
      }, 1000)
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)

    idleTimer.current = setTimeout(async () => {
      setShowWarn(false)
      setShowExpired(true)
      await signOut({ redirect: false })
    }, IDLE_TIMEOUT_MS)
  }

  useEffect(() => {
    // Interceptar 401s globales
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const res = await originalFetch(...args)
      if (res.status === 401 && !String(args[0]).includes('/api/auth')) {
        setShowExpired(true)
      }
      return res
    }

    // Eventos de actividad del usuario
    const events = ['mousedown','keydown','touchstart','scroll','click']
    events.forEach(e => document.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      window.fetch = originalFetch
      events.forEach(e => document.removeEventListener(e, reset))
      clearTimeout(idleTimer.current)
      clearTimeout(warnTimer.current)
    }
  }, [])

  const handleRelogin = () => {
    setShowExpired(false)
    window.location.href = '/login'
  }

  const handleStay = () => {
    reset()
    setShowWarn(false)
  }

  const overlayStyle: React.CSSProperties = {
    position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
    zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'system-ui,sans-serif',
  }
  const boxStyle: React.CSSProperties = {
    background:'var(--white,#fff)', borderRadius:16, padding:'32px 36px',
    maxWidth:400, width:'90%', textAlign:'center',
    boxShadow:'0 24px 64px rgba(0,0,0,.25)',
  }

  if (showExpired) return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={{fontSize:32,marginBottom:12}}>🔒</div>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:8}}>Sesión expirada</h2>
        <p style={{fontSize:14,color:'var(--mid)',marginBottom:24,lineHeight:1.5}}>
          Tu sesión ha expirado por seguridad. Vuelve a ingresar para continuar.
        </p>
        <button onClick={handleRelogin} style={{
          background:'var(--accent)',color:'var(--accent-ink)',border:'none',padding:'12px 28px',
          borderRadius:8,fontSize:14,fontWeight:500,cursor:'pointer',width:'100%',
        }}>Volver a ingresar</button>
      </div>
    </div>
  )

  if (showWarn) return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={{fontSize:32,marginBottom:12}}>⏰</div>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:8}}>¿Sigues ahí?</h2>
        <p style={{fontSize:14,color:'var(--mid)',marginBottom:8,lineHeight:1.5}}>
          Tu sesión cerrará en <strong>{countdown}</strong> segundos por inactividad.
        </p>
        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button onClick={handleStay} style={{
            flex:1,background:'var(--accent)',color:'var(--accent-ink)',border:'none',padding:'11px',
            borderRadius:8,fontSize:14,fontWeight:500,cursor:'pointer',
          }}>Sigo aquí</button>
          <button onClick={()=>{setShowWarn(false);signOut({callbackUrl:'/login'})}} style={{
            flex:1,background:'none',color:'var(--mid)',border:'1px solid var(--border)',padding:'11px',
            borderRadius:8,fontSize:14,cursor:'pointer',fontFamily:'inherit',
          }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  )

  return null
}
