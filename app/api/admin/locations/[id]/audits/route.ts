/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'
import { logAction } from '@/lib/action-log'
import { validateRouteId } from '@/lib/validate'

// GET — contar auditorías de una locación
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const [totalRes, completedRes, locRes] = await Promise.all([
    sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id`),
    sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}&status=eq.completed&select=id`),
    sbFetch(`/locations?id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id,name&limit=1`),
  ])

  const [total, completed, locs] = await Promise.all([
    totalRes.json() as Promise<any[]>,
    completedRes.json() as Promise<any[]>,
    locRes.json() as Promise<any[]>,
  ])

  return NextResponse.json({
    total:     total.length,
    completed: completed.length,
    location:  locs[0] ?? null,
  })
}

// DELETE — eliminar todas las auditorías de una locación
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { confirmed, locationName } = await req.json()
  if (!confirmed) return NextResponse.json({ error: 'Confirmación requerida' }, { status: 400 })

  try {
    // Obtener IDs de auditorías
    const auditsRes = await sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}&select=id`)
    const audits    = await auditsRes.json() as any[]
    const auditIds  = audits.map((a: any) => a.id)

    if (auditIds.length === 0) return NextResponse.json({ ok: true, deleted: 0 })

    // Eliminar registros relacionados en cascada
    await Promise.all([
      sbFetch(`/audit_item_results?audit_id=in.(${auditIds.join(',')})`, { method: 'DELETE' }),
      sbFetch(`/audit_findings?audit_id=in.(${auditIds.join(',')})`, { method: 'DELETE' }),
      sbFetch(`/ai_analysis_logs?audit_id=in.(${auditIds.join(',')})`, { method: 'DELETE' }),
      sbFetch(`/location_score_history?audit_id=in.(${auditIds.join(',')})`, { method: 'DELETE' }),
    ])

    // Eliminar auditorías
    await sbFetch(`/audits?location_id=eq.${id}&tenant_id=eq.${session.user.companyId}`, { method: 'DELETE' })

    // Registrar en action_logs
    await logAction({
      tenantId:        session.user.companyId,
      userId:          session.user.id,
      action:          'delete_audits',
      entityType:      'location',
      entityId:        id,
      entityName:      locationName ?? id,
      recordsAffected: auditIds.length,
      description:     `Eliminación masiva de ${auditIds.length} auditorías de la locación "${locationName}"`,
      metadata:        { auditIds, locationId: id },
    })

    return NextResponse.json({ ok: true, deleted: auditIds.length })
  } catch (e: any) {
    await logAction({
      tenantId:     session.user.companyId,
      userId:       session.user.id,
      action:       'delete_audits',
      entityType:   'location',
      entityId:     id,
      entityName:   locationName ?? id,
      status:       'failed',
      errorMessage: e.message,
    })
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}