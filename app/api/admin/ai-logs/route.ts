/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit  = searchParams.get('limit') ?? '50'
  const auditId = searchParams.get('audit_id')

  let query = `/ai_analysis_logs?tenant_id=eq.${session.user.companyId}&select=id,provider,model,proposed_status,proposed_score,confidence,success,error_message,duration_ms,created_at,image_url,audits(locations(name))&order=created_at.desc&limit=${limit}`
  if (auditId) query += `&audit_id=eq.${auditId}`

  const res  = await sbFetch(query)
  const data = await res.json() as any[]

  // Estadísticas
  const stats = {
    total:      data.length,
    successful: data.filter((l: any) => l.success).length,
    failed:     data.filter((l: any) => !l.success).length,
    avgConfidence: data.length
      ? Math.round(data.filter((l: any) => l.success).reduce((acc: number, l: any) => acc + (l.confidence ?? 0), 0) / (data.filter((l: any) => l.success).length || 1))
      : 0,
    avgDuration: data.length
      ? Math.round(data.reduce((acc: number, l: any) => acc + (l.duration_ms ?? 0), 0) / data.length)
      : 0,
  }

  return NextResponse.json({ data, stats })
}
