/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [auditRes, itemsRes] = await Promise.all([
    sbFetch(`/audits?id=eq.${id}&select=*,locations(id,name,city,zone),audit_types(id,name,icon,description),users!audits_auditor_id_fkey(name)&limit=1`),
    sbFetch(`/audit_item_results?audit_id=eq.${id}&select=*,audit_type_items(id,title,description,section,order_index,response_type,max_score,weight,required,ai_enabled,scale_min_label,scale_max_label)&order=audit_type_items(order_index).asc`),
  ])

  const audits = await auditRes.json() as any[]
  if (!audits.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = await itemsRes.json() as any[]

  // Agrupar ítems por sección
  const sections: Record<string, any[]> = {}
  items.forEach((r: any) => {
    const sec = r.audit_type_items?.section ?? 'General'
    if (!sections[sec]) sections[sec] = []
    sections[sec].push(r)
  })

  return NextResponse.json({ ...audits[0], items, sections })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id }  = await params
  const body    = await req.json()

  const allowed = ['status','score','notes','reviewer_id','signature_url','started_at','completed_at','source']
  const updates: any = { updated_at: new Date().toISOString() }
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })

  // Al iniciar: registrar hora
  if (body.status === 'in_progress' && !body.started_at) updates.started_at = new Date().toISOString()
  // Al completar: registrar hora y calcular score si no viene
  if (body.status === 'completed') {
    if (!body.completed_at) updates.completed_at = new Date().toISOString()
    if (body.score !== undefined) updates.score = body.score
  }

  const res  = await sbFetch(`/audits?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })

  return NextResponse.json({ ok: true })
}