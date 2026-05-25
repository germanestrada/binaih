/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res  = await sbFetch(`/tenant_items?tenant_id=eq.${session.user.companyId}&select=id,active,custom_title,custom_weight,master_item_id,master_items(code,title,icon,category,plan_tier_required,ai_enabled)&order=master_items(category).asc`)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { master_item_id, active, custom_title, custom_weight } = await req.json()
  const updates: any = { updated_at: new Date().toISOString() }
  if (active        !== undefined) updates.active        = active
  if (custom_title  !== undefined) updates.custom_title  = custom_title || null
  if (custom_weight !== undefined) updates.custom_weight = custom_weight || null

  const res = await sbFetch(`/tenant_items?tenant_id=eq.${session.user.companyId}&master_item_id=eq.${master_item_id}`, {
    method: 'PATCH', body: JSON.stringify(updates),
  })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
