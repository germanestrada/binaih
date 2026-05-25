import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET() {
  const session = await auth()
  if (!session || !['admin','auditor'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res  = await sbFetch('/master_items?active=eq.true&select=id,code,title,description,icon,category,response_type,weight_default,max_score_default,required_default,scale_min_label,scale_max_label,ai_enabled,ai_visual_category,ai_confidence_threshold,plan_tier_required&order=category.asc,code.asc')
  const data = await res.json()
  return NextResponse.json({ data })
}
