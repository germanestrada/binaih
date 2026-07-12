'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SetPasswordForm() {
  const searchParams = useSearchParams()
  const router        = useRouter()
  const token          = searchParams.get('token') ?? ''

  const [checking, setChecking] = useState(true)
  const [valid,    setValid]    = useState(false)
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    if (!token) { setChecking(false); setValid(false); return }
    fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        setValid(!!data.valid)
        setUserName(data.user?.name ?? '')
        setChecking(false)
      })
      .catch(() => { setValid(false); setChecking(false) })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const res  = await fetch('/api/auth/set-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al definir la contraseña'); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--shell)', fontFamily: 'var(--font-sans)', padding: 20,
    }}>
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
        padding: '48px 44px', width: 380, boxShadow: '0 24px 64px rgba(0,0,0,.4)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="4" stroke="var(--accent)" strokeWidth="1.5"/>
            <path d="M5 10 L10 5 L15 10" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 14 L10 9 L15 14" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 18, color: 'var(--ink)', letterSpacing: '.3px' }}>TVEO</span>
        </div>

        {checking ? (
          <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Verificando enlace…</p>

        ) : done ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', margin: '0 0 8px' }}>Contraseña definida</h1>
            <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6 }}>
              Ya puedes iniciar sesión. Te llevamos al login…
            </p>
          </>

        ) : !valid ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', margin: '0 0 8px' }}>Enlace inválido o expirado</h1>
            <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6, marginBottom: 20 }}>
              Este enlace de invitación ya no es válido. Pídele a tu administrador que te envíe uno nuevo.
            </p>
            <a href="/login" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Ir al inicio de sesión →
            </a>
          </>

        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)', margin: '0 0 6px' }}>
              {userName ? `Hola, ${userName}` : 'Define tu contraseña'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '0 0 28px' }}>
              Elige una contraseña para activar tu cuenta.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                  Nueva contraseña
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required autoFocus placeholder="Mínimo 8 caracteres"
                  style={{
                    width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                    padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                    color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
                    background: 'var(--surface)', transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required placeholder="Repite tu contraseña"
                  style={{
                    width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                    padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                    color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
                    background: 'var(--surface)', transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
                />
              </div>

              {error && (
                <div style={{ fontSize: 12, color: 'var(--err)', padding: '8px 12px', background: 'var(--err-bg)', borderRadius: 'var(--r-sm)' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                background: loading ? 'var(--subtle)' : 'var(--accent)',
                color: 'var(--accent-ink)', border: 'none', borderRadius: 'var(--r-md)',
                padding: '12px', fontSize: 14, fontWeight: 500,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit', marginTop: 4, transition: 'background .15s',
              }}>
                {loading ? 'Guardando…' : 'Activar mi cuenta'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return <Suspense><SetPasswordForm /></Suspense>
}
