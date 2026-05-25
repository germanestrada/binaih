import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res  = await sbFetch(`/audit_types?tenant_id=eq.${session.user.companyId}&active=eq.true&select=id,name,description,icon,color,min_role&order=name.asc`)
  const data = await res.json()
  return NextResponse.json({ data })
}
