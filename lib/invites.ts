// lib/invites.ts
// Helpers para el flujo de "definir tu contraseña" — usado cuando
// se crea un usuario (ej: admin de un tenant nuevo) sin que nadie
// tenga que asignarle una contraseña a mano.
import crypto from 'crypto'
import { sbFetch } from '@/lib/admin-fetch'

export const INVITE_EXPIRY_DAYS = 7

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Genera un token de invitación, guarda su hash en `user_invites`
 * y devuelve el token en claro (solo existe en memoria — nunca se
 * persiste) para incluirlo en el link del correo.
 */
export async function createInvite(userId: string, createdBy?: string): Promise<string> {
  const token     = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 86400000).toISOString()

  await sbFetch('/user_invites', {
    method: 'POST',
    body: JSON.stringify({
      user_id:    userId,
      token_hash: hashToken(token),
      expires_at: expiresAt,
      created_by: createdBy ?? null,
    }),
  })

  return token
}

/**
 * Genera una contraseña aleatoria criptográficamente segura que
 * nadie llega a conocer — se usa como placeholder en `users.password`
 * (que es NOT NULL) hasta que el usuario define la suya vía invitación.
 */
export function randomUnusablePassword(): string {
  return crypto.randomBytes(24).toString('base64')
}
