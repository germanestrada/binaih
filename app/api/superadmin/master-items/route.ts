/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const res  = await sbFetch('/master_items?select=*&order=category.asc,code.asc')
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const body = await req.json()
  if (!body.code || !body.title || !body.category) return NextResponse.json({ error: 'code, title y category requeridos' }, { status: 400 })
  const res  = await sbFetch('/master_items', { method: 'POST', body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}
