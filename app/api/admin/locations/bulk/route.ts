/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantId = session.user.companyId
  const { rows } = await req.json() as { rows: Record<string,string>[] }
  if (!rows?.length) return NextResponse.json({ error: 'Sin filas' }, { status: 400 })

  // Límite de filas por request
  const MAX_ROWS = 500
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Máximo ${MAX_ROWS} filas por cargue. El archivo tiene ${rows.length}.` }, { status: 400 })
  }

  // Verificar límite del plan
  const planRes   = await sbFetch(`/tenants?id=eq.${tenantId}&select=plans(max_locations)&limit=1`)
  const planData  = await planRes.json() as any[]
  const maxLocs   = planData[0]?.plans?.max_locations ?? 999
  const countRes  = await sbFetch(`/locations?tenant_id=eq.${tenantId}&select=id`)
  const existing  = (await countRes.json() as any[]).length
  if (existing + rows.length > maxLocs) {
    return NextResponse.json({
      error: `El plan permite máximo ${maxLocs} locaciones. Tienes ${existing} y estás intentando agregar ${rows.length}.`
    }, { status: 400 })
  }


  // Obtener tipos de locación del tenant para mapear por nombre
  const typesRes = await sbFetch(`/location_types?tenant_id=eq.${tenantId}&select=id,name`)
  const types    = await typesRes.json() as any[]
  const typeMap  = Object.fromEntries(types.map((t: any) => [t.name.toLowerCase(), t.id]))

  const results: { ok: number; errors: { row: number; error: string }[] } = { ok: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const name = row['nombre']?.trim() || row['name']?.trim()
    const city = row['ciudad']?.trim() || row['city']?.trim()

    if (!name || !city) {
      results.errors.push({ row: i + 2, error: 'Nombre y ciudad son requeridos' })
      continue
    }

    const typeKey = (row['tipo']?.trim() || row['type']?.trim() || '').toLowerCase()
    const typeId  = typeMap[typeKey] ?? null
    const id      = name.toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]/g,'').slice(0,4) + (i + Date.now().toString().slice(-3))

    const res = await sbFetch('/locations', {
      method: 'POST',
      body: JSON.stringify({
        id,
        name,
        city,
        type_id:       typeId,
        zone:          row['zona']?.trim()      || row['zone']?.trim()          || null,
        address:       row['direccion']?.trim() || row['address']?.trim()       || null,
        manager_name:  row['gerente']?.trim()   || row['manager_name']?.trim()  || null,
        manager_phone: row['telefono']?.trim()  || row['manager_phone']?.trim() || null,
        area_sqm:      row['area_m2'] ? parseInt(row['area_m2']) : null,
        lat:           row['latitud'] ? parseFloat(row['latitud']) : null,
        lng:           row['longitud']? parseFloat(row['longitud']): null,
        status:        'active',
        tenant_id:     tenantId,
        created_by:    session.user.id,
      }),
    })

    if (res.ok) {
      results.ok++
    } else {
      const e = await res.json()
      results.errors.push({ row: i + 2, error: e.message ?? 'Error al insertar' })
    }
  }

  return NextResponse.json(results)
}
