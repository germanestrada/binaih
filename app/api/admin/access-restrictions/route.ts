/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res  = await sbFetch(`/access_restrictions?tenant_id=eq.${session.user.companyId}&select=*&order=created_at.asc`)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const res  = await sbFetch('/access_restrictions', {
    method: 'POST',
    body: JSON.stringify({ ...body, tenant_id: session.user.companyId, created_by: session.user.id }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}
