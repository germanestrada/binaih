'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const errorParam = searchParams.get('error')
  const [error, setError] = useState(
    errorParam === 'AccessDenied' ? 'Acceso no permitido en este horario o ubicación. Contacta a tu administrador.' :
    errorParam ? 'Correo o contraseña incorrectos' : ''
  )
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError('Correo o contraseña incorrectos'); return }
    router.push('/home')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--shell)', fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--r-xl)',
        padding: '48px 44px', width: 380,
        boxShadow: '0 24px 64px rgba(0,0,0,.25)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="4" stroke="#0a0a0a" strokeWidth="1.5"/>
            <path d="M5 10 L10 5 L15 10" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 14 L10 9 L15 14" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink)', letterSpacing: '.5px' }}>TVEO</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: 'var(--ink)', margin: '0 0 6px' }}>
          Bienvenido
        </h1>
        <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '0 0 28px' }}>
          Portal de auditorías de locaciones
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus placeholder="tu@empresa.com"
              style={{
                width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--ink)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{
                width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--ink)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--err)', padding: '8px 12px', background: 'var(--err-bg)', borderRadius: 'var(--r-sm)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--subtle)' : 'var(--ink)',
            color: 'white', border: 'none', borderRadius: 'var(--r-md)',
            padding: '12px', fontSize: 14, fontWeight: 500,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit', marginTop: 4, transition: 'background .15s',
          }}>
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border2)', fontSize: 11, color: 'var(--subtle)', textAlign: 'center', lineHeight: 1.6 }}>
          TVEO · Portal corporativo de auditorías<br/>
          Acceso restringido a personal autorizado
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
