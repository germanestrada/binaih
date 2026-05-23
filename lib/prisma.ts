// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any }

async function createPrismaClient() {
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const url = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { createPrismaClient }
export default prisma
