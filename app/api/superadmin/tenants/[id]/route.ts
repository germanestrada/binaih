/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await guardSuperAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const allowed = ['name','nit','sector','status','plan_id','trial_ends_at']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })

  const res = await sbFetch(`/tenants?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })

  await sbFetch('/tveo_admin_logs', {
    method: 'POST',
    body: JSON.stringify({ admin_id: session!.id, action: 'update_tenant', resource: id, details: updates }),
  })
  return NextResponse.json({ ok: true })
}
