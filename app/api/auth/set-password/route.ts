/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sbFetch } from '@/lib/admin-fetch'
import { hashToken } from '@/lib/invites'

// GET /api/auth/set-password?token=... — validar el token antes de mostrar el formulario
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const invite = await findValidInvite(token)
  if (!invite) return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 })

  const usersRes = await sbFetch(`/users?id=eq.${invite.user_id}&select=name,email`)
  const users    = await usersRes.json() as any[]

  return NextResponse.json({ valid: true, user: users[0] ?? null })
}

// POST /api/auth/set-password — { token, password }
export async function POST(req: Request) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token y contraseña requeridos' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })

  const invite = await findValidInvite(token)
  if (!invite) return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 })

  const passwordHash = bcrypt.hashSync(password, 10)

  const updateRes = await sbFetch(`/users?id=eq.${invite.user_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ password: passwordHash }),
  })
  if (!updateRes.ok) return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 500 })

  // Marcar la invitación como usada
  await sbFetch(`/user_invites?id=eq.${invite.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ used_at: new Date().toISOString() }),
  })

  return NextResponse.json({ ok: true })
}

// ── Helper: busca una invitación válida (no usada, no expirada) por token ──
async function findValidInvite(token: string): Promise<{ id: string; user_id: string } | null> {
  const tokenHash = hashToken(token)
  const res = await sbFetch(
    `/user_invites?token_hash=eq.${tokenHash}&used_at=is.null&expires_at=gt.${new Date().toISOString()}&select=id,user_id&limit=1`
  )
  const rows = await res.json() as any[]
  return rows[0] ?? null
}
