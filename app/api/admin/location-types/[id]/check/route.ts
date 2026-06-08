import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'
import { validateRouteId } from '@/lib/validate'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const res  = await sbFetch(`/locations?type_id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id`)
  const data = await res.json() as any[]
  return NextResponse.json({ count: data.length })
}