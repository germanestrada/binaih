/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { validateRouteId } from '@/lib/validate'
import { auth } from '@/auth'
import { Resend } from 'resend'
import { sbFetch } from '@/lib/admin-fetch'
import { createInvite, INVITE_EXPIRY_DAYS } from '@/lib/invites'
import { setPasswordInviteEmail } from '@/lib/email-templates'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://project-csyi1.vercel.app'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const userRes = await sbFetch(`/users?id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id,name,email,status&limit=1`)
  const users   = await userRes.json() as any[]
  if (!users.length) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  const user = users[0]

  try {
    const token = await createInvite(user.id, session.user.id)
    const { subject, html } = setPasswordInviteEmail({
      recipientName:  user.name,
      tenantName:     session.user.companyName,
      setPasswordUrl: `${APP_URL}/set-password?token=${token}`,
      expiresInDays:  INVITE_EXPIRY_DAYS,
    })
    await resend.emails.send({ from: FROM, to: user.email, subject, html })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[admin/users/resend-invite] error:', e)
    return NextResponse.json({ error: e.message ?? 'Error al enviar la invitación' }, { status: 500 })
  }
}
