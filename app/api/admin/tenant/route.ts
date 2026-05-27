/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sbFetch } from '@/lib/admin-fetch'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const allowed = ['name','contact_name','contact_email','contact_phone','billing_address','billing_city','billing_state','billing_country','billing_zip','tax_id']

  const updates: any = { updated_at: new Date().toISOString() }

  // Mapear camelCase a snake_case
  const map: Record<string,string> = {
    contactName:    'contact_name',
    contactEmail:   'contact_email',
    contactPhone:   'contact_phone',
    billingAddress: 'billing_address',
    billingCity:    'billing_city',
    billingState:   'billing_state',
    billingCountry: 'billing_country',
    billingZip:     'billing_zip',
    nit:            'tax_id',
  }

  Object.entries(body).forEach(([k, v]) => {
    const dbKey = map[k] ?? k
    if (allowed.includes(dbKey)) updates[dbKey] = v || null
  })

  const res = await sbFetch(`/tenants?id=eq.${session.user.companyId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

  if (!res.ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
