/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const [tplRes, itemsRes] = await Promise.all([
    sbFetch('/audit_type_templates?select=*&order=name.asc'),
    sbFetch('/audit_type_template_items?select=*,master_items(code,title,icon,category)&order=order_index.asc'),
  ])
  const templates = await tplRes.json()  as any[]
  const items     = await itemsRes.json() as any[]
  const data = templates.map((t: any) => ({ ...t, items: items.filter((i: any) => i.template_id === t.id) }))
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  const res  = await sbFetch('/audit_type_templates', { method: 'POST', body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}

export async function PATCH(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id, ...updates } = await req.json()
  const res = await sbFetch(`/audit_type_templates?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }) })
  if (!res.ok) return NextResponse.json({ error: 'Error' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id } = await req.json()
  // Eliminar ítems de la plantilla primero
  await sbFetch(`/audit_type_template_items?template_id=eq.${id}`, { method: 'DELETE' })
  const res = await sbFetch(`/audit_type_templates?id=eq.${id}`, { method: 'DELETE' })
  if (!res.ok) return NextResponse.json({ error: 'Error' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
