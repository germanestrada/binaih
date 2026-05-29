/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { validateRouteId } from '@/lib/validate'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rawId = (await params).id
  const id = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const body = await req.json()
  const fields = ['name','type_id','address','city','zone','lat','lng','status','manager_name','manager_phone','area_sqm','notes']
  const updates: any = { updated_at: new Date().toISOString() }
  fields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f] || null })
  if (body.name) updates.name = body.name
  if (body.status) updates.status = body.status
  const res  = await sbFetch(`/locations?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  const data = await res.json()
  return NextResponse.json({ data: data[0] })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rawId = (await params).id
  const id = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const checkRes = await sbFetch(`/audits?location_id=eq.${id}&select=id&limit=1`)
  const check    = await checkRes.json()
  if (check.length > 0) return NextResponse.json({ error: 'Tiene auditorías asociadas. No se puede eliminar.' }, { status: 400 })
  const res = await sbFetch(`/locations?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error al eliminar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
