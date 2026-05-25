import nodemailer from 'nodemailer'
import { sbFetch } from '@/lib/admin-fetch'

interface MailConfig {
  host:     string
  port:     number
  user:     string
  password: string
  from:     string
}

// Lee la config SMTP desde system_config del tenant
async function getMailConfig(tenantId: string): Promise<MailConfig | null> {
  const res  = await sbFetch(`/system_config?tenant_id=eq.${tenantId}&key=in.(smtp_host,smtp_port,smtp_user,smtp_password,smtp_from)&select=key,value`)
  const rows = await res.json() as { key: string; value: string }[]
  const cfg  = Object.fromEntries(rows.map(r => [r.key, r.value]))

  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_password) return null

  return {
    host:     cfg.smtp_host,
    port:     parseInt(cfg.smtp_port ?? '587'),
    user:     cfg.smtp_user,
    password: cfg.smtp_password,
    from:     cfg.smtp_from || cfg.smtp_user,
  }
}

// Crear transporter de nodemailer
function createTransport(config: MailConfig) {
  return nodemailer.createTransport({
    host:   config.host,
    port:   config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })
}

export interface EmailPayload {
  to:       string | string[]
  subject:  string
  html:     string
  text?:    string
}

// Enviar email
export async function sendEmail(tenantId: string, payload: EmailPayload): Promise<boolean> {
  try {
    const config = await getMailConfig(tenantId)
    if (!config) {
      console.warn('[mailer] SMTP no configurado para tenant:', tenantId)
      return false
    }

    const transporter = createTransport(config)
    await transporter.sendMail({
      from:    `"BINAIH" <${config.from}>`,
      to:      Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
      subject: payload.subject,
      html:    payload.html,
      text:    payload.text,
    })

    console.log('[mailer] Email enviado a:', payload.to)
    return true
  } catch (error) {
    console.error('[mailer] Error enviando email:', error)
    return false
  }
}

// ── Templates de email ────────────────────────────────────────

const baseStyle = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  color: #111;
`

export function templateAuditScheduled(data: {
  auditType: string
  locationName: string
  locationCity: string
  auditorName: string
  scheduledAt: string
  auditId: string
  appUrl: string
}) {
  return {
    subject: `📋 Auditoría programada — ${data.locationName}`,
    html: `
<div style="${baseStyle}">
  <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;color:white;letter-spacing:0.5px;">BINAIH</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Portal de Auditorías</div>
  </div>
  <div style="background:white;border:1px solid #e2e2e2;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="font-size:22px;font-weight:400;margin:0 0 8px;">Auditoría programada</h2>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Tienes una auditoría próxima programada.</p>

    <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="color:#888;padding:5px 0;width:120px;">Tipo</td><td style="font-weight:500;">${data.auditType}</td></tr>
        <tr><td style="color:#888;padding:5px 0;">Locación</td><td style="font-weight:500;">${data.locationName} — ${data.locationCity}</td></tr>
        <tr><td style="color:#888;padding:5px 0;">Auditor</td><td style="font-weight:500;">${data.auditorName}</td></tr>
        <tr><td style="color:#888;padding:5px 0;">Fecha</td><td style="font-weight:500;">${data.scheduledAt}</td></tr>
      </table>
    </div>

    <a href="${data.appUrl}/auditorias/${data.auditId}"
      style="display:inline-block;background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
      Ver auditoría →
    </a>

    <p style="color:#aaa;font-size:11px;margin-top:32px;">BINAIH · Solo personal autorizado</p>
  </div>
</div>`,
  }
}

export function templateAuditCompleted(data: {
  auditType: string
  locationName: string
  score: number
  auditorName: string
  completedAt: string
  auditId: string
  appUrl: string
  minScore: number
}) {
  const isCritical = data.score < data.minScore
  const scoreColor = data.score >= 90 ? '#1a6b3a' : data.score >= 75 ? '#111' : data.score >= 60 ? '#7a5200' : '#8b1a1a'

  return {
    subject: `${isCritical ? '⚠️' : '✅'} Auditoría completada — ${data.locationName} (${data.score} pts)`,
    html: `
