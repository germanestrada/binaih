import type { Metadata } from 'next'
import { auth } from '@/auth'
import SessionProvider from '@/components/layout/SessionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TVEO',
  description: 'Portal corporativo de auditoría de tiendas',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
