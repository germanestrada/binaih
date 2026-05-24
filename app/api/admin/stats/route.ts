/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tenant = session.user.companyId

  const [locsRes, usersRes, auditsRes, findingsRes, planRes] = await Promise.all([
    sbFetch(`/locations?tenant_id=eq.${tenant}&select=id,status`),
    sbFetch(`/users?tenant_id=eq.${tenant}&select=id,status,last_login`),
    sbFetch(`/audits?tenant_id=eq.${tenant}&select=id,status,completed_at&order=completed_at.desc&limit=100`),
    sbFetch(`/audit_findings?select=id,status&audit_id=in.(select id from audits where tenant_id=eq.${tenant})`),
    sbFetch(`/tenants?id=eq.${tenant}&select=*,plans(*)&limit=1`),
  ])

  const locs     = await locsRes.json()     as any[]
  const users    = await usersRes.json()    as any[]
  const audits   = await auditsRes.json()   as any[]
  const findings = await findingsRes.json() as any[]
  const tenants  = await planRes.json()     as any[]
  const tenant_  = tenants[0] ?? {}
  const plan     = tenant_.plans ?? {}

  // Auditorías este mes
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const auditsThisMonth = audits.filter((a: any) => a.completed_at && new Date(a.completed_at) >= thisMonth).length

  return NextResponse.json({
    plan: {
      name:          plan.name ?? '—',
      tier:          plan.tier ?? '—',
      maxLocations:  plan.max_locations ?? 0,
      maxUsers:      plan.max_users ?? 0,
      maxAuditsMonth:plan.max_audits_month ?? 0,
      mapEnabled:    plan.map_enabled ?? false,
      apiEnabled:    plan.api_enabled ?? false,
      aiEnabled:     plan.ai_enabled ?? false,
      trialEndsAt:   tenant_.trial_ends_at ?? null,
      status:        tenant_.status ?? '—',
    },
    usage: {
      locations:      locs.length,
      activeLocations:locs.filter((l: any) => l.status === 'active').length,
      criticalLocations: locs.filter((l: any) => l.status === 'critical').length,
      users:          users.length,
      activeUsers:    users.filter((u: any) => u.status === 'active').length,
      auditsThisMonth,
      openFindings:   findings.filter((f: any) => f.status === 'open').length,
      inProgressFindings: findings.filter((f: any) => f.status === 'in_progress').length,
    },
    recentActivity: audits.slice(0, 10).map((a: any) => ({
      id: a.id, status: a.status, completedAt: a.completed_at,
    })),
  })
}
