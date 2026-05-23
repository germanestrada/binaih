import { PrismaClient, Zone, StoreStatus, AuditStatus, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const POOLER_URL = 'postgresql://postgres.njendauzjikgbguowaah:G2rm1n7.777@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
const adapter = new PrismaPg({
  connectionString: POOLER_URL,
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding BINAIH database...\n')

  // Empresa
  const company = await prisma.company.upsert({
    where:  { id: 'c001' },
    update: {},
    create: { id: 'c001', name: 'Retail Corp S.A.' },
  })
  console.log('✅ Company:', company.name)

  // Usuarios
  await Promise.all([
    prisma.user.upsert({
      where:  { email: 'admin@binaih.co' },
      update: {},
      create: { id: 'u001', name: 'Germán López',    email: 'admin@binaih.co',   password: bcrypt.hashSync('admin123',   10), role: Role.admin,   companyId: 'c001' },
    }),
    prisma.user.upsert({
      where:  { email: 'auditor@binaih.co' },
      update: {},
      create: { id: 'u002', name: 'María Rodríguez', email: 'auditor@binaih.co', password: bcrypt.hashSync('auditor123', 10), role: Role.auditor, zone: 'Norte', companyId: 'c001' },
    }),
    prisma.user.upsert({
      where:  { email: 'viewer@binaih.co' },
      update: {},
      create: { id: 'u003', name: 'Carlos Méndez',   email: 'viewer@binaih.co',  password: bcrypt.hashSync('viewer123',  10), role: Role.viewer,  companyId: 'c001' },
    }),
  ])
  console.log('✅ Users: 3')

  // Tiendas
  const storeData: Array<{
    id: string; name: string; city: string
    zone: Zone; status: StoreStatus; lat: number; lng: number
  }> = [
    { id: 'T001', name: 'Chapinero Centro',    city: 'Bogotá',      zone: Zone.Norte,     status: StoreStatus.active,   lat:  4.6473, lng: -74.0662 },
    { id: 'T002', name: 'Unicentro',            city: 'Bogotá',      zone: Zone.Norte,     status: StoreStatus.active,   lat:  4.7110, lng: -74.0464 },
    { id: 'T003', name: 'Centro Comercial Sur', city: 'Bogotá',      zone: Zone.Sur,       status: StoreStatus.critical, lat:  4.5759, lng: -74.1241 },
    { id: 'T004', name: 'Mayorca',              city: 'Medellín',    zone: Zone.Occidente, status: StoreStatus.active,   lat:  6.2442, lng: -75.5812 },
    { id: 'T005', name: 'El Tesoro',            city: 'Medellín',    zone: Zone.Oriente,   status: StoreStatus.active,   lat:  6.2106, lng: -75.5591 },
    { id: 'T006', name: 'Buenaventura Plaza',   city: 'Cali',        zone: Zone.Centro,    status: StoreStatus.critical, lat:  3.4516, lng: -76.5320 },
    { id: 'T007', name: 'Jardín Plaza',         city: 'Cali',        zone: Zone.Centro,    status: StoreStatus.active,   lat:  3.4185, lng: -76.5220 },
    { id: 'T008', name: 'Canaveral',            city: 'Bucaramanga', zone: Zone.Norte,     status: StoreStatus.active,   lat:  7.1193, lng: -73.1227 },
  ]
  for (const s of storeData) {
    await prisma.store.upsert({
      where:  { id: s.id },
      update: {},
      create: { ...s, companyId: 'c001' },
    })
  }
  console.log('✅ Stores: 8')

  // Categorías de hallazgos
  const categories = [
    { id: 'FC01', title: 'Exhibición deficiente',         description: 'Productos mal ubicados o sin precio visible en góndola.', icon: '🏷️', color: '#fdecea', category: 'exhibicion' },
    { id: 'FC02', title: 'Inventario desactualizado',     description: 'Diferencias entre sistema y físico mayores al 5%.',        icon: '📦', color: '#fff8e1', category: 'inventario' },
    { id: 'FC03', title: 'Incumplimiento de protocolos',  description: 'Personal sin EPP o sin seguir procedimientos.',            icon: '⚠️', color: '#ede9fe', category: 'seguridad'  },
    { id: 'FC04', title: 'Atención al cliente',           description: 'Tiempos de espera superiores a 5 minutos.',                icon: '👥', color: '#e6f4ed', category: 'atencion'   },
    { id: 'FC05', title: 'Higiene y limpieza',            description: 'Áreas comunes o almacén con suciedad visible.',            icon: '🧹', color: '#e8f1fd', category: 'higiene'    },
  ]
  for (const c of categories) {
    await prisma.findingCategory.upsert({ where: { id: c.id }, update: {}, create: c })
  }
  console.log('✅ Finding categories: 5')

  // Auditorías
  const auditData: Array<{
    id: string; storeId: string; auditorId: string
    score: number; status: AuditStatus; date: Date
  }> = [
    { id: 'A001', storeId: 'T001', auditorId: 'u002', score: 94, status: AuditStatus.completed, date: new Date('2025-05-10') },
    { id: 'A002', storeId: 'T002', auditorId: 'u002', score: 88, status: AuditStatus.completed, date: new Date('2025-05-12') },
    { id: 'A003', storeId: 'T003', auditorId: 'u002', score: 62, status: AuditStatus.completed, date: new Date('2025-05-14') },
    { id: 'A004', storeId: 'T004', auditorId: 'u002', score: 76, status: AuditStatus.completed, date: new Date('2025-05-15') },
    { id: 'A005', storeId: 'T005', auditorId: 'u002', score: 91, status: AuditStatus.completed, date: new Date('2025-05-16') },
    { id: 'A006', storeId: 'T006', auditorId: 'u002', score: 55, status: AuditStatus.completed, date: new Date('2025-05-17') },
    { id: 'A007', storeId: 'T007', auditorId: 'u002', score: 83, status: AuditStatus.completed, date: new Date('2025-05-18') },
  ]
  for (const a of auditData) {
    await prisma.audit.upsert({ where: { id: a.id }, update: {}, create: a })
  }
  console.log('✅ Audits: 7')

  // Hallazgos
  const findingData = [
    { id: 'AF01', auditId: 'A003', storeId: 'T003', categoryId: 'FC01', count: 7 },
    { id: 'AF02', auditId: 'A006', storeId: 'T006', categoryId: 'FC01', count: 9 },
    { id: 'AF03', auditId: 'A003', storeId: 'T003', categoryId: 'FC02', count: 4 },
    { id: 'AF04', auditId: 'A006', storeId: 'T006', categoryId: 'FC03', count: 6 },
    { id: 'AF05', auditId: 'A004', storeId: 'T004', categoryId: 'FC03', count: 3 },
    { id: 'AF06', auditId: 'A006', storeId: 'T006', categoryId: 'FC05', count: 5 },
  ]
  for (const f of findingData) {
    await prisma.auditFinding.upsert({ where: { id: f.id }, update: {}, create: f })
  }
  console.log('✅ Findings: 6')

  console.log('\n🎉 Seed completado exitosamente.')
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
