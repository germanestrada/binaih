import { NextResponse } from 'next/server'
import { signIn } from '@/auth'

// Solo permitir en entornos con demo habilitado
const DEMO_ENABLED = process.env.DEMO_ENABLED === 'true'
const DEMO_EMAIL   = 'demo@tveo.co'
const DEMO_PASS    = 'demo123'

export async function POST() {
  if (!DEMO_ENABLED) {
    return NextResponse.json({ error: 'Demo no disponible' }, { status: 403 })
  }

  try {
    await signIn('credentials', {
      email:    DEMO_EMAIL,
      password: DEMO_PASS,
      redirect: false,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al iniciar demo' }, { status: 500 })
  }
}
