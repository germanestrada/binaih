/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

// PATCH — actualizar resultado de un ítem
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id }  = await params
  const body    = await req.json()
  const { item_result_id, status, score, scale_value, text_value, numeric_value, evidence_url, notes, source, ai_confidence } = body

  if (!item_result_id) return NextResponse.json({ error: 'item_result_id requerido' }, { status: 400 })

  const updates: any = {
    updated_at: new Date().toISOString(),
    created_by: session.user.id,
  }
  if (status        !== undefined) updates.status        = status
  if (score         !== undefined) updates.score         = score
  if (scale_value   !== undefined) updates.scale_value   = scale_value
  if (text_value    !== undefined) updates.text_value    = text_value
  if (numeric_value !== undefined) updates.numeric_value = numeric_value
  if (evidence_url  !== undefined) updates.evidence_url  = evidence_url
  if (notes         !== undefined) updates.notes         = notes
  if (source        !== undefined) updates.source        = source
  if (ai_confidence !== undefined) updates.ai_confidence = ai_confidence

  const res = await sbFetch(`/audit_item_results?id=eq.${item_result_id}&audit_id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar ítem' }, { status: 400 })

  // Recalcular scored_items
  const countRes = await sbFetch(`/audit_item_results?audit_id=eq.${id}&status=neq.pending&select=id`)
  const counted  = await countRes.json() as any[]
  await sbFetch(`/audits?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ scored_items: counted.length }) })

  return NextResponse.json({ ok: true })
}
