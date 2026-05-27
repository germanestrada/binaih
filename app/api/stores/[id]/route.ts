/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }  = await params
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key     = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  const [locRes, auditsRes, findingsRes, historyRes] = await Promise.all([
    fetch(`${url}/rest/v1/locations?id=eq.${id}&select=*,location_types(name,icon)&limit=1`, { headers }),
    fetch(`${url}/rest/v1/audits?location_id=eq.${id}&select=id,score,status,completed_at,scheduled_at,notes&order=completed_at.desc&limit=10`, { headers }),
    fetch(`${url}/rest/v1/audit_findings?location_id=eq.${id}&select=*,finding_categories(title,icon,color)&order=created_at.desc`, { headers }),
    fetch(`${url}/rest/v1/location_score_history?location_id=eq.${id}&select=score,previous_score,delta,recorded_at&order=recorded_at.asc&limit=12`, { headers }),
  ])

  const locs = await locRes.json() as any[]
  if (!locs.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verificar que la locación pertenece al tenant del usuario autenticado
  const location = locs[0]
  if (location.tenant_id !== session.user.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const audits   = await auditsRes.json()   as any[]
  const findings = await findingsRes.json() as any[]
  const history  = await historyRes.json()  as any[]

  return NextResponse.json({
    ...location,
    score:        location.current_score ?? audits[0]?.score ?? 0,
    audits,
    findings,
    scoreHistory: history,
  })
}