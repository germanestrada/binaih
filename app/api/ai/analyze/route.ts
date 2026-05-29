/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeImage, getAIConfig, shouldAutoApprove } from '@/lib/ai-vision'
import { sbFetch } from '@/lib/admin-fetch'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    imageBase64,   // base64 de la imagen
    imageUrl,      // URL si ya está en storage
    auditId,
    itemResultId,
    itemTitle,
    itemDesc,
    responseType,
    aiPrompt,
    aiCriteria,
    maxScore,
    scaleMinLabel,
    scaleMaxLabel,
  } = body

  if (!imageBase64 && !imageUrl) {
    return NextResponse.json({ error: 'Se requiere imageBase64 o imageUrl' }, { status: 400 })
  }

  const tenantId = session.user.companyId
  const config   = await getAIConfig(tenantId)
  if (!config) return NextResponse.json({ error: 'IA no configurada. Ve a Admin → Configuración → grupo "ia".' }, { status: 400 })

  // Si viene URL, validar dominio y descargar la imagen
  let base64 = imageBase64
  if (!base64 && imageUrl) {
    // Validar que la URL sea de un origen permitido (SSRF protection)
    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl)
    } catch {
      return NextResponse.json({ error: 'imageUrl inválida' }, { status: 400 })
    }
    const ALLOWED_HOSTS = [
      process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null,
      'storage.googleapis.com',
      'r2.cloudflarestorage.com',
      's3.amazonaws.com',
    ].filter(Boolean)

    const isAllowed = ALLOWED_HOSTS.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`))
    const isPrivate = /^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/.test(parsedUrl.hostname)
    if (!isAllowed || isPrivate || !['https:', 'http:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'imageUrl no pertenece a un origen permitido' }, { status: 400 })
    }
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
    const buffer = await imgRes.arrayBuffer()
    base64       = Buffer.from(buffer).toString('base64')
  }

  const start  = Date.now()
  const result = await analyzeImage({
    tenantId,
    imageBase64: base64,
    itemTitle,
    itemDesc,
    responseType,
    aiPrompt,
    aiCriteria,
    maxScore:    parseInt(maxScore ?? '10'),
    scaleMin:    scaleMinLabel,
    scaleMax:    scaleMaxLabel,
  })

  const autoApproved = shouldAutoApprove(result.confidence, config.autoApprove)

  // Guardar en ai_analysis_logs
  await sbFetch('/ai_analysis_logs', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id:       tenantId,
      audit_id:        auditId   ?? null,
      item_result_id:  itemResultId ?? null,
      provider:        config.provider,
      model:           config.model,
      prompt:          aiPrompt   ?? null,
      image_url:       imageUrl   ?? null,
      raw_response:    result.raw,
      proposed_status: result.status,
      proposed_score:  result.score,
      confidence:      result.confidence,
      duration_ms:     Date.now() - start,
      success:         result.status !== 'na',
      created_by:      session.user.id,
    }),
  })

  // Si tiene item_result_id y se auto-aprueba, guardar el resultado
  if (itemResultId && autoApproved) {
    await sbFetch(`/audit_item_results?id=eq.${itemResultId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status:        result.status,
        score:         result.score,
        scale_value:   result.raw.scale_value   ?? null,
        numeric_value: result.raw.numeric_value ?? null,
        evidence_url:  imageUrl ?? null,
        notes:         result.reasoning,
        source:        'ai',
        ai_confidence: result.confidence,
        ai_raw_response: JSON.stringify(result.raw),
        updated_at:    new Date().toISOString(),
      }),
    })
    // Actualizar scored_items
    const countRes = await sbFetch(`/audit_item_results?audit_id=eq.${auditId}&status=neq.pending&select=id`)
    const counted  = await countRes.json() as any[]
    await sbFetch(`/audits?id=eq.${auditId}`, {
      method: 'PATCH',
      body: JSON.stringify({ scored_items: counted.length }),
    })
  }

  return NextResponse.json({
    ...result,
    autoApproved,
    confidenceThreshold: config.autoApprove,
    model: config.model,
  })
}
