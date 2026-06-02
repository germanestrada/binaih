'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const OnboardingTour = dynamic(() => import('./OnboardingTour'), { ssr: false }) as React.ComponentType<{ onComplete: () => void }>

export default function OnboardingWrapper() {
  const { data: session, status } = useSession()
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (session?.user?.role !== 'admin') return
    if (session?.user?.email === 'demo@tveo.co') return

    fetch('/api/onboarding').then(r => r.json()).then(d => {
      const steps    = d.data ?? []
      const tourDone = steps.some((s: any) =>
        s.step === 'tour_completed' || s.step === 'tour_skipped'
      )
      if (!tourDone) setShowTour(true)
    })
  }, [status, session?.user?.email])

  if (!showTour) return null

  return <OnboardingTour onComplete={() => setShowTour(false)} />
}