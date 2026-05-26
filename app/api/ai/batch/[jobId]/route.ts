/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeImage, getAIConfig, shouldAutoApprove } from '@/lib/ai-vision'
import { sbFetch } from '@/lib/admin-fetch'

// GET — estado del job
export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { jobId } = await params
  const res  = await sbFetch(`/batch_jobs?id=eq.${jobId}&select=*,locations(name,city),audit_types(name,icon),batch_image_results(*)&limit=1`)
  const data = await res.json() as any[]
  if (!data.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data[0])
}

// POST — procesar el job (disparar análisis)
export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { jobId } = await params
  const body = await req.json()
  const imageUrls: string[] = body.imageUrls ?? [] // URLs de las imágenes a analizar

  if (!imageUrls.length) return NextResponse.json({ error: 'Se requiere imageUrls' }, { status: 400 })

  const tenantId = session.user.companyId
  const config   = await getAIConfig(tenantId)
  if (!config) return NextResponse.json({ error: 'IA no configurada' }, { status: 400 })

  // Actualizar job a processing
  await sbFetch(`/batch_jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'processing', started_at: new Date().toISOString(), total_images: imageUrls.length }),
  })

  // Obtener info del job
  const jobRes  = await sbFetch(`/batch_jobs?id=eq.${jobId}&select=*&limit=1`)
  const jobs    = await jobRes.json() as any[]
  const job     = jobs[0]

  // Obtener ítems del tipo de auditoría con IA habilitada
  const itemsRes = await sbFetch(
    `/audit_type_items?audit_type_id=eq.${job.audit_type_id}&ai_enabled=eq.true&active=eq.true&select=*&order=order_index.asc`
  )
  const aiItems  = await itemsRes.json() as any[]

  // Crear auditoría automática si no existe
  let auditId = job.audit_id
  if (!auditId) {
    const auditRes = await sbFetch('/audits', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id:    tenantId,
        location_id:  job.location_id,
        type_id:      job.audit_type_id,
        auditor_id:   session.user.id,
        status:       'in_progress',
        source:       'ai',
        total_items:  aiItems.length,
        scored_items: 0,
        started_at:   new Date().toISOString(),
        created_by:   session.user.id,
      }),
    })
    const auditData = await auditRes.json() as any[]
    auditId = auditData[0]?.id

    // Pre-crear item_results
    if (auditId && aiItems.length > 0) {
      const results = aiItems.map((item: any) => ({
        audit_id:   auditId, item_id: item.id, tenant_id: tenantId,
        status: 'pending', source: 'ai', created_by: session.user.id,
      }))
      await sbFetch('/audit_item_results', { method: 'POST', body: JSON.stringify(results) })
    }

    await sbFetch(`/batch_jobs?id=eq.${jobId}`, { method: 'PATCH', body: JSON.stringify({ audit_id: auditId }) })
  }

  // Obtener item_results creados
  const resultsRes = await sbFetch(`/audit_item_results?audit_id=eq.${auditId}&select=id,item_id`)
  const itemResults = await resultsRes.json() as any[]

  // Procesar imágenes
  let autoApproved = 0, pendingReview = 0, failed = 0

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i]
    // Mapear imagen a ítem (round-robin si hay más imágenes que ítems)
    const item        = aiItems[i % aiItems.length]
    const itemResult  = itemResults.find((r: any) => r.item_id === item?.id)
    if (!item || !itemResult) { failed++; continue }

    try {
      // Descargar imagen
      const imgRes = await fetch(imageUrl)
      const buffer = await imgRes.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      // Analizar con IA
      const result = await analyzeImage({
        tenantId, imageBase64: base64,
        itemTitle:    item.title, itemDesc: item.description,
        responseType: item.response_type, aiPrompt: item.ai_prompt,
        maxScore:     item.max_score, scaleMin: item.scale_min_label, scaleMax: item.scale_max_label,
      })

      const approved = shouldAutoApprove(result.confidence, config.autoApprove)
      if (approved) autoApproved++; else pendingReview++

      // Guardar resultado
      await sbFetch(`/audit_item_results?id=eq.${itemResult.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status:          approved ? result.status : 'pending',
          score:           approved ? result.score  : null,
          evidence_url:    imageUrl,
          notes:           result.reasoning,
          source:          'ai',
          ai_confidence:   result.confidence,
          ai_raw_response: JSON.stringify(result.raw),
          updated_at:      new Date().toISOString(),
        }),
      })

      // Guardar en batch_image_results
      await sbFetch('/batch_image_results', {
        method: 'POST',
        body: JSON.stringify({
          batch_job_id:    jobId, tenant_id: tenantId,
          image_url:       imageUrl, item_result_id: itemResult.id,
          proposed_status: result.status, proposed_score: result.score,
          confidence:      result.confidence, ai_raw_response: result.raw,
          auto_approved:   approved, reviewed: approved,
        }),
      })

      // Actualizar progreso del job
      await sbFetch(`/batch_jobs?id=eq.${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify({ processed_images: i + 1, auto_approved: autoApproved, pending_review: pendingReview }),
      })

    } catch { failed++ }
  }

  // Finalizar job
  const finalStatus = pendingReview > 0 ? 'partial' : 'completed'
  await sbFetch(`/batch_jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: finalStatus, completed_at: new Date().toISOString(),
      auto_approved: autoApproved, pending_review: pendingReview, failed_images: failed,
    }),
  })

  // Si todo fue auto-aprobado, completar la auditoría
  if (finalStatus === 'completed' && auditId) {
    await sbFetch(`/audits?id=eq.${auditId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString(), source: 'ai' }),
    })
  }

  return NextResponse.json({ ok: true, auditId, autoApproved, pendingReview, failed, status: finalStatus })
}
