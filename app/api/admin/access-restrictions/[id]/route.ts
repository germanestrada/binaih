/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { validateRouteId } from '@/lib/validate'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id }  = await params
  const body    = await req.json()
  const allowed = ['role_name','user_id','ip_enabled','ip_whitelist','schedule_enabled','timezone','schedule','active']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })
  const res = await sbFetch(`/access_restrictions?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rawId = (await params).id
  const id = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  await sbFetch(`/access_restrictions?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })
  return NextResponse.json({ ok: true })
}
