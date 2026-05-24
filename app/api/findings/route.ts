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

  const [catsRes, findingsRes] = await Promise.all([
    fetch(
      `${url}/rest/v1/finding_categories?tenant_id=eq.${tenant}&active=eq.true&select=*&order=title.asc`,
      { headers }
    ),
    fetch(
      `${url}/rest/v1/audit_findings?select=category_id,location_id,count,severity,status`,
      { headers }
    ),
  ])

  if (!catsRes.ok) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const categories = await catsRes.json() as any[]
  const findings   = findingsRes.ok ? await findingsRes.json() as any[] : []

  const result = categories.map((cat: any) => {
    const catFindings = findings.filter((f: any) => f.category_id === cat.id)
    const total       = catFindings.reduce((acc: number, f: any) => acc + (f.count ?? 1), 0)
    const stores      = [...new Set(catFindings.map((f: any) => f.location_id as string))]
    return {
      id:       cat.id,
      title:    cat.title,
      desc:     cat.description,
      icon:     cat.icon,
      color:    cat.color,
      category: cat.category,
      severity: cat.severity,
      count:    total,
      stores,
    }
  }).sort((a: any, b: any) => b.count - a.count)

  return NextResponse.json({ data: result, total: result.length })
}
