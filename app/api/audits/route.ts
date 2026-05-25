/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const locationId = searchParams.get('location_id')

  let query = `/audits?tenant_id=eq.${session.user.companyId}&select=id,location_id,auditor_id,type_id,status,score,scheduled_at,started_at,completed_at,total_items,scored_items,source,locations(name,city),audit_types(name,icon),users(name)&order=scheduled_at.desc&limit=50`
  if (status)     query += `&status=eq.${status}`
  if (locationId) query += `&location_id=eq.${locationId}`

  const res  = await sbFetch(query)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { location_id, type_id, auditor_id, scheduled_at, notes } = body
  if (!location_id || !type_id || !auditor_id || !scheduled_at) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Crear la auditoría
  const res = await sbFetch('/audits', {
    method: 'POST',
    body: JSON.stringify({
      location_id, type_id, auditor_id,
      scheduled_at, notes: notes || null,
      tenant_id:  session.user.companyId,
      status:     'scheduled',
      source:     'manual',
      created_by: session.user.id,
    }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error al crear' }, { status: 400 }) }
  const audits = await res.json() as any[]
  const audit  = audits[0]

  // Pre-crear los registros de resultado por cada ítem del tipo
  const itemsRes  = await sbFetch(`/audit_type_items?audit_type_id=eq.${type_id}&active=eq.true&select=id&order=order_index.asc`)
  const items     = await itemsRes.json() as any[]

  if (items.length > 0) {
    const results = items.map((item: any) => ({
      audit_id:   audit.id,
      item_id:    item.id,
      tenant_id:  session.user.companyId,
      status:     'pending',
      source:     'manual',
      created_by: session.user.id,
    }))
    await sbFetch('/audit_item_results', { method: 'POST', body: JSON.stringify(results) })
    // Actualizar total_items
    await sbFetch(`/audits?id=eq.${audit.id}`, { method: 'PATCH', body: JSON.stringify({ total_items: items.length, scored_items: 0 }) })
  }

  return NextResponse.json({ data: { ...audit, total_items: items.length } })
}
