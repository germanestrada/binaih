// Rate limiter simple en memoria (edge-compatible)
// Para producción a escala usar Upstash Redis

const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS  = 5
const WINDOW_MS     = 15 * 60 * 1000 // 15 minutos
const LOCKOUT_MS    = 15 * 60 * 1000 // 15 minutos de bloqueo

export interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt?:   number
  retryAfter?: number // segundos hasta desbloqueo
}

export function checkRateLimit(key: string): RateLimitResult {
  const now    = Date.now()
  const entry  = attempts.get(key)

  if (entry) {
    // Limpiar si venció la ventana
    if (now > entry.resetAt) {
      attempts.delete(key)
    } else if (entry.count >= MAX_ATTEMPTS) {
      // Bloqueado
      return {
        allowed:    false,
        remaining:  0,
        resetAt:    entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }
    }
  }

  const current = attempts.get(key)
  const newCount = (current?.count ?? 0) + 1
  attempts.set(key, {
    count:   newCount,
    resetAt: current?.resetAt ?? now + WINDOW_MS,
  })

  return {
    allowed:   newCount <= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - newCount),
  }
}

export function resetRateLimit(key: string): void {
  attempts.delete(key)
}

// Limpiar entradas expiradas periódicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts.entries()) {
    if (now > entry.resetAt + LOCKOUT_MS) {
      attempts.delete(key)
    }
  }
}, 5 * 60 * 1000)
