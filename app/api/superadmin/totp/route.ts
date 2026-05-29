/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getSuperAdminSession } from '@/lib/superadmin-auth'
import { verifyTotp, generateTotpSecret, getTotpUri } from "@/lib/totp";
import { sbFetch } from '@/lib/admin-fetch'
import QRCode from 'qrcode'

// GET — generar QR para configurar 2FA
export async function GET() {
  const session = await getSuperAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const secret  = generateTotpSecret()
  const otpauth = getTotpUri(session.email, secret)
  const qrUrl   = await QRCode.toDataURL(otpauth)

  // Guardar secret temporalmente (aún no activado)
  await sbFetch(`/tveo_admins?id=eq.${session.id}`, {
    method: 'PATCH',
    body:   JSON.stringify({ totp_secret: secret }),
  })

  return NextResponse.json({ secret, qrUrl })
}

// POST — verificar y activar 2FA
export async function POST(req: Request) {
  const session = await getSuperAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { code } = await req.json()

  const adminRes = await sbFetch(`/tveo_admins?id=eq.${session.id}&select=totp_secret&limit=1`)
  const admins   = await adminRes.json() as any[]
  if (!admins.length) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })

  const valid = verifyTotp(code, admins[0].totp_secret)
  if (!valid) return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 })

  await sbFetch(`/tveo_admins?id=eq.${session.id}`, {
    method: 'PATCH',
    body:   JSON.stringify({ totp_enabled: true }),
  })

  await sbFetch('/tveo_admin_logs', {
    method: 'POST',
    body: JSON.stringify({ admin_id: session.id, action: 'totp_enabled' }),
  })

  return NextResponse.json({ ok: true })
}
