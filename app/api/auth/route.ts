import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Mock auth — cualquier email/contraseña válidos funcionan
  if (!email || !password) {
    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set('binaih_session', 'mock-session-token', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8, // 8 horas
    sameSite: 'lax',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('binaih_session')
  return response
}
