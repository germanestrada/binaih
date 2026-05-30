/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res  = await sbFetch(
    `/onboarding_progress?tenant_id=eq.${session.user.companyId}&user_id=eq.${session.user.id}&select=step,completed`
  )
  const data = await res.json() as any[]
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { step } = await req.json()
  if (!step) return NextResponse.json({ error: 'step requerido' }, { status: 400 })

  const res = await sbFetch('/onboarding_progress', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id:    session.user.companyId,
      user_id:      session.user.id,
      step,
      completed:    true,
      completed_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    // Si ya existe, hacer upsert
    await sbFetch(
      `/onboarding_progress?tenant_id=eq.${session.user.companyId}&user_id=eq.${session.user.id}&step=eq.${step}`,
      { method: 'PATCH', body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }) }
    )
  }

  return NextResponse.json({ ok: true })
}
