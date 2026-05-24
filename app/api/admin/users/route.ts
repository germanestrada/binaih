/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res  = await sbFetch(`/users?tenant_id=eq.${session.user.companyId}&select=id,name,email,role_name,zone,status,last_login,created_at&order=created_at.desc`)
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, email, password, role_name, zone } = await req.json()
  if (!name || !email || !password || !role_name) return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  const res = await sbFetch('/users', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: bcrypt.hashSync(password, 10), role_name, zone: zone || null, tenant_id: session.user.companyId, status: 'active', created_by: session.user.id }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error al crear' }, { status: 400 }) }
  const data = await res.json()
  return NextResponse.json({ data: data[0] })
}
