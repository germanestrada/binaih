import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import TopBar from '@/components/layout/TopBar'
import UserStrip from '@/components/layout/UserStrip'
import SessionGuard from '@/components/providers/SessionGuard'
import DemoBanner from '@/components/ui/DemoBanner'
import OnboardingWrapper from '@/components/ui/OnboardingWrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <>
    <SessionGuard/>
    <DemoBanner/>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <UserStrip />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <OnboardingWrapper/>
        {children}
      </main>
    </div>
  </>
  )
}