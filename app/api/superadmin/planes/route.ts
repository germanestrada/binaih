/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const res  = await sbFetch('/plans?select=*&order=price_usd.asc')
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const body = await req.json()
  const res  = await sbFetch('/plans', { method: 'POST', body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}

export async function PATCH(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id, ...updates } = await req.json()
  const res = await sbFetch(`/plans?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
