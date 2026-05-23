'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/home'

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [focused, setFocused]   = useState<string | null>(null)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email, password,
      redirect: false,
    })

    if (result?.error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  const inp = (id: string): React.CSSProperties => ({
    width: '100%',
    background: 'var(--ink3)',
    border: `1px solid ${focused === id ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.08)'}`,
    borderRadius: 'var(--r-md)',
    padding: '11px 14px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    color: 'white',
    outline: 'none',
    transition: 'border-color .15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'stretch' }}>

      {/* Left — branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px', borderRight: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5"/>
            <path d="M5 10 L10 5 L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 14 L10 9 L15 14" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'white', letterSpacing: '.5px' }}>BINAIH</span>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 20 }}>Portal de Auditorías</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 44, color: 'white', lineHeight: 1.12, fontWeight: 400, maxWidth: 380 }}>
            Visibilidad total<br/><em style={{ color: 'rgba(255,255,255,.4)' }}>sobre cada tienda.</em>
          </h1>
          <p style={{ marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,.35)', lineHeight: 1.65, maxWidth: 340 }}>
            Monitoreo de cumplimiento, auditorías y hallazgos en tiempo real para toda la red comercial.
          </p>

          {/* Demo credentials */}
          <div style={{ marginTop: 40, padding: '16px 20px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>
              Credenciales de demo
            </div>
            {[
              { role: 'Admin',   email: 'admin@binaih.co',   pass: 'admin123'   },
              { role: 'Auditor', email: 'auditor@binaih.co', pass: 'auditor123' },
              { role: 'Viewer',  email: 'viewer@binaih.co',  pass: 'viewer123'  },
            ].map(u => (
              <div key={u.role} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}
                onClick={() => { setEmail(u.email); setPassword(u.pass) }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', width: 48, fontFamily: 'var(--font-mono)' }}>{u.role}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-mono)' }}>{u.email}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-mono)' }}>· {u.pass}</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginTop: 8 }}>Haz clic en una fila para cargar las credenciales</div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.18)', fontFamily: 'var(--font-mono)' }}>© 2025 BINAIH · Acceso restringido</div>
      </div>

      {/* Right — form */}
      <div style={{ width: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', background: 'var(--ink2)', flexShrink: 0 }}>
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'white', marginBottom: 6 }}>Iniciar sesión</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginBottom: 36 }}>Solo personal autorizado</div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.4)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.8px' }}>
              Correo electrónico
            </label>
            <input
              id="email" name="email" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="usuario@binaih.co" required autoComplete="email"
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              style={inp('email')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.4)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.8px' }}>
              Contraseña
            </label>
            <input
              id="password" name="password" type="password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="··········" required autoComplete="current-password"
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              style={inp('password')}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 16, padding: '10px 12px', background: 'rgba(248,113,113,.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(248,113,113,.15)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: loading ? 'rgba(255,255,255,.08)' : 'white',
            color:      loading ? 'rgba(255,255,255,.3)'  : 'var(--ink)',
            border: 'none', padding: '12px', borderRadius: 'var(--r-md)',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
            cursor: loading ? 'default' : 'pointer', letterSpacing: '.3px', transition: 'all .2s',
          }}>
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
