/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const userId     = searchParams.get('user_id')
  const entityType = searchParams.get('entity_type')
  const limit      = searchParams.get('limit') ?? '100'

  let query = `/action_logs?tenant_id=eq.${session.user.companyId}&select=*,users(id,name,email,role_name)&order=created_at.desc&limit=${limit}`
  if (userId)     query += `&user_id=eq.${userId}`
  if (entityType) query += `&entity_type=eq.${entityType}`

  const res  = await sbFetch(query)
  const data = await res.json()
  return NextResponse.json({ data })
}

// Helper exportado para registrar acciones desde otras APIs
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const res  = await sbFetch('/action_logs', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id:        session.user.companyId,
      user_id:          session.user.id,
      action:           body.action,
      entity_type:      body.entity_type,
      entity_id:        body.entity_id ?? null,
      entity_name:      body.entity_name ?? null,
      records_affected: body.records_affected ?? 0,
      description:      body.description ?? null,
      metadata:         body.metadata ?? null,
      status:           body.status ?? 'success',
      error_message:    body.error_message ?? null,
    }),
  })
  if (!res.ok) return NextResponse.json({ error: 'Error al registrar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}