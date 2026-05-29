/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { verifySuperAdminCredentials, signSuperAdminToken, getSuperAdminSession, COOKIE_NAME, MAX_AGE } from '@/lib/superadmin-auth'
import { verifyTotp, generateTotpSecret, getTotpUri } from "@/lib/totp";
import { sbFetch } from '@/lib/admin-fetch'

// POST /api/superadmin/auth — login
export async function POST(req: Request) {
  const { email, password, totpCode } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })

  const admin = await verifySuperAdminCredentials(email, password)
  if (!admin) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  // Si tiene 2FA activado, verificar código TOTP
  if (admin.totp_enabled) {
    if (!totpCode) {
      return NextResponse.json({ requireTotp: true, adminId: admin.id }, { status: 200 })
    }
    const valid = verifyTotp(totpCode, admin.totp_secret)
    if (!valid) return NextResponse.json({ error: 'Código 2FA incorrecto' }, { status: 401 })
  }

  // Generar token
  const session = {
    id:          admin.id,
    name:        admin.name,
    email:       admin.email,
    totpEnabled: admin.totp_enabled,
    totpVerified: admin.totp_enabled,
  }
  const token = await signSuperAdminToken(session)

  // Actualizar last_login
  await sbFetch(`/tveo_admins?id=eq.${admin.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ last_login: new Date().toISOString(), login_count: (admin.login_count ?? 0) + 1 }),
  })

  // Log de acceso
  await sbFetch('/tveo_admin_logs', {
    method: 'POST',
    body: JSON.stringify({ admin_id: admin.id, action: 'login', details: { email } }),
  })

  const res = NextResponse.json({ ok: true, name: admin.name })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   MAX_AGE,
    path:     '/superadmin',
  })
  return res
}

// DELETE /api/superadmin/auth — logout
export async function DELETE() {
  const session = await getSuperAdminSession()
  if (session) {
    await sbFetch('/tveo_admin_logs', {
      method: 'POST',
      body: JSON.stringify({ admin_id: session.id, action: 'logout' }),
    })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}

// GET /api/superadmin/auth — verificar sesión
export async function GET() {
  const session = await getSuperAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(session)
}
