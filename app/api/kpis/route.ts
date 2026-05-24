/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key     = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const tenant  = session.user.companyId
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  const [locsRes, auditsRes, findingsRes] = await Promise.all([
    fetch(`${url}/rest/v1/locations?tenant_id=eq.${tenant}&select=id,status,current_score`, { headers }),
    fetch(`${url}/rest/v1/audits?tenant_id=eq.${tenant}&status=eq.completed&select=id,score,location_id,completed_at&order=completed_at.desc`, { headers }),
    fetch(`${url}/rest/v1/audit_findings?select=id,count&audit_id=in.(select id from audits where tenant_id=eq.${tenant})`, { headers }),
  ])

  if (!locsRes.ok || !auditsRes.ok) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const locs    = await locsRes.json()   as any[]
  const audits  = await auditsRes.json() as any[]
  const findings = findingsRes.ok ? await findingsRes.json() as any[] : []

  const scores     = audits.map((a: any) => a.score as number).filter(Boolean)
  const avgScore   = scores.length
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0
  const critical   = locs.filter((l: any) => l.status === 'critical').length
  const auditedIds = [...new Set(audits.map((a: any) => a.location_id as string))]
  const totalFindings = findings.reduce((acc: number, f: any) => acc + (f.count ?? 1), 0)

  // Auditorías completadas por día de la semana (últimas 4 semanas)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
  const recentAudits = audits.filter((a: any) => new Date(a.completed_at) >= fourWeeksAgo)
  const weeklyChart = days.map((label, i) => ({
    label,
    value: recentAudits.filter((a: any) => new Date(a.completed_at).getDay() === i).length,
  }))

  const coverage = Math.round(auditedIds.length / (locs.length || 1) * 100)

  return NextResponse.json({
    totalStores:   locs.length,
    audited:       auditedIds.length,
    avgScore,
    criticalCount: critical,
    totalFindings,
    weeklyChart,
    cards: [
      { id: 'stores',   label: 'Total Locaciones',  value: locs.length,       delta: '',                       deltaType: 'up',   icon: '🏪', color: '#111' },
      { id: 'audited',  label: 'Auditadas',          value: auditedIds.length, delta: `${coverage}% cobertura`, deltaType: 'up',   icon: '✅', color: '#1a6b3a' },
      { id: 'score',    label: 'Score Promedio',     value: avgScore,          delta: '',                       deltaType: 'up',   icon: '📊', color: '#111' },
      { id: 'critical', label: 'Críticas',           value: critical,          delta: 'Requieren acción',       deltaType: 'warn', icon: '⚠️', color: '#7a5200' },
      { id: 'findings', label: 'Hallazgos abiertos', value: totalFindings,     delta: '',                       deltaType: 'up',   icon: '🔍', color: '#8b1a1a' },
    ],
    gauges: [
      { label: 'Cumplimiento', value: avgScore,   max: 100, color: '#1a6b3a' },
      { label: 'Cobertura',    value: coverage,   max: 100, color: '#111'    },
    ],
  })
}
