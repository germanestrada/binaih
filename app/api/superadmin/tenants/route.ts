/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { createInvite, randomUnusablePassword, INVITE_EXPIRY_DAYS } from '@/lib/invites'
import { setPasswordInviteEmail } from '@/lib/email-templates'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://project-csyi1.vercel.app'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error

  const res  = await sbFetch('/tenants?select=*,plans(name,tier)&order=created_at.desc')
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { error, session } = await guardSuperAdmin()
  if (error) return error

  const body = await req.json()
  const { name, nit, sector, plan_id, admin_name, admin_email } = body
  if (!name || !plan_id) return NextResponse.json({ error: 'Nombre y plan requeridos' }, { status: 400 })
  if (!admin_name || !admin_email) return NextResponse.json({ error: 'Nombre y email del admin son requeridos' }, { status: 400 })

  // Crear tenant
  const tenantRes = await sbFetch('/tenants', {
    method: 'POST',
    body: JSON.stringify({
      name, nit: nit||null, sector: sector||null,
      plan_id, status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_by: session!.id,
    }),
  })
  if (!tenantRes.ok) { const e = await tenantRes.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const tenants  = await tenantRes.json() as any[]
  const tenant   = tenants[0]

  // Crear usuario admin del tenant — con una contraseña aleatoria que nadie
  // conoce; el propio admin la define al usar el link de invitación.
  let adminUser: any = null
  let inviteSent = false
  let inviteError: string | null = null

  const placeholderHash = bcrypt.hashSync(randomUnusablePassword(), 10)
  const userRes = await sbFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id:  tenant.id,
      role_name:  'admin',
      name:       admin_name,
      email:      admin_email,
      password:   placeholderHash,
      status:     'pending',
      created_by: session!.id,
    }),
  })

  if (userRes.ok) {
    const users = await userRes.json() as any[]
    adminUser   = users[0]

    try {
      const token = await createInvite(adminUser.id, session!.id)
      const { subject, html } = setPasswordInviteEmail({
        recipientName:  admin_name,
        tenantName:     name,
        setPasswordUrl: `${APP_URL}/set-password?token=${token}`,
        expiresInDays:  INVITE_EXPIRY_DAYS,
      })
      await resend.emails.send({ from: FROM, to: admin_email, subject, html })
      inviteSent = true
    } catch (e: any) {
      // El tenant y el usuario ya quedaron creados — si el correo falla
      // (ej: modo sandbox de Resend), no revertimos nada. Se puede
      // reintentar el envío de la invitación por separado.
      console.error('[superadmin/tenants] error enviando invitación:', e)
      inviteError = e.message ?? 'Error al enviar el correo de invitación'
    }
  } else {
    const e = await userRes.json()
    inviteError = e.message ?? 'Error al crear el usuario admin'
  }

  // Log
  await sbFetch('/tveo_admin_logs', {
    method: 'POST',
    body: JSON.stringify({
      admin_id: session!.id, action: 'create_tenant', resource: tenant.id,
      details: { name, admin_email, invite_sent: inviteSent },
    }),
  })

  return NextResponse.json({ data: tenant, adminUser, inviteSent, inviteError })
}
