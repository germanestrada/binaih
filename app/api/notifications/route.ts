/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendEmail, templateAuditScheduled, templateAuditCompleted, templateCriticalFinding, templateFindingOverdue } from '@/lib/mailer'
import { sbFetch } from '@/lib/admin-fetch'

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://project-csyi1.vercel.app'

async function getTenantAdmins(tenantId: string): Promise<string[]> {
  const res   = await sbFetch(`/users?tenant_id=eq.${tenantId}&role_name=in.(admin)&status=eq.active&select=email`)
  const users = await res.json() as any[]
  return users.map((u: any) => u.email).filter(Boolean)
}

// POST — disparar notificación manualmente o desde webhook
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, data } = body
  const tenantId = session.user.companyId

  // Obtener configuración del tenant
  const configRes  = await sbFetch(`/system_config?tenant_id=eq.${tenantId}&key=in.(notif_email_enabled,audit_min_score_ok)&select=key,value`)
  const configRows = await configRes.json() as any[]
  const config     = Object.fromEntries(configRows.map((r: any) => [r.key, r.value]))

  if (config.notif_email_enabled === 'false') {
    return NextResponse.json({ ok: false, reason: 'Notificaciones desactivadas' })
  }

  const admins  = await getTenantAdmins(tenantId)
  const minScore = parseInt(config.audit_min_score_ok ?? '75')

  let template: { subject: string; html: string } | null = null
  let recipients: string[] = admins

  if (type === 'audit_scheduled') {
    template = templateAuditScheduled({ ...data, appUrl: APP_URL })
    // Agregar auditor
    if (data.auditorEmail) recipients = [...new Set([...recipients, data.auditorEmail])]

  } else if (type === 'audit_completed') {
    template = templateAuditCompleted({ ...data, minScore, appUrl: APP_URL })
    if (data.auditorEmail) recipients = [...new Set([...recipients, data.auditorEmail])]

  } else if (type === 'critical_finding') {
    template = templateCriticalFinding({ ...data, appUrl: APP_URL })
    if (data.auditorEmail)  recipients = [...new Set([...recipients, data.auditorEmail])]
    if (data.managerEmail)  recipients = [...new Set([...recipients, data.managerEmail])]

  } else if (type === 'finding_overdue') {
    template = templateFindingOverdue({ ...data, appUrl: APP_URL })
  }

  if (!template) return NextResponse.json({ error: 'Tipo de notificación inválido' }, { status: 400 })
  if (!recipients.length) return NextResponse.json({ ok: false, reason: 'Sin destinatarios' })

  const ok = await sendEmail(tenantId, { to: recipients, ...template })
  return NextResponse.json({ ok, recipients })
}
