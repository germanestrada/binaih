/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { itemId } = await params
  const body = await req.json()
  const allowed = ['title','description','section','order_index','response_type','max_score','weight','required','ai_enabled','active','scale_min_label','scale_max_label']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })
  const res = await sbFetch(`/audit_type_items?id=eq.${itemId}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { itemId } = await params
  const res = await sbFetch(`/audit_type_items?id=eq.${itemId}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error al eliminar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
