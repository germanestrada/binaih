/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { validateRouteId } from '@/lib/validate'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const rawId = (await params).id
  const id = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const res  = await sbFetch(`/tenants?id=eq.${id}&select=*,plans(name,tier)&limit=1`)
  const data = await res.json() as any[]
  if (!data.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: data[0] })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await guardSuperAdmin()
  if (error) return error
  const { id }  = await params
  const body    = await req.json()
  const allowed = ['name','nit','sector','status','plan_id','trial_ends_at','contact_name','contact_email','contact_phone','billing_address','billing_city','billing_state','billing_country','billing_zip','tax_id']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] || null })
  const res = await sbFetch(`/tenants?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  await sbFetch('/tveo_admin_logs', {
    method: 'POST',
    body: JSON.stringify({ admin_id: session!.id, action: 'update_tenant', resource: id }),
  })
  return NextResponse.json({ ok: true })
}
