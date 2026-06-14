/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'
import { Resend } from 'resend'
import {
  auditScheduledEmail,
  auditCompletedEmail,
  planLimitEmail,
} from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://project-csyi1.vercel.app'

// ── Helper: crear notificación in-app ────────────────────
async function createInAppNotification(params: {
  tenantId: string
  userId:   string
  type:     string
  title:    string
  body:     string
  link?:    string
  metadata?: any
}) {
  await sbFetch('/notifications', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: params.tenantId,
      user_id:   params.userId,
      type:      params.type,
      title:     params.title,
      body:      params.body,
      link:      params.link ?? null,
      metadata:  params.metadata ?? null,
    }),
  })
}

// ── Helper: enviar email ─────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (e) {
    console.error('[notifications] email error:', e)
  }
}

// POST /api/notifications — crear notificación
export async function POST(req: Request) {
  // Permitir llamadas internas del cron (sin sesión de usuario)
  const internalKey = req.headers.get('x-internal-key')
  const isInternal  = internalKey === process.env.CRON_SECRET

  if (!isInternal) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, data } = await req.json()

  try {
    switch (type) {

      // ── Auditoría programada ─────────────────────────
      case 'audit_scheduled': {
        const { auditorName, auditorEmail, auditId, locationName, auditTypeName, scheduledAt, tenantId, userId } = data
        const { subject, html } = auditScheduledEmail({
          auditorName, locationName,
          auditType:   auditTypeName,
          scheduledAt, auditId, appUrl: APP_URL,
        })
        await Promise.all([
          sendEmail(auditorEmail, subject, html),
          createInAppNotification({
            tenantId, userId,
            type:  'audit_scheduled',
            title: `Auditoría programada — ${locationName}`,
            body:  `Tienes una auditoría de "${auditTypeName}" programada para ${new Date(scheduledAt).toLocaleDateString('es-CO')}`,
            link:  `/auditorias/${auditId}`,
            metadata: { auditId, locationName, scheduledAt },
          }),
        ])
        break
      }

      // ── Auditoría completada ─────────────────────────
      case 'audit_completed': {
        const { auditorName, auditorEmail, auditorId,
                creatorEmail, creatorName, creatorId,
                locationName, auditTypeName, score,
                completedAt, auditId, tenantId } = data

        const { subject, html } = auditCompletedEmail({
          recipientName: auditorName,
          auditorName, locationName,
          auditType:    auditTypeName,
          score, completedAt, auditId, appUrl: APP_URL,
        })
        const { subject: subjectCreator, html: htmlCreator } = auditCompletedEmail({
          recipientName: creatorName,
          auditorName, locationName,
          auditType:    auditTypeName,
          score, completedAt, auditId, appUrl: APP_URL,
        })

        const notifBody = `${auditorName} completó la auditoría de "${locationName}" con score ${score}/100`

        await Promise.all([
          // Email al auditor
          sendEmail(auditorEmail, subject, html),
          // Email al creador (si es diferente)
          creatorEmail !== auditorEmail ? sendEmail(creatorEmail, subjectCreator, htmlCreator) : Promise.resolve(),
          // Notif in-app al auditor
          createInAppNotification({
            tenantId, userId: auditorId,
            type: 'audit_completed', title: `Auditoría completada — ${score}/100`,
            body: notifBody, link: `/auditorias/${auditId}`,
            metadata: { auditId, score },
          }),
          // Notif in-app al creador
          creatorId !== auditorId ? createInAppNotification({
            tenantId, userId: creatorId,
            type: 'audit_completed', title: `Auditoría completada — ${score}/100`,
            body: notifBody, link: `/auditorias/${auditId}`,
            metadata: { auditId, score },
          }) : Promise.resolve(),
        ])
        break
      }

      // ── Límite de plan ───────────────────────────────
      case 'plan_limit': {
        const { adminName, adminEmail, adminId, tenantId, tenantName, limitType, current, max } = data
        const { subject, html } = planLimitEmail({
          adminName, tenantName, limitType, current, max, appUrl: APP_URL,
        })
        await Promise.all([
          sendEmail(adminEmail, subject, html),
          createInAppNotification({
            tenantId, userId: adminId,
            type:  'plan_limit',
            title: `Límite de plan alcanzado — ${limitType}`,
            body:  `Has usado ${current} de ${max} ${limitType} de tu plan actual.`,
            link:  '/admin/plan',
            metadata: { limitType, current, max },
          }),
        ])
        break
      }

      default:
        return NextResponse.json({ error: `Tipo desconocido: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[notifications] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/notifications — obtener notificaciones del usuario actual
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  let query = `/notifications?tenant_id=eq.${session.user.companyId}&user_id=eq.${session.user.id}&order=created_at.desc&limit=30`
  if (unreadOnly) query += '&read=eq.false'

  const res  = await sbFetch(query)
  const data = await res.json()
  return NextResponse.json({ data })
}

// PATCH /api/notifications — marcar como leídas
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, all } = await req.json()

  if (all) {
    await sbFetch(
      `/notifications?tenant_id=eq.${session.user.companyId}&user_id=eq.${session.user.id}&read=eq.false`,
      { method: 'PATCH', body: JSON.stringify({ read: true, read_at: new Date().toISOString() }) }
    )
  } else if (ids?.length) {
    await sbFetch(
      `/notifications?id=in.(${ids.join(',')})&user_id=eq.${session.user.id}`,
      { method: 'PATCH', body: JSON.stringify({ read: true, read_at: new Date().toISOString() }) }
    )
  }

  return NextResponse.json({ ok: true })
}