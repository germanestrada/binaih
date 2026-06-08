/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'
import { logAction } from '@/lib/action-log'
import { validateRouteId } from '@/lib/validate'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  // Verificar que pertenece al tenant
  const locRes = await sbFetch(`/locations?id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id,name&limit=1`)
  const locs   = await locRes.json() as any[]
  if (!locs.length) return NextResponse.json({ error: 'Locación no encontrada' }, { status: 404 })

  // Verificar si tiene auditorías
  const auditsRes = await sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id&limit=1`)
  const audits    = await auditsRes.json() as any[]

  if (audits.length > 0) {
    // Contar total y completadas
    const [totalRes, completedRes] = await Promise.all([
      sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id`),
      sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}&status=eq.completed&select=id`),
    ])
    const total     = (await totalRes.json() as any[]).length
    const completed = (await completedRes.json() as any[]).length

    return NextResponse.json({
      error:     'blocked',
      message:   `Esta locación tiene ${total} auditoría${total !== 1 ? 's' : ''} asociada${total !== 1 ? 's' : ''} (${completed} completada${completed !== 1 ? 's' : ''}). Elimina primero las auditorías antes de eliminar la locación.`,
      total,
      completed,
    }, { status: 409 })
  }

  // Sin auditorías — eliminar
  await sbFetch(`/locations?id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })

  await logAction({
    tenantId:        session.user.companyId,
    userId:          session.user.id,
    action:          'delete_location',
    entityType:      'location',
    entityId:        id,
    entityName:      locs[0].name,
    recordsAffected: 1,
    description:     `Eliminación de locación "${locs[0].name}"`,
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body    = await req.json()
  const allowed = ['name','address','city','zone','status','type_id','manager_name','manager_phone','area_sqm','lat','lng','notes']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })

  const res = await sbFetch(
    `/locations?id=eq.${id}&tenant_id=eq.${session.user.companyId}`,
    { method: 'PATCH', body: JSON.stringify(updates) }
  )
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}