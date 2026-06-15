/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

const MAX_ROWS = 200

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error

  const { items } = await req.json() as { items: any[] }
  if (!items?.length) return NextResponse.json({ error: 'Sin ítems' }, { status: 400 })
  if (items.length > MAX_ROWS) return NextResponse.json({ error: `Máximo ${MAX_ROWS} ítems por cargue` }, { status: 400 })

  // Validar campos requeridos
  const errors: string[] = []
  items.forEach((item, i) => {
    if (!item.code)     errors.push(`Fila ${i+1}: falta code`)
    if (!item.title)    errors.push(`Fila ${i+1}: falta title`)
    if (!item.category) errors.push(`Fila ${i+1}: falta category`)
  })
  if (errors.length) return NextResponse.json({ error: errors.slice(0,5).join('; ') }, { status: 400 })

  // Upsert en lotes de 50
  const results = { created: 0, updated: 0, errors: 0 }
  const BATCH   = 50

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map(item => ({
      code:                    item.code?.trim(),
      title:                   item.title?.trim(),
      description:             item.description?.trim() || null,
      icon:                    item.icon?.trim() || '📋',
      category:                item.category?.trim().toLowerCase(),
      response_type:           item.response_type || 'binary',
      weight_default:          parseFloat(item.weight_default) || 1,
      max_score_default:       parseInt(item.max_score_default) || 10,
      required_default:        item.required_default === 'true' || item.required_default === true,
      ai_enabled:              item.ai_enabled === 'true' || item.ai_enabled === true,
      ai_visual_category:      item.ai_visual_category || 'general',
      ai_confidence_threshold: parseInt(item.ai_confidence_threshold) || 80,
      ai_prompt:               item.ai_prompt?.trim() || null,
      ai_criteria:             item.ai_criteria?.trim() || null,
      plan_tier_required:      item.plan_tier_required || 'starter',
      active:                  item.active !== 'false' && item.active !== false,
    }))

    const res = await sbFetch('/master_items?on_conflict=code', {
      method: 'POST',
      body: JSON.stringify(batch),
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    })

    if (res.ok) {
      const data = await res.json() as any[]
      results.created += data.length
    } else {
      results.errors += batch.length
    }
  }

  return NextResponse.json({ ok: true, ...results })
}