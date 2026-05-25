/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { sbFetch } from '@/lib/admin-fetch'
import { sendEmail } from '@/lib/mailer'

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://project-csyi1.vercel.app'

// Este endpoint lo llama Vercel Cron — protegido con secret
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: any[] = []

  // Obtener todos los tenants activos
  const tenantsRes = await sbFetch('/tenants?status=eq.active&select=id')
  const tenants    = await tenantsRes.json() as any[]

  for (const tenant of tenants) {
    const tenantId = tenant.id

    // Config del tenant
    const cfgRes  = await sbFetch(`/system_config?tenant_id=eq.${tenantId}&key=in.(notif_email_enabled,audit_reminder_days,audit_min_score_ok,notif_email_from)&select=key,value`)
    const cfgRows = await cfgRes.json() as any[]
    const cfg     = Object.fromEntries(cfgRows.map((r: any) => [r.key, r.value]))

    if (cfg.notif_email_enabled !== 'true') continue

    const reminderDays = parseInt(cfg.audit_reminder_days ?? '7')
    const minScore     = parseInt(cfg.audit_min_score_ok  ?? '75')
    const reminderDate = new Date(); reminderDate.setDate(reminderDate.getDate() + reminderDays)

    // Admins del tenant
    const adminsRes = await sbFetch(`/users?tenant_id=eq.${tenantId}&role_name=eq.admin&status=eq.active&select=email`)
    const admins    = (await adminsRes.json() as any[]).map((u: any) => u.email)
    if (!admins.length) continue

    // 1. Auditorías próximas
    const upcomingRes = await sbFetch(
      `/audits?tenant_id=eq.${tenantId}&status=eq.scheduled&scheduled_at=lte.${reminderDate.toISOString()}&scheduled_at=gte.${new Date().toISOString()}&select=id,scheduled_at,locations(name,city),audit_types(name),users!audits_auditor_id_fkey(name,email)&limit=10`
    )
    const upcoming = await upcomingRes.json() as any[]

    // 2. Hallazgos vencidos
    const overdueRes = await sbFetch(
      `/audit_findings?status=in.(open,in_progress)&due_date=lt.${new Date().toISOString()}&select=id,due_date,count,finding_categories(title),locations(name,city,tenant_id)&limit=20`
    )
    const allOverdue  = await overdueRes.json() as any[]
    const overdue     = allOverdue.filter((f: any) => f.locations?.tenant_id === tenantId)

    if (upcoming.length === 0 && overdue.length === 0) continue

    // Generar digest HTML
    let html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;color:white;">BINAIH</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Resumen diario · ${new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</div>
  </div>
  <div style="background:white;border:1px solid #e2e2e2;border-top:none;padding:32px;border-radius:0 0 12px 12px;">`

    if (upcoming.length > 0) {
      html += `<h3 style="font-size:14px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">📋 Auditorías próximas (${upcoming.length})</h3>`
      html += `<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:24px;">`
      upcoming.forEach((a: any) => {
        html += `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:8px 0;font-weight:500;">${a.audit_types?.name} — ${a.locations?.name}</td>
          <td style="padding:8px 0;color:#888;text-align:right;">${new Date(a.scheduled_at).toLocaleDateString('es-CO')}</td>
        </tr>`
      })
      html += `</table>`
    }

    if (overdue.length > 0) {
      html += `<h3 style="font-size:14px;font-weight:600;color:#8b1a1a;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">⚠️ Hallazgos vencidos (${overdue.length})</h3>`
      html += `<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:24px;">`
      overdue.forEach((f: any) => {
        const daysOver = Math.floor((Date.now() - new Date(f.due_date).getTime()) / 86400000)
        html += `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:8px 0;font-weight:500;">${f.finding_categories?.title} — ${f.locations?.name}</td>
          <td style="padding:8px 0;color:#8b1a1a;text-align:right;">${daysOver}d vencido</td>
        </tr>`
      })
      html += `</table>`
    }

    html += `
    <a href="${APP_URL}/home" style="display:inline-block;background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
      Ir al dashboard →
    </a>
    <p style="color:#aaa;font-size:11px;margin-top:32px;">BINAIH · Este es un resumen automático diario</p>
  </div>
</div>`

    const ok = await sendEmail(tenantId, {
      to:      admins,
      subject: `📊 Resumen BINAIH — ${upcoming.length} auditorías próximas, ${overdue.length} hallazgos vencidos`,
      html,
    })

    results.push({ tenantId, ok, upcoming: upcoming.length, overdue: overdue.length })
  }

  return NextResponse.json({ processed: tenants.length, results })
}
