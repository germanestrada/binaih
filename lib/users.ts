import bcrypt from 'bcryptjs'

export interface DBUser {
  id:          string
  name:        string
  email:       string
  passwordHash:string
  roleName:    string
  zone?:       string
  tenantId:    string
  tenantName:  string
  status:      string
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase env missing')

    const res = await fetch(
      `${url}/rest/v1/users?email=eq.${encodeURIComponent(email)}&status=eq.active&select=id,name,email,password,role_name,zone,tenant_id,tenants(id,name)&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`)

    const rows = await res.json()
    if (!rows.length) return null

    const u = rows[0]
    return {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      passwordHash:u.password,
      roleName:    u.role_name,
      zone:        u.zone,
      tenantId:    u.tenant_id,       // usa el tenant_id real de la BD
      tenantName:  u.tenants?.name ?? '',
      status:      'active',
    }
  } catch (e) {
    console.error('[getUserByEmail] fallback a mock:', e)
    // Fallback mock — usa tenant-demo para coincidir con los datos en Supabase
    const MOCK: DBUser[] = [
      { id:'u001', name:'Germán López',    email:'admin@binaih.co',   passwordHash: bcrypt.hashSync('admin123',10),   roleName:'admin',   tenantId:'tenant-demo', tenantName:'Retail Corp S.A.', status:'active' },
      { id:'u002', name:'María Rodríguez', email:'auditor@binaih.co', passwordHash: bcrypt.hashSync('auditor123',10), roleName:'auditor', tenantId:'tenant-demo', tenantName:'Retail Corp S.A.', status:'active', zone:'Norte' },
      { id:'u003', name:'Carlos Méndez',   email:'viewer@binaih.co',  passwordHash: bcrypt.hashSync('viewer123',10),  roleName:'viewer',  tenantId:'tenant-demo', tenantName:'Retail Corp S.A.', status:'active' },
    ]
    return MOCK.find(u => u.email === email) ?? null
  }
}

export async function validatePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
