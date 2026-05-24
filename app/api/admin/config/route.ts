/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res  = await sbFetch(`/system_config?tenant_id=eq.${session.user.companyId}&select=id,key,value,type,group_name,label,description,is_secret,active&order=group_name.asc,label.asc`)
  const data = await res.json() as any[]
  // Ocultar valores secretos
  const sanitized = data.map((c: any) => ({ ...c, value: c.is_secret ? '••••••••' : c.value }))
  return NextResponse.json({ data: sanitized })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, value, active } = await req.json()
  const updates: any = { updated_at: new Date().toISOString(), updated_by: session.user.id }
  if (value  !== undefined) updates.value  = value
  if (active !== undefined) updates.active = active
  const res  = await sbFetch(`/system_config?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
