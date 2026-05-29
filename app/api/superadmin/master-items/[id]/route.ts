/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id } = await params
  const body   = await req.json()
  const res    = await sbFetch(`/master_items?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id } = await params
  const checkRes = await sbFetch(`/audit_type_items?select=id&limit=1`)
  const check    = await checkRes.json() as any[]
  if (check.length) return NextResponse.json({ error: 'Ítem en uso por tipos de auditoría' }, { status: 400 })
  const res = await sbFetch(`/master_items?id=eq.${id}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error al eliminar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
