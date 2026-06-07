/* eslint-disable @typescript-eslint/no-explicit-any */
/**/
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM para filtrar por mes

  let query = `/audit_schedules?tenant_id=eq.${session.user.companyId}&select=*,locations(id,name,city),audit_types(id,name,icon,color),users!audit_schedules_auditor_id_fkey(id,name,email)&order=next_run_at.asc`

  const res  = await sbFetch(query)
  const data = await res.json() as any[]
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { location_id, audit_type_id, auditor_id, frequency,
          week_days, month_day, scheduled_time, timezone,
          starts_at, ends_at, notes } = body

  if (!location_id || !audit_type_id || !auditor_id || !frequency || !starts_at) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Calcular próxima ejecución via función SQL
  const nextRes  = await sbFetch(`/rpc/calculate_next_run`, {
    method: 'POST',
    body: JSON.stringify({
      p_frequency:      frequency,
      p_week_days:      week_days ?? null,
      p_month_day:      month_day ?? null,
      p_scheduled_time: scheduled_time ?? '08:00',
      p_timezone:       timezone ?? 'America/Bogota',
    }),
  })
  const next_run_at = nextRes.ok ? await nextRes.json() : null

  const res = await sbFetch('/audit_schedules', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id:      session.user.companyId,
      location_id,
      audit_type_id,
      auditor_id,
      frequency,
      week_days:      week_days ?? null,
      month_day:      month_day ?? null,
      scheduled_time: scheduled_time ?? '08:00',
      timezone:       timezone ?? 'America/Bogota',
      starts_at,
      ends_at:        ends_at ?? null,
      notes:          notes ?? null,
      next_run_at,
      active:         true,
      created_by:     session.user.id,
    }),
  })

  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}