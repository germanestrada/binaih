'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [step,     setStep]     = useState<'credentials'|'totp'>('credentials')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [totp,     setTotp]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res  = await fetch('/api/superadmin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error'); return }
    if (data.requireTotp) { setStep('totp'); return }
    router.push('/superadmin')
  }

  const submitTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res  = await fetch('/api/superadmin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totpCode: totp }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error'); return }
    router.push('/superadmin')
  }

  const INP: React.CSSProperties = {
    width:'100%', border:'1px solid #333', borderRadius:8,
    padding:'10px 12px', fontSize:14, fontFamily:'inherit',
    color:'white', outline:'none', boxSizing:'border-box' as const,
    background:'rgba(255,255,255,.07)', transition:'border-color .15s',
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#0a0a0a', fontFamily:'system-ui,sans-serif',
    }}>
      <div style={{
        background:'#111', border:'1px solid #222',
        borderRadius:16, padding:'44px 40px', width:380,
        boxShadow:'0 32px 80px rgba(0,0,0,.6)',
      }}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5"/>
            <path d="M5 10 L10 5 L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 14 L10 9 L15 14" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{fontSize:18,color:'white',letterSpacing:.5}}>TVEO</span>
          <span style={{fontSize:10,color:'#555',fontWeight:600,textTransform:'uppercase',letterSpacing:'2px',marginLeft:4}}>ADMIN</span>
        </div>

        {step === 'credentials' ? (
          <>
            <h1 style={{fontSize:22,fontWeight:300,color:'white',margin:'0 0 6px'}}>Acceso administrativo</h1>
            <p style={{fontSize:12,color:'#555',margin:'0 0 28px'}}>Portal de administración de la plataforma</p>
            <form onSubmit={submitCredentials} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:10,fontWeight:600,color:'#555',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:6}}>
                  Correo electrónico
                </label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                  autoFocus placeholder="admin@tveo.co" style={INP}
                  onFocus={e=>(e.target as HTMLInputElement).style.borderColor='#444'}
                  onBlur={e=>(e.target as HTMLInputElement).style.borderColor='#333'}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:10,fontWeight:600,color:'#555',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:6}}>
                  Contraseña
                </label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                  placeholder="••••••••" style={INP}
                  onFocus={e=>(e.target as HTMLInputElement).style.borderColor='#444'}
                  onBlur={e=>(e.target as HTMLInputElement).style.borderColor='#333'}/>
              </div>
              {error && <div style={{fontSize:12,color:'#f87171',padding:'8px 12px',background:'rgba(239,68,68,.1)',borderRadius:6}}>{error}</div>}
              <button type="submit" disabled={loading} style={{
                background:loading?'#222':'white', color:loading?'#555':'#0a0a0a',
                border:'none', borderRadius:8, padding:'12px',
                fontSize:14, fontWeight:500, cursor:loading?'default':'pointer',
                fontFamily:'inherit', marginTop:4, transition:'all .15s',
              }}>
                {loading ? 'Verificando…' : 'Ingresar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{fontSize:22,fontWeight:300,color:'white',margin:'0 0 6px'}}>Verificación 2FA</h1>
            <p style={{fontSize:12,color:'#555',margin:'0 0 28px'}}>Ingresa el código de tu aplicación autenticadora</p>
            <form onSubmit={submitTotp} style={{display:'flex',flexDirection:'column',gap:14}}>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={totp} onChange={e=>setTotp(e.target.value.replace(/\D/g,''))}
                placeholder="000000" autoFocus
                style={{...INP, fontSize:28, letterSpacing:8, textAlign:'center', padding:'14px'}}
              />
              {error && <div style={{fontSize:12,color:'#f87171',padding:'8px 12px',background:'rgba(239,68,68,.1)',borderRadius:6}}>{error}</div>}
              <button type="submit" disabled={loading||totp.length!==6} style={{
                background:totp.length===6&&!loading?'white':'#222',
                color:totp.length===6&&!loading?'#0a0a0a':'#555',
                border:'none', borderRadius:8, padding:'12px',
                fontSize:14, fontWeight:500, cursor:totp.length===6&&!loading?'pointer':'default',
                fontFamily:'inherit', transition:'all .15s',
              }}>
                {loading ? 'Verificando…' : 'Confirmar código'}
              </button>
              <button type="button" onClick={()=>{setStep('credentials');setTotp('');setError('')}} style={{
                background:'none', border:'none', color:'#555', fontSize:12,
                cursor:'pointer', fontFamily:'inherit',
              }}>
                ← Volver
              </button>
            </form>
          </>
        )}

        <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid #1a1a1a',fontSize:10,color:'#333',textAlign:'center'}}>
          Acceso restringido · Solo personal autorizado de TVEO
        </div>
      </div>
    </div>
  )
}
