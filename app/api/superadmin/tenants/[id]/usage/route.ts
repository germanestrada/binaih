/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { guardSuperAdmin } from '@/lib/superadmin-guard'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guardSuperAdmin()
  if (error) return error
  const { id } = await params
  const [usersRes, locsRes, auditsRes, aiRes] = await Promise.all([
    sbFetch(`/users?tenant_id=eq.${id}&select=id`),
    sbFetch(`/locations?tenant_id=eq.${id}&select=id`),
    sbFetch(`/audits?tenant_id=eq.${id}&select=id`),
    sbFetch(`/ai_analysis_logs?tenant_id=eq.${id}&select=id`),
  ])
  const [users, locs, audits, ai] = await Promise.all([usersRes, locsRes, auditsRes, aiRes].map(r => r.json())) as any[][]
  return NextResponse.json({ users: users.length, locations: locs.length, audits: audits.length, aiLogs: ai.length })
}
