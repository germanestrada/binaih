/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const [typeRes, itemsRes] = await Promise.all([
    sbFetch(`/audit_types?id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=*&limit=1`),
    sbFetch(`/audit_type_items?audit_type_id=eq.${id}&select=*&order=order_index.asc`),
  ])

  const types = await typeRes.json() as any[]
  if (!types.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const items = await itemsRes.json()
  return NextResponse.json({ ...types[0], items })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id }  = await params
  const body    = await req.json()
  const allowed = ['name','description','icon','color','active','min_role']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })
  const res = await sbFetch(`/audit_types?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const checkRes = await sbFetch(`/audits?type_id=eq.${id}&select=id&limit=1`)
  const check    = await checkRes.json() as any[]
  if (check.length > 0) return NextResponse.json({ error: 'Tiene auditorías asociadas. No se puede eliminar.' }, { status: 400 })
  await sbFetch(`/audit_type_items?audit_type_id=eq.${id}`, { method: 'DELETE' })
  const res = await sbFetch(`/audit_types?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error al eliminar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
