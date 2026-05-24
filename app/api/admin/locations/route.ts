/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res  = await sbFetch(`/locations?tenant_id=eq.${session.user.companyId}&select=id,name,city,zone,status,current_score,manager_name,type_id,last_audit_at&order=name.asc`)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { name, city } = body
  if (!name || !city) return NextResponse.json({ error: 'Nombre y ciudad requeridos' }, { status: 400 })
  const id = (name as string).toUpperCase().replace(/\s+/g,'').slice(0,4) + Date.now().toString().slice(-4)
  const res = await sbFetch('/locations', {
    method: 'POST',
    body: JSON.stringify({ ...body, id, tenant_id: session.user.companyId, status: body.status ?? 'active', created_by: session.user.id }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error al crear' }, { status: 400 }) }
  const data = await res.json()
  return NextResponse.json({ data: data[0] })
}
