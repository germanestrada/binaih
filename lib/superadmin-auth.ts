import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { sbFetch } from '@/lib/admin-fetch'
import bcrypt from 'bcryptjs'

function getSecret(): Uint8Array {
  if (!process.env.SUPERADMIN_SECRET) {
    throw new Error('[TVEO] SUPERADMIN_SECRET env var is required but not set.')
  }
  return new TextEncoder().encode(process.env.SUPERADMIN_SECRET)
}
const COOKIE_NAME = 'tveo-sa-token'
const MAX_AGE    = 60 * 60 * 4 // 4 horas

export interface SuperAdminSession {
  id:    string
  name:  string
  email: string
  totpEnabled: boolean
  totpVerified: boolean
}

// Generar JWT
export async function signSuperAdminToken(payload: SuperAdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${MAX_AGE}s`)
    .setIssuedAt()
    .sign(getSecret())
}

// Verificar JWT
export async function verifySuperAdminToken(token: string): Promise<SuperAdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SuperAdminSession
  } catch {
    return null
  }
}

// Obtener sesión desde cookie
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySuperAdminToken(token)
}

// Verificar credenciales
export async function verifySuperAdminCredentials(email: string, password: string) {
  const res  = await sbFetch(`/tveo_admins?email=eq.${encodeURIComponent(email)}&status=eq.active&select=id,name,email,password,totp_secret,totp_enabled&limit=1`)
  const rows = await res.json() as any[]
  if (!rows.length) return null

  const admin = rows[0]
  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) return null

  return admin
}

export { COOKIE_NAME, MAX_AGE }
