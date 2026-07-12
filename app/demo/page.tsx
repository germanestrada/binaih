'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const router  = useRouter()
  const [step,  setStep]  = useState<'loading'|'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/demo-login', { method: 'POST', credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          window.location.href = '/home'
        } else {
          setError(d.error ?? 'Error al iniciar la demo')
          setStep('error')
        }
      })
      .catch(() => {
        setError('Error de conexión')
        setStep('error')
      })
  }, [])

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#0a0a0a', fontFamily:'system-ui,sans-serif',
    }}>
      <div style={{ textAlign:'center' }}>
        <svg width="40" height="40" viewBox="0 0 20 20" fill="none" style={{ display:'block', margin:'0 auto 20px' }}>
          <rect x="1" y="1" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5"/>
          <path d="M5 10 L10 5 L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 14 L10 9 L15 14" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {step === 'loading' ? (
          <>
            <div style={{ color:'white', fontSize:18, marginBottom:8 }}>Preparando tu demo…</div>
            <div style={{ color:'#555', fontSize:13 }}>Cargando FashionCo · 15 tiendas · datos reales</div>
            <div style={{
              width:40, height:4, background:'var(--accent)', borderRadius:2,
              margin:'24px auto 0', animation:'pulse 1.2s ease-in-out infinite',
            }}/>
            <style>{`@keyframes pulse{0%,100%{opacity:.3;width:40px}50%{opacity:1;width:120px}}`}</style>
          </>
        ) : (
          <>
            <div style={{ color:'#f87171', fontSize:16, marginBottom:16 }}>{error}</div>
            <a href="/" style={{ color:'var(--accent)', fontSize:13 }}>← Volver al inicio</a>
          </>
        )}
      </div>
    </div>
  )
}
