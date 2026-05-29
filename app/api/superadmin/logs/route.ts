import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const res  = await sbFetch('/tveo_admin_logs?select=*,tveo_admins(name,email)&order=created_at.desc&limit=100')
  const data = await res.json()
  return NextResponse.json({ data })
}
