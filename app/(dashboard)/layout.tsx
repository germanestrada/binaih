import TopBar from '@/components/layout/TopBar'
import UserStrip from '@/components/layout/UserStrip'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <UserStrip />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}
