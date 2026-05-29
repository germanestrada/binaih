/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'
import bcrypt from 'bcryptjs'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const res  = await sbFetch('/tveo_admins?select=id,name,email,totp_enabled,status,last_login,login_count,created_at&order=created_at.desc')
  const data = await res.json()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { name, email, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  const hash = bcrypt.hashSync(password, 10)
  const res  = await sbFetch('/tveo_admins', { method: 'POST', body: JSON.stringify({ name, email, password: hash, status: 'active' }) })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: 400 }) }
  const data = await res.json() as any[]
  return NextResponse.json({ data: data[0] })
}
