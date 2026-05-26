/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

// GET — listar batch jobs del tenant
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res  = await sbFetch(
    `/batch_jobs?tenant_id=eq.${session.user.companyId}&select=*,locations(name,city),audit_types(name,icon)&order=created_at.desc&limit=20`
  )
  const data = await res.json()
  return NextResponse.json({ data })
}

// POST — crear batch job
export async function POST(req: Request) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { location_id, audit_type_id, source_path, storage_provider, scheduled_at } = await req.json()
  if (!location_id || !audit_type_id || !source_path) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const res = await sbFetch('/batch_jobs', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id:        session.user.companyId,
      location_id,
      audit_type_id,
      source_path,
      storage_provider: storage_provider ?? 'r2',
      scheduled_at:     scheduled_at ?? null,
      status:           'pending',
      created_by:       session.user.id,
    }),
  })

  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}
