/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error

  const res  = await sbFetch('/tenants?select=*,plans(name,tier)&order=created_at.desc')
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { error, session } = await guardSuperAdmin()
  if (error) return error

  const body = await req.json()
  const { name, nit, sector, plan_id } = body
  if (!name || !plan_id) return NextResponse.json({ error: 'Nombre y plan requeridos' }, { status: 400 })

  // Crear tenant
  const tenantRes = await sbFetch('/tenants', {
    method: 'POST',
    body: JSON.stringify({
      name, nit: nit||null, sector: sector||null,
      plan_id, status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_by: session!.id,
    }),
  })
  if (!tenantRes.ok) { const e = await tenantRes.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const tenants = await tenantRes.json() as any[]

  // Log
  await sbFetch('/tveo_admin_logs', {
    method: 'POST',
    body: JSON.stringify({ admin_id: session!.id, action: 'create_tenant', resource: tenants[0]?.id, details: { name } }),
  })

  return NextResponse.json({ data: tenants[0] })
}
