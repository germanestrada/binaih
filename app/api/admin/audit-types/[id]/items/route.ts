/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

  const res = await sbFetch('/audit_type_items', {
    method: 'POST',
    body: JSON.stringify({ ...body, audit_type_id: id, tenant_id: session.user.companyId, created_by: session.user.id }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error' }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}
