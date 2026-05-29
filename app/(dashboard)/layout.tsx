import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import TopBar from '@/components/layout/TopBar'
import UserStrip from '@/components/layout/UserStrip'
import SessionGuard from '@/components/providers/SessionGuard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <>
    <SessionGuard/>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <UserStrip />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  </>
  )
}
