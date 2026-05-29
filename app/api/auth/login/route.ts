import { NextResponse } from 'next/server'
import { signIn } from '@/auth'

// Este endpoint extrae la IP real del request y la pasa al authorize callback
// Workaround para NextAuth v5 que no expone el request en authorize
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    // La IP real — Vercel la pone en x-vercel-forwarded-for, otros en x-forwarded-for
    const ip =
      req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    // Pasar IP como campo adicional en credentials
    const result = await signIn('credentials', {
      email,
      password,
      __ip: ip,
      redirect: false,
    })
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error' }, { status: 401 })
  }
}
