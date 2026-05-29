/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { template_id, master_item_id, section, order_index } = await req.json()
  const res = await sbFetch('/audit_type_template_items', {
    method: 'POST',
    body: JSON.stringify({ template_id, master_item_id, section: section||'General', order_index: order_index||0 }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}

export async function DELETE(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id } = await req.json()
  await sbFetch(`/audit_type_template_items?id=eq.${id}`, { method: 'DELETE' })
  return NextResponse.json({ ok: true })
}
