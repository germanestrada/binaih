import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No session' })
  return NextResponse.json({
    userId:      session.user.id,
    email:       session.user.email,
    role:        session.user.role,
    companyId:   session.user.companyId,
    companyName: session.user.companyName,
  })
}
