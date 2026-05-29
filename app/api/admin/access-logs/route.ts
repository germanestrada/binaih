/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const limit  = searchParams.get('limit') ?? '100'

  let query = `/user_access_logs?tenant_id=eq.${session.user.companyId}&select=id,action,ip_address,created_at,users(name,email,role_name)&order=created_at.desc&limit=${limit}`
  if (userId) query += `&user_id=eq.${userId}`

  const res  = await sbFetch(query)
  const data = await res.json() as any[]
  return NextResponse.json({ data })
}
