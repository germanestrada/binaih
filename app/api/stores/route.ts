/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zone   = searchParams.get('zone')
  const status = searchParams.get('status')
  const search = searchParams.get('q')

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key    = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const tenant = session.user.companyId
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  // Construir query con filtros
  let query = `${url}/rest/v1/locations?tenant_id=eq.${tenant}`
  query += `&select=id,name,address,city,zone,lat,lng,status,manager_name,current_score,last_audit_at,location_types(name,icon)`
  if (zone)   query += `&zone=eq.${encodeURIComponent(zone)}`
  if (status) query += `&status=eq.${encodeURIComponent(status)}`
  if (search) query += `&or=(name.ilike.*${encodeURIComponent(search)}*,city.ilike.*${encodeURIComponent(search)}*,id.ilike.*${encodeURIComponent(search)}*)`
  query += '&order=name.asc'

  const res  = await fetch(query, { headers })
  if (!res.ok) {
    console.error('[/api/stores] Supabase error:', res.status)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
  const locations: any[] = await res.json()

  // Para cada locación obtener conteo de auditorías y hallazgos abiertos
  const enriched = await Promise.all(
    locations.map(async (loc: any) => {
      const [audRes, findRes] = await Promise.all([
        fetch(
          `${url}/rest/v1/audits?location_id=eq.${loc.id}&status=eq.completed&select=id,score&order=completed_at.desc&limit=1`,
          { headers }
        ),
        fetch(
          `${url}/rest/v1/audit_findings?location_id=eq.${loc.id}&status=neq.resolved&select=id`,
          { headers, ...({ Prefer: 'count=exact' } as any) }
        ),
      ])

      const audits     = await audRes.json() as any[]
      const findCount  = parseInt(findRes.headers.get('content-range')?.split('/')[1] ?? '0')

      return {
        id:          loc.id,
        name:        loc.name,
        address:     loc.address,
        city:        loc.city,
        zone:        loc.zone,
        lat:         loc.lat,
        lng:         loc.lng,
        status:      loc.status,
        managerName: loc.manager_name,
        score:       loc.current_score ?? audits[0]?.score ?? 0,
        audits:      audits.length,
        findings:    findCount,
        locationType: loc.location_types,
        lastAuditAt: loc.last_audit_at,
      }
    })
  )

  return NextResponse.json({ data: enriched, total: enriched.length })
}
