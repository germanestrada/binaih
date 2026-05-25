import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendEmail } from '@/lib/mailer'

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ok = await sendEmail(session.user.companyId, {
    to:      session.user.email!,
    subject: '✅ BINAIH — Configuración de email verificada',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f5f5f5;border-radius:12px;">
        <div style="font-size:24px;font-weight:300;margin-bottom:8px;">✅ Email configurado</div>
        <p style="color:#555;font-size:14px;">La configuración SMTP de BINAIH funciona correctamente. Las notificaciones automáticas están activas.</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;"/>
        <p style="color:#aaa;font-size:11px;">BINAIH · ${new Date().toLocaleString('es-CO')}</p>
      </div>`,
  })

  return NextResponse.json({ ok, message: ok ? 'Email de prueba enviado correctamente' : 'Error al enviar — verifica la configuración SMTP' })
}
