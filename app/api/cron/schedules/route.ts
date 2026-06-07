/* eslint-disable @typescript-eslint/no-explicit-any */
/**/
import { NextResponse } from 'next/server'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const res  = await sbFetch(
    `/audit_schedules?active=eq.true&next_run_at=lte.${now}&select=*,locations(tenant_id,name),users!audit_schedules_auditor_id_fkey(email,name)`
  )
  const schedules = await res.json() as any[]
  const results   = { created: 0, errors: 0, skipped: 0 }

  for (const schedule of schedules) {
    try {
      const existsRes = await sbFetch(
        `/audits?tenant_id=eq.${schedule.tenant_id}&location_id=eq.${schedule.location_id}&type_id=eq.${schedule.audit_type_id}&scheduled_at=gte.${schedule.next_run_at}&status=in.(scheduled,in_progress)&select=id&limit=1`
      )
      const existing = await existsRes.json() as any[]
      if (existing.length > 0) { results.skipped++; continue }

      const auditRes = await sbFetch('/audits', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id:    schedule.tenant_id,
          location_id:  schedule.location_id,
          type_id:      schedule.audit_type_id,
          auditor_id:   schedule.auditor_id,
          status:       'scheduled',
          scheduled_at: schedule.next_run_at,
          source:       'scheduled',
          created_by:   schedule.auditor_id,
        }),
      })

      if (!auditRes.ok) { results.errors++; continue }
      const audits  = await auditRes.json() as any[]
      const auditId = audits[0]?.id
      results.created++

      const nextRes = await sbFetch('/rpc/calculate_next_run', {
        method: 'POST',
        body: JSON.stringify({
          p_frequency:      schedule.frequency,
          p_week_days:      schedule.week_days,
          p_month_day:      schedule.month_day,
          p_scheduled_time: schedule.scheduled_time,
          p_timezone:       schedule.timezone,
        }),
      })

      const next_run_at = nextRes.ok ? await nextRes.json() : null
      const isOnce  = schedule.frequency === 'once'
      const endsAt  = schedule.ends_at ? new Date(schedule.ends_at) : null
      const nextDate = next_run_at ? new Date(next_run_at) : null
      const expired = endsAt && nextDate && nextDate > endsAt

      await sbFetch(`/audit_schedules?id=eq.${schedule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          last_run_at: now,
          next_run_at: isOnce || expired ? null : next_run_at,
          active:      isOnce || expired ? false : true,
          updated_at:  now,
        }),
      })

      if (schedule.users?.email && auditId) {
        await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'audit_scheduled',
            data: {
              auditorName:  schedule.users.name,
              auditorEmail: schedule.users.email,
              auditId,
              locationName: schedule.locations?.name ?? '—',
              scheduledAt:  schedule.next_run_at,
              appUrl:       process.env.NEXTAUTH_URL,
            },
          }),
        }).catch(() => {})
      }
    } catch (e) {
      console.error('[cron/schedules]', e)
      results.errors++
    }
  }

  return NextResponse.json({ ok: true, processed: schedules.length, ...results })
}