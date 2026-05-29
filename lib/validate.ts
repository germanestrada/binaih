// Validadores de entrada para prevenir query injection en Supabase

const UUID_REGEX   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG_REGEX   = /^[a-zA-Z0-9_-]{1,64}$/
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isUUID(val: string): boolean {
  return UUID_REGEX.test(val)
}

export function isSlug(val: string): boolean {
  return SLUG_REGEX.test(val)
}

export function isEmail(val: string): boolean {
  return EMAIL_REGEX.test(val)
}

// Validar y sanitizar ID de ruta — devuelve el ID si es válido, null si no
export function validateRouteId(id: string | undefined | null): string | null {
  if (!id) return null
  // Aceptar UUIDs o IDs cortos tipo "T001", "AUD031"
  if (UUID_REGEX.test(id) || SLUG_REGEX.test(id)) return id
  return null
}

// Sanitizar texto libre para evitar caracteres peligrosos en queries
export function sanitizeText(val: string, maxLen = 255): string {
  return val.replace(/['"\\;]/g, '').slice(0, maxLen).trim()
}

// CSV formula injection prevention
export function sanitizeCsvCell(val: unknown): string {
  const str = String(val ?? '')
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}` // prefijo comilla simple
  return str
}
