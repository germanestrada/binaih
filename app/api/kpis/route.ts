import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { MOCK_KPI_DATA } from '@/lib/mock-data'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: reemplazar con queries Prisma una vez conectada la BD
  return NextResponse.json(MOCK_KPI_DATA)
}
