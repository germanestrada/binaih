// lib/email-templates.ts
// Plantillas HTML para emails de TVEO

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
  margin: 0; padding: 0;
`
const CARD_STYLE = `
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 520px;
  margin: 40px auto;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
`
const LOGO = `
  <div style="margin-bottom:24px">
    <span style="font-size:18px;font-weight:600;color:#111;letter-spacing:.5px">TVEO</span>
    <span style="font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-left:8px">Auditorías</span>
  </div>
`
const FOOTER = `
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:11px;color:#aaa;text-align:center">
    TVEO · Portal Corporativo de Auditorías · <a href="https://tveo.co" style="color:#aaa">tveo.co</a>
  </div>
`

function wrap(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        ${LOGO}
        ${content}
        ${FOOTER}
      </div>
    </body>
    </html>
  `
}

// ── Auditoría programada ──────────────────────────────────
export function auditScheduledEmail(data: {
  auditorName:  string
  locationName: string
  auditType:    string
  scheduledAt:  string
  auditId:      string
  appUrl:       string
}): { subject: string; html: string } {
  const date = new Date(data.scheduledAt).toLocaleDateString('es-CO', {
    weekday:'long', day:'2-digit', month:'long', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  })
  return {
    subject: `📋 Auditoría programada — ${data.locationName}`,
    html: wrap(`
      <h1 style="font-size:22px;font-weight:300;color:#111;margin:0 0 8px">
        Tienes una auditoría programada
      </h1>
      <p style="color:#666;font-size:14px;margin:0 0 24px">
        Hola ${data.auditorName}, se ha programado una auditoría para ti.
      </p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="display:flex;margin-bottom:10px">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Locación</span>
          <span style="font-size:14px;color:#111;font-weight:500">${data.locationName}</span>
        </div>
        <div style="display:flex;margin-bottom:10px">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Tipo</span>
          <span style="font-size:14px;color:#111;font-weight:500">${data.auditType}</span>
        </div>
        <div style="display:flex">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Fecha</span>
          <span style="font-size:14px;color:#111;font-weight:500">${date}</span>
        </div>
      </div>
      <a href="${data.appUrl}/auditorias/${data.auditId}" style="
        display:inline-block;background:#111;color:white;text-decoration:none;
        padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;
      ">Ver auditoría →</a>
    `),
  }
}

// ── Auditoría completada ──────────────────────────────────
export function auditCompletedEmail(data: {
  recipientName: string
  auditorName:   string
  locationName:  string
  auditType:     string
  score:         number
  completedAt:   string
  auditId:       string
  appUrl:        string
}): { subject: string; html: string } {
  const scoreColor = data.score >= 80 ? '#059669' : data.score >= 60 ? '#d97706' : '#dc2626'
  const date = new Date(data.completedAt).toLocaleDateString('es-CO', {
    day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'
  })
  return {
    subject: `✅ Auditoría completada — ${data.locationName} (${data.score}/100)`,
    html: wrap(`
      <h1 style="font-size:22px;font-weight:300;color:#111;margin:0 0 8px">
        Auditoría completada
      </h1>
      <p style="color:#666;font-size:14px;margin:0 0 24px">
        Hola ${data.recipientName}, ${data.auditorName} completó una auditoría.
      </p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-bottom:16px">
        <div style="display:flex;margin-bottom:10px">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Locación</span>
          <span style="font-size:14px;color:#111;font-weight:500">${data.locationName}</span>
        </div>
        <div style="display:flex;margin-bottom:10px">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Auditor</span>
          <span style="font-size:14px;color:#111;font-weight:500">${data.auditorName}</span>
        </div>
        <div style="display:flex;margin-bottom:10px">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Fecha</span>
          <span style="font-size:14px;color:#111;font-weight:500">${date}</span>
        </div>
        <div style="display:flex;align-items:center">
          <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;width:100px;flex-shrink:0">Score</span>
          <span style="font-size:28px;font-weight:600;color:${scoreColor}">${data.score}</span>
          <span style="font-size:14px;color:#999;margin-left:4px">/100</span>
        </div>
      </div>
      <a href="${data.appUrl}/auditorias/${data.auditId}" style="
        display:inline-block;background:#111;color:white;text-decoration:none;
        padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;
      ">Ver detalle →</a>
    `),
  }
}

// ── Invitación — definir contraseña ───────────────────────
export function setPasswordInviteEmail(data: {
  recipientName: string
  tenantName:    string
  setPasswordUrl: string
  expiresInDays: number
}): { subject: string; html: string } {
  return {
    subject: `Bienvenido a TVEO — activa tu cuenta de ${data.tenantName}`,
    html: wrap(`
      <h1 style="font-size:22px;font-weight:300;color:#111;margin:0 0 8px">
        Tu cuenta está lista
      </h1>
      <p style="color:#666;font-size:14px;margin:0 0 24px">
        Hola ${data.recipientName}, se creó tu cuenta de administrador para
        <strong>${data.tenantName}</strong> en TVEO. Para empezar, define tu contraseña.
      </p>
      <a href="${data.setPasswordUrl}" style="
        display:inline-block;background:#111;color:white;text-decoration:none;
        padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;
      ">Definir mi contraseña →</a>
      <p style="color:#999;font-size:12px;margin:24px 0 0">
        Este enlace expira en ${data.expiresInDays} días. Si no esperabas este correo,
        puedes ignorarlo con confianza.
      </p>
    `),
  }
}
export function planLimitEmail(data: {
  adminName:    string
  tenantName:   string
  limitType:    'locations' | 'users' | 'audits'
  current:      number
  max:          number
  appUrl:       string
}): { subject: string; html: string } {
  const limitLabels = {
    locations: 'locaciones',
    users:     'usuarios',
    audits:    'auditorías del mes',
  }
  const label = limitLabels[data.limitType]
  return {
    subject: `⚠️ Límite de plan alcanzado — ${data.tenantName}`,
    html: wrap(`
      <h1 style="font-size:22px;font-weight:300;color:#111;margin:0 0 8px">
        Has alcanzado el límite de tu plan
      </h1>
      <p style="color:#666;font-size:14px;margin:0 0 24px">
        Hola ${data.adminName}, tu cuenta <strong>${data.tenantName}</strong> ha alcanzado
        el límite de <strong>${label}</strong> de tu plan actual.
      </p>
      <div style="background:#fff8f0;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:13px;color:#92400e">
          <strong>${data.current}</strong> de <strong>${data.max}</strong> ${label} utilizadas
        </div>
        <div style="background:#f59e0b22;border-radius:4px;height:6px;margin-top:10px;overflow:hidden">
          <div style="background:#f59e0b;height:100%;width:${Math.min(100, Math.round(data.current/data.max*100))}%"></div>
        </div>
      </div>
      <p style="color:#666;font-size:13px;margin:0 0 20px">
        Para continuar usando TVEO sin interrupciones, considera actualizar tu plan.
      </p>
      <a href="${data.appUrl}/admin/plan" style="
        display:inline-block;background:#111;color:white;text-decoration:none;
        padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;
      ">Ver planes →</a>
    `),
  }
}