<div style="${baseStyle}">
  <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;color:white;">BINAIH</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Portal de Auditorías</div>
  </div>
  <div style="background:white;border:1px solid #e2e2e2;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="font-size:22px;font-weight:400;margin:0 0 8px;">Auditoría completada</h2>
    ${isCritical ? `<div style="background:#fdecea;border:1px solid #f5c6c6;border-radius:8px;padding:12px 16px;margin-bottom:16px;color:#8b1a1a;font-size:13px;">⚠️ Score por debajo del mínimo aceptable (${data.minScore} pts). Se requiere acción inmediata.</div>` : ''}

    <div style="text-align:center;padding:24px;background:#f5f5f5;border-radius:8px;margin-bottom:24px;">
      <div style="font-size:64px;font-weight:300;color:${scoreColor};line-height:1;">${data.score}</div>
      <div style="font-size:13px;color:#888;margin-top:4px;">Score de cumplimiento</div>
    </div>

    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="color:#888;padding:5px 0;width:120px;">Tipo</td><td style="font-weight:500;">${data.auditType}</td></tr>
      <tr><td style="color:#888;padding:5px 0;">Locación</td><td style="font-weight:500;">${data.locationName}</td></tr>
      <tr><td style="color:#888;padding:5px 0;">Auditor</td><td style="font-weight:500;">${data.auditorName}</td></tr>
      <tr><td style="color:#888;padding:5px 0;">Completada</td><td style="font-weight:500;">${data.completedAt}</td></tr>
    </table>

    <a href="${data.appUrl}/auditorias/${data.auditId}"
      style="display:inline-block;background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
      Ver resultado completo →
    </a>

    <p style="color:#aaa;font-size:11px;margin-top:32px;">BINAIH · Solo personal autorizado</p>
  </div>
</div>`,
  }
}

export function templateCriticalFinding(data: {
  findingTitle: string
  findingSeverity: string
  locationName: string
  locationCity: string
  count: number
  dueDate?: string
  auditId: string
  appUrl: string
}) {
  const severityColor = data.findingSeverity === 'critical' ? '#8b1a1a' : '#7a5200'
  const severityLabel = { low:'Baja', medium:'Media', high:'Alta', critical:'Crítica' }[data.findingSeverity] ?? data.findingSeverity

  return {
    subject: `🚨 Hallazgo ${severityLabel} — ${data.locationName}: ${data.findingTitle}`,
    html: `
<div style="${baseStyle}">
  <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;color:white;">BINAIH</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Portal de Auditorías</div>
  </div>
  <div style="background:white;border:1px solid #e2e2e2;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
    <div style="background:#fdecea;border-left:4px solid ${severityColor};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;color:${severityColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Hallazgo ${severityLabel}</div>
      <div style="font-size:18px;font-weight:500;color:#111;">${data.findingTitle}</div>
    </div>

    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="color:#888;padding:5px 0;width:120px;">Locación</td><td style="font-weight:500;">${data.locationName} — ${data.locationCity}</td></tr>
      <tr><td style="color:#888;padding:5px 0;">Cantidad</td><td style="font-weight:500;">${data.count} caso${data.count !== 1 ? 's' : ''}</td></tr>
      ${data.dueDate ? `<tr><td style="color:#888;padding:5px 0;">Fecha límite</td><td style="font-weight:500;color:${severityColor};">${data.dueDate}</td></tr>` : ''}
    </table>

    <a href="${data.appUrl}/auditorias/${data.auditId}"
      style="display:inline-block;background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
      Ver auditoría y gestionar hallazgo →
    </a>

    <p style="color:#aaa;font-size:11px;margin-top:32px;">BINAIH · Solo personal autorizado</p>
  </div>
</div>`,
  }
}

export function templateFindingOverdue(data: {
  findingTitle: string
  locationName: string
  dueDate: string
  daysOverdue: number
  findingId: string
  appUrl: string
}) {
  return {
    subject: `⏰ Hallazgo vencido (${data.daysOverdue} días) — ${data.locationName}`,
    html: `
<div style="${baseStyle}">
  <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;color:white;">BINAIH</div>
  </div>
  <div style="background:white;border:1px solid #e2e2e2;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="font-size:22px;font-weight:400;margin:0 0 8px;color:#8b1a1a;">Hallazgo vencido</h2>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Un hallazgo superó su fecha límite de resolución hace <strong>${data.daysOverdue} día${data.daysOverdue !== 1 ? 's' : ''}</strong>.</p>

    <div style="background:#fdecea;border-radius:8px;padding:20px;margin-bottom:24px;">
      <div style="font-size:15px;font-weight:500;margin-bottom:8px;">${data.findingTitle}</div>
      <div style="font-size:13px;color:#555;">Locación: ${data.locationName}</div>
      <div style="font-size:13px;color:#8b1a1a;margin-top:4px;">Venció el: ${data.dueDate}</div>
    </div>

    <a href="${data.appUrl}/hallazgos"
      style="display:inline-block;background:#111;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
      Ver hallazgos pendientes →
    </a>

    <p style="color:#aaa;font-size:11px;margin-top:32px;">BINAIH · Solo personal autorizado</p>
  </div>
</div>`,
  }
}
