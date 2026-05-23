export type Role = 'admin' | 'auditor' | 'viewer'

export interface AppUser {
  id:          string
  name:        string
  email:       string
  role:        Role
  zone?:       string
  companyId:   string
  companyName: string
}

// NextAuth type augmentation
declare module 'next-auth' {
  interface User {
    role:        Role
    zone?:       string
    companyId:   string
    companyName: string
  }
  interface Session {
    user: {
      id:          string
      name:        string
      email:       string
      role:        Role
      zone?:       string
      companyId:   string
      companyName: string
    }
  }
}
