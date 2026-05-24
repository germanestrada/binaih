/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const updates: any = { updated_at: new Date().toISOString() }
  if (body.name)        updates.name        = body.name
  if (body.icon)        updates.icon        = body.icon
  if (body.description !== undefined) updates.description = body.description
  if (body.active !== undefined)      updates.active      = body.active
  const res  = await sbFetch(`/location_types?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  const data = await res.json()
  return NextResponse.json({ data: data[0] })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  // Verificar que no tenga locaciones asociadas
  const checkRes = await sbFetch(`/locations?type_id=eq.${id}&select=id&limit=1`)
  const check    = await checkRes.json()
  if (check.length > 0) return NextResponse.json({ error: 'Tiene locaciones asociadas. Reasígnalas antes de eliminar.' }, { status: 400 })
  const res = await sbFetch(`/location_types?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error al eliminar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
