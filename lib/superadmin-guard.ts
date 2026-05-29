import { getSuperAdminSession } from '@/lib/superadmin-auth'
import { NextResponse } from 'next/server'

export async function guardSuperAdmin() {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), session: null }
  }
  if (session.totpEnabled && !session.totpVerified) {
    return { error: NextResponse.json({ error: '2FA requerido' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}
