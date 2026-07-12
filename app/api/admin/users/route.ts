/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { sbFetch } from '@/lib/admin-fetch'
import { createInvite, randomUnusablePassword, INVITE_EXPIRY_DAYS } from '@/lib/invites'
import { setPasswordInviteEmail } from '@/lib/email-templates'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://project-csyi1.vercel.app'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res  = await sbFetch(`/users?tenant_id=eq.${session.user.companyId}&select=id,name,email,role_name,zone,status,last_login,created_at&order=created_at.desc`)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, email, role_name, zone } = await req.json()
  if (!name || !email || !role_name) return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })

  // Contraseña aleatoria que nadie conoce — el usuario define la suya vía invitación
  const placeholderHash = bcrypt.hashSync(randomUnusablePassword(), 10)
  const res = await sbFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      name, email, password: placeholderHash, role_name,
      zone: zone || null, tenant_id: session.user.companyId,
      status: 'pending', created_by: session.user.id,
    }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error al crear' }, { status: 400 }) }
  const data = await res.json()
  const newUser = data[0]

  let inviteSent  = false
  let inviteError: string | null = null
  try {
    const token = await createInvite(newUser.id, session.user.id)
    const { subject, html } = setPasswordInviteEmail({
      recipientName:  name,
      tenantName:     session.user.companyName,
      setPasswordUrl: `${APP_URL}/set-password?token=${token}`,
      expiresInDays:  INVITE_EXPIRY_DAYS,
    })
    await resend.emails.send({ from: FROM, to: email, subject, html })
    inviteSent = true
  } catch (e: any) {
    console.error('[admin/users] error enviando invitación:', e)
    inviteError = e.message ?? 'Error al enviar el correo de invitación'
  }

  return NextResponse.json({ data: newUser, inviteSent, inviteError })
}
