/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const { error } = await guardSuperAdmin()
  if (error) return error

  const [tenantsRes, usersRes, auditsRes, aiLogsRes, locsRes] = await Promise.all([
    sbFetch('/tenants?select=id,name,status,created_at,plan_id'),
    sbFetch('/users?select=id,status,tenant_id'),
    sbFetch('/audits?select=id,status,tenant_id,completed_at&order=completed_at.desc&limit=500'),
    sbFetch('/ai_analysis_logs?select=id,success,tenant_id,created_at&order=created_at.desc&limit=200'),
    sbFetch('/locations?select=id,status,tenant_id'),
  ])

  const tenants  = await tenantsRes.json()  as any[]
  const users    = await usersRes.json()    as any[]
  const audits   = await auditsRes.json()   as any[]
  const aiLogs   = await aiLogsRes.json()   as any[]
  const locs     = await locsRes.json()     as any[]

  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)

  return NextResponse.json({
    totals: {
      tenants:        tenants.length,
      activeTenants:  tenants.filter((t: any) => t.status === 'active').length,
      trialTenants:   tenants.filter((t: any) => t.status === 'trial').length,
      users:          users.length,
      activeUsers:    users.filter((u: any) => u.status === 'active').length,
      locations:      locs.length,
      audits:         audits.length,
      auditsThisMonth:audits.filter((a: any) => a.completed_at && new Date(a.completed_at) >= thisMonth).length,
      aiAnalyses:     aiLogs.length,
      aiSuccessRate:  aiLogs.length ? Math.round(aiLogs.filter((l: any) => l.success).length / aiLogs.length * 100) : 0,
    },
    tenantBreakdown: tenants.map((t: any) => ({
      id:       t.id,
      name:     t.name,
      status:   t.status,
      users:    users.filter((u: any) => u.tenant_id === t.id).length,
      locs:     locs.filter((l: any) => l.tenant_id === t.id).length,
      audits:   audits.filter((a: any) => a.tenant_id === t.id).length,
      aiLogs:   aiLogs.filter((l: any) => l.tenant_id === t.id).length,
    })),
    recentAudits: audits.slice(0, 10),
  })
}
