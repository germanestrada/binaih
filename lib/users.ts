import bcrypt from 'bcryptjs'

export async function getUserByEmail(email: string) {
  // En desarrollo sin BD: fallback a usuarios mock
  // En producción: reemplazar con prisma.user.findUnique(...)
  const MOCK_USERS = [
    { id: 'u001', name: 'Germán López',    email: 'admin@binaih.co',   passwordHash: bcrypt.hashSync('admin123',   10), role: 'admin'   as const, companyId: 'c001', companyName: 'Retail Corp S.A.', active: true },
    { id: 'u002', name: 'María Rodríguez', email: 'auditor@binaih.co', passwordHash: bcrypt.hashSync('auditor123', 10), role: 'auditor' as const, zone: 'Norte', companyId: 'c001', companyName: 'Retail Corp S.A.', active: true },
    { id: 'u003', name: 'Carlos Méndez',   email: 'viewer@binaih.co',  passwordHash: bcrypt.hashSync('viewer123',  10), role: 'viewer'  as const, companyId: 'c001', companyName: 'Retail Corp S.A.', active: true },
  ]

  // TODO: cuando DATABASE_URL esté configurada, usar:
  // const { prisma } = await import('@/lib/prisma')
  // return prisma.user.findUnique({ where: { email, active: true } })

  return MOCK_USERS.find(u => u.email === email && u.active) ?? null
}

export async function validatePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
