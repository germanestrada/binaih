import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'
import { validateRouteId } from '@/lib/validate'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guardSuperAdmin()
  if (error) return error

  const rawId = (await params).id
  const id    = validateRouteId(rawId)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  // Verificar si está en uso en audit_type_items o audit_type_template_items
  const [itemsRes, templateRes] = await Promise.all([
    sbFetch(`/audit_type_items?master_item_id=eq.${id}&select=id&limit=1`),
    sbFetch(`/audit_type_template_items?master_item_id=eq.${id}&select=id&limit=1`),
  ])

  const [auditTypeItems, templateItems] = await Promise.all([
    itemsRes.json() as Promise<any[]>,
    templateRes.json() as Promise<any[]>,
  ])

  const inUse = auditTypeItems.length > 0 || templateItems.length > 0
  return NextResponse.json({
    inUse,
    auditTypeItems: auditTypeItems.length,
    templateItems:  templateItems.length,
  })
}