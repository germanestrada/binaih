/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [typesRes, templatesRes] = await Promise.all([
    sbFetch(`/audit_types?tenant_id=eq.${session.user.companyId}&select=id,name,description,icon,color,active,is_custom,template_id,min_role&order=name.asc`),
    sbFetch(`/audit_type_templates?active=eq.true&select=id,name,description,icon,color,sector,subsector&order=sector.asc,name.asc`),
  ])

  const types     = await typesRes.json()
  const templates = await templatesRes.json()
  return NextResponse.json({ data: types, templates })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description, icon, color, template_id, min_role } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const res = await sbFetch('/audit_types', {
    method: 'POST',
    body: JSON.stringify({
      name, description: description || null,
      icon: icon || '📋', color: color || '#111111',
      template_id: template_id || null,
      min_role: min_role || 'auditor',
      is_custom: !template_id,
      tenant_id:  session.user.companyId,
      active:     true,
      created_by: session.user.id,
    }),
  })
  if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message ?? 'Error al crear' }, { status: 400 }) }
  const data = await res.json() as any[]

  // Si viene de plantilla, copiar los ítems de la plantilla
  if (template_id && data[0]) {
    const auditTypeId = data[0].id
    const itemsRes = await sbFetch(`/audit_type_template_items?template_id=eq.${template_id}&select=master_item_id,section,order_index,weight,max_score,required`)
    const items    = await itemsRes.json() as any[]

    if (items.length > 0) {
      const masterIds  = items.map((i: any) => i.master_item_id)
      const mastersRes = await sbFetch(`/master_items?id=in.(${masterIds.join(',')})&select=id,title,description,response_type,ai_enabled,ai_prompt,scale_min_label,scale_max_label`)
      const masters    = await mastersRes.json() as any[]

      const fullItems = items.map((item: any) => {
        const master = masters.find((m: any) => m.id === item.master_item_id)
        return {
          audit_type_id: auditTypeId,
          tenant_id:     session.user.companyId,
          title:         master?.title ?? 'Ítem',
          description:   master?.description ?? null,
          section:       item.section,
          order_index:   item.order_index,
          weight:        item.weight ?? master?.weight_default ?? 1.0,
          max_score:     item.max_score ?? master?.max_score_default ?? 10,
          required:      item.required ?? master?.required_default ?? true,
          response_type: master?.response_type ?? 'binary',
          ai_enabled:    master?.ai_enabled ?? false,
          ai_prompt:     master?.ai_prompt ?? null,
          scale_min_label: master?.scale_min_label ?? null,
          scale_max_label: master?.scale_max_label ?? null,
          active:        true,
          created_by:    session.user.id,
        }
      })
      await sbFetch('/audit_type_items', { method: 'POST', body: JSON.stringify(fullItems) })
    }
  }

  return NextResponse.json({ data: data[0] })
}