/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET   = 'tveo_files'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/webp','image/heic']

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.companyId
  const userId   = session.user.id

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const auditId  = formData.get('audit_id') as string | null
    const itemId   = formData.get('item_id')  as string | null

    if (!file)    return NextResponse.json({ error: 'Archivo requerido' },   { status: 400 })
    if (!auditId) return NextResponse.json({ error: 'audit_id requerido' },  { status: 400 })
    if (!itemId)  return NextResponse.json({ error: 'item_id requerido' },   { status: 400 })

    // Validar tipo
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `Tipo no permitido: ${file.type}. Use JPG, PNG o WebP` }, { status: 400 })
    }

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar 10MB' }, { status: 400 })
    }

    // Generar path: tenant_id/audits/audit_id/item_id_timestamp.ext
    const ext       = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const path      = `${tenantId}/audits/${auditId}/${itemId}_${timestamp}.${ext}`

    // Subir a Supabase Storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType:  file.type,
        cacheControl: '3600',
        upsert:       false,
        metadata: {
          tenant_id: tenantId,
          audit_id:  auditId,
          item_id:   itemId,
          user_id:   userId,
        }
      })

    if (uploadError) {
      console.error('[upload] Storage error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Generar URL firmada (válida por 1 hora para análisis IA)
    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600)

    // URL pública del archivo (sin expiración, para guardar en BD)
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    return NextResponse.json({
      ok:         true,
      path,
      url:        publicUrl,
      signed_url: signedData?.signedUrl ?? publicUrl,
    })

  } catch (e: any) {
    console.error('[upload] Error:', e)
    return NextResponse.json({ error: e.message ?? 'Error al subir imagen' }, { status: 500 })
  }
}

// DELETE — eliminar imagen del storage
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path } = await req.json()
  if (!path) return NextResponse.json({ error: 'path requerido' }, { status: 400 })

  // Verificar que el path pertenece al tenant
  if (!path.startsWith(session.user.companyId + '/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}