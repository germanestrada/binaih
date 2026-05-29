/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { validateRouteId } from '@/lib/validate'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rawId = (await params).id
  const id = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const body = await req.json()
  const updates: any = { updated_at: new Date().toISOString() }
  if (body.name)      updates.name      = body.name
  if (body.role_name) updates.role_name = body.role_name
  if (body.zone !== undefined) updates.zone = body.zone || null
  if (body.status)    updates.status    = body.status
  if (body.password)  updates.password  = bcrypt.hashSync(body.password, 10)
  const res  = await sbFetch(`/users?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'PATCH', body: JSON.stringify(updates) })
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
  if (id === session.user.id) return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
  const res = await sbFetch(`/users?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error al eliminar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
