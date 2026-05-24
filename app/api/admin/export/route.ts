/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type') ?? 'locations'
  const tenant = session.user.companyId

  let rows: any[] = []
  let headers:  string[] = []

  if (type === 'locations') {
    const res = await sbFetch(`/locations?tenant_id=eq.${tenant}&select=id,name,city,zone,status,current_score,last_audit_at,manager_name,manager_phone,area_sqm,address&order=name.asc`)
    rows    = await res.json()
    headers = ['ID','Nombre','Ciudad','Zona','Estado','Score','Última auditoría','Gerente','Teléfono','Área m²','Dirección']
    rows    = rows.map((r: any) => [r.id,r.name,r.city,r.zone,r.status,r.current_score,r.last_audit_at,r.manager_name,r.manager_phone,r.area_sqm,r.address])
  } else if (type === 'audits') {
    const res = await sbFetch(`/audits?tenant_id=eq.${tenant}&select=id,location_id,score,status,completed_at,scheduled_at,duration_min,notes&order=completed_at.desc`)
    rows    = await res.json()
    headers = ['ID','Locación','Score','Estado','Completada','Programada','Duración min','Notas']
    rows    = rows.map((r: any) => [r.id,r.location_id,r.score,r.status,r.completed_at,r.scheduled_at,r.duration_min,r.notes])
  } else if (type === 'findings') {
    const res = await sbFetch(`/audit_findings?select=id,location_id,category_id,count,severity,status,due_date,resolved_at&order=created_at.desc`)
    rows    = await res.json()
    headers = ['ID','Locación','Categoría','Cantidad','Severidad','Estado','Fecha límite','Resuelto']
    rows    = rows.map((r: any) => [r.id,r.location_id,r.category_id,r.count,r.severity,r.status,r.due_date,r.resolved_at])
  } else if (type === 'users') {
    const res = await sbFetch(`/users?tenant_id=eq.${tenant}&select=id,name,email,role_name,zone,status,last_login,created_at&order=name.asc`)
    rows    = await res.json()
    headers = ['ID','Nombre','Email','Rol','Zona','Estado','Último acceso','Creado']
    rows    = rows.map((r: any) => [r.id,r.name,r.email,r.role_name,r.zone,r.status,r.last_login,r.created_at])
  }

  const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ''}"`).join(',')).join('\n')
  const filename = `binaih-${type}-${new Date().toISOString().slice(0,10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
