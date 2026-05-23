import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { MOCK_STORES } from '@/lib/mock-data'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zone   = searchParams.get('zone')   ?? ''
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('q')      ?? ''

  const data = MOCK_STORES.filter(s => {
    if (zone   && s.zone   !== zone)   return false
    if (status && s.status !== status) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q)) return false
    }
    return true
  })

  // TODO: reemplazar con prisma.store.findMany() una vez conectada la BD
  return NextResponse.json({ data, total: data.length })
}
