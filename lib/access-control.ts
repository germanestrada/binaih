/* eslint-disable @typescript-eslint/no-explicit-any */
import { sbFetch } from '@/lib/admin-fetch'

interface Restriction {
  ip_enabled:       boolean
  ip_whitelist:     string[] | null
  schedule_enabled: boolean
  timezone:         string
  schedule:         Array<{ enabled: boolean; start: string; end: string }> | null
}

interface AccessResult {
  allowed:  boolean
  reason?:  string
}

// Verificar si una IP está en la lista blanca (soporta CIDR básico)
function isIpAllowed(ip: string, whitelist: string[]): boolean {
  if (!whitelist.length) return true
  return whitelist.some(entry => {
    if (entry.includes('/')) {
      // CIDR simplificado — comparar prefijo
      const [network, bits] = entry.split('/')
      const maskBits = parseInt(bits)
      const ipParts   = ip.split('.').map(Number)
      const netParts  = network.split('.').map(Number)
      // Convertir a número de 32 bits
      const ipNum  = ipParts.reduce((acc, oct) => (acc << 8) + oct, 0)
      const netNum = netParts.reduce((acc, oct) => (acc << 8) + oct, 0)
      const mask   = (0xFFFFFFFF << (32 - maskBits)) >>> 0
      return (ipNum & mask) === (netNum & mask)
    }
    return ip === entry
  })
}

// Verificar si la hora actual está dentro del horario permitido
function isScheduleAllowed(schedule: Array<{ enabled: boolean; start: string; end: string }>, timezone: string): boolean {
  const now      = new Date()
  // Obtener hora en la zona horaria del tenant
  const tzDate   = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const dayOfWeek = tzDate.getDay() // 0=Dom, 1=Lun, ...6=Sáb
  const hours    = tzDate.getHours()
  const minutes  = tzDate.getMinutes()
  const current  = hours * 60 + minutes

  const daySchedule = schedule[dayOfWeek]
  if (!daySchedule?.enabled) return false

  const [startH, startM] = daySchedule.start.split(':').map(Number)
  const [endH,   endM]   = daySchedule.end.split(':').map(Number)
  const start = startH * 60 + startM
  const end   = endH   * 60 + endM

  return current >= start && current <= end
}

// Función principal: verificar si un usuario puede acceder
export async function checkAccessRestrictions(params: {
  userId:   string
  tenantId: string
  roleName: string
  ip?:      string
}): Promise<AccessResult> {
  const { userId, tenantId, roleName, ip } = params

  try {
    // Buscar restricciones: primero por usuario específico (override), luego por rol
    const res  = await sbFetch(
      `/access_restrictions?tenant_id=eq.${tenantId}&active=eq.true&or=(user_id.eq.${userId},and(role_name.eq.${roleName},user_id.is.null),and(role_name.is.null,user_id.is.null))&order=user_id.desc.nullslast&limit=5`
    )
    const restrictions = await res.json() as any[]
    if (!restrictions.length) return { allowed: true }

    // Aplicar restricciones en orden (user override primero)
    for (const r of restrictions) {
      // Restricción de IP
      if (r.ip_enabled && r.ip_whitelist?.length > 0) {
        const clientIp = ip ?? '0.0.0.0'
        if (!isIpAllowed(clientIp, r.ip_whitelist)) {
          return { allowed: false, reason: `Acceso denegado: IP ${clientIp} no está en la lista permitida` }
        }
      }

      // Restricción de horario
      if (r.schedule_enabled && r.schedule) {
        if (!isScheduleAllowed(r.schedule, r.timezone ?? 'America/Bogota')) {
          return { allowed: false, reason: `Acceso denegado: fuera del horario permitido (${r.timezone})` }
        }
      }
    }

    return { allowed: true }
  } catch (e) {
    console.error('[checkAccessRestrictions] error:', e)
    return { allowed: true } // fail open — no bloquear si hay error
  }
}
