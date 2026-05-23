'use client'
import { useSession as useNextAuthSession } from 'next-auth/react'
import type { Role } from '@/types/auth'

export interface AppSession {
  id:          string
  name:        string
  email:       string
  role:        Role
  zone?:       string
  companyId:   string
  companyName: string
}

export function useAppSession() {
  const { data, status } = useNextAuthSession()

  const user = data?.user as (AppSession & { image?: string }) | undefined

  return {
    user,
    role:        user?.role        ?? 'viewer' as Role,
    isAdmin:     user?.role === 'admin',
    isAuditor:   user?.role === 'auditor' || user?.role === 'admin',
    isLoading:   status === 'loading',
    isLoggedIn:  status === 'authenticated',
    companyName: user?.companyName ?? '',
    zone:        user?.zone,
  }
}
