/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res  = await sbFetch(`/location_types?tenant_id=eq.${session.user.companyId}&select=id,name,icon,description,active,created_at&order=name.asc`)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, icon, description } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  const res = await sbFetch('/location_types', {
    method: 'POST',
    body: JSON.stringify({ name, icon: icon || '📍', description: description || null, tenant_id: session.user.companyId, active: true, created_by: session.user.id }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error al crear' }, { status: 400 }) }
  const data = await res.json()
  return NextResponse.json({ data: data[0] })
}
