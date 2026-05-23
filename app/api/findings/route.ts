import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { MOCK_FINDINGS } from '@/lib/mock-data'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: reemplazar con queries Prisma una vez conectada la BD
  return NextResponse.json({ data: MOCK_FINDINGS, total: MOCK_FINDINGS.length })
}
