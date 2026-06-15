/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

const MAX_ROWS = 500

// Parser CSV robusto que maneja campos con comillas y comas internas
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  
  // Detectar separador (coma o punto y coma)
  const firstLine = lines[0]
  const sep = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ','

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        // Campo con comillas
        let cell = ''
        i++ // saltar comilla inicial
        while (i < line.length) {
          if (line[i] === '"' && line[i+1] === '"') { cell += '"'; i += 2 }
          else if (line[i] === '"') { i++; break }
          else { cell += line[i++] }
        }
        cells.push(cell)
        if (line[i] === sep) i++ // saltar separador
      } else {
        // Campo sin comillas
        const end = line.indexOf(sep, i)
        if (end === -1) { cells.push(line.slice(i)); break }
        cells.push(line.slice(i, end))
        i = end + 1
      }
    }
    return cells
  }

  const headers = parseRow(lines[0]).map(h => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals  = parseRow(line)
    const entry = Object.fromEntries(headers.map((h, j) => [h, (vals[j] ?? '').trim()]))
    rows.push(entry)
  }

  return rows
}

export async function POST(req: Request) {
  const { error } = await guardSuperAdmin()
  if (error) return error

  const { items } = await req.json() as { items: any[] }
  if (!items?.length) return NextResponse.json({ error: 'Sin ítems' }, { status: 400 })
  if (items.length > MAX_ROWS) return NextResponse.json({ error: `Máximo ${MAX_ROWS} ítems por cargue` }, { status: 400 })

  const results = {
    created:  0,
    updated:  0,
    errors:   0,
    log:      [] as { row: number; code: string; title: string; status: 'ok' | 'error'; message?: string }[]
  }

  // Procesar ítem por ítem para tener log detallado
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rowNum = i + 2 // +2 porque fila 1 es header

    // Validar campos requeridos
    if (!item.code?.trim()) {
      results.errors++
      results.log.push({ row: rowNum, code: item.code || '—', title: item.title || '—', status: 'error', message: 'Falta el campo "code"' })
      continue
    }
    if (!item.title?.trim()) {
      results.errors++
      results.log.push({ row: rowNum, code: item.code, title: '—', status: 'error', message: 'Falta el campo "title"' })
      continue
    }
    if (!item.category?.trim()) {
      results.errors++
      results.log.push({ row: rowNum, code: item.code, title: item.title, status: 'error', message: 'Falta el campo "category"' })
      continue
    }

    const payload = {
      code:                    item.code.trim(),
      title:                   item.title.trim(),
      description:             item.description?.trim() || null,
      icon:                    item.icon?.trim() || '📋',
      category:                item.category.trim().toLowerCase(),
      response_type:           ['binary','scale_5','scale_10','numeric','text','photo'].includes(item.response_type) ? item.response_type : 'binary',
      weight_default:          parseFloat(item.weight_default) || 1,
      max_score_default:       parseInt(item.max_score_default) || 10,
      required_default:        item.required_default === 'true' || item.required_default === true,
      ai_enabled:              item.ai_enabled === 'true' || item.ai_enabled === true,
      ai_visual_category:      item.ai_visual_category?.trim() || 'general',
      ai_confidence_threshold: parseInt(item.ai_confidence_threshold) || 80,
      ai_prompt:               item.ai_prompt?.trim() || null,
      ai_criteria:             item.ai_criteria?.trim() || null,
      plan_tier_required:      ['starter','professional','enterprise'].includes(item.plan_tier_required) ? item.plan_tier_required : 'starter',
      active:                  item.active !== 'false' && item.active !== false,
    }

    try {
      const res = await sbFetch('/master_items?on_conflict=code', {
        method:  'POST',
        body:    JSON.stringify(payload),
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      })

      if (res.ok) {
        results.created++
        results.log.push({ row: rowNum, code: payload.code, title: payload.title, status: 'ok' })
      } else {
        const errData = await res.json().catch(() => ({}))
        results.errors++
        results.log.push({
          row: rowNum, code: payload.code, title: payload.title,
          status: 'error',
          message: errData?.message ?? errData?.error ?? `HTTP ${res.status}`,
        })
      }
    } catch (e: any) {
      results.errors++
      results.log.push({ row: rowNum, code: payload.code, title: payload.title, status: 'error', message: e.message })
    }
  }

  return NextResponse.json({
    ok:      results.errors === 0,
    created: results.created,
    errors:  results.errors,
    log:     results.log,
  })
}