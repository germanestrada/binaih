/* eslint-disable @typescript-eslint/no-explicit-any */
/**/
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'
import { validateRouteId } from '@/lib/validate'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body    = await req.json()
  const allowed = ['active','auditor_id','scheduled_time','week_days','month_day','ends_at','notes','frequency']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })

  const res = await sbFetch(
    `/audit_schedules?id=eq.${id}&tenant_id=eq.${session.user.companyId}`,
    { method: 'PATCH', body: JSON.stringify(updates) }
  )
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await sbFetch(
    `/audit_schedules?id=eq.${id}&tenant_id=eq.${session.user.companyId}`,
    { method: 'DELETE' }
  )
  return NextResponse.json({ ok: true })
}