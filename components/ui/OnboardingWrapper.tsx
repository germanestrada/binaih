'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const OnboardingTour = dynamic(() => import('./OnboardingTour'), { ssr: false }) as React.ComponentType<{ onComplete: () => void }>

export default function OnboardingWrapper() {
  const { data: session, status } = useSession()
  const [mounted,  setMounted]  = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [checked,  setChecked]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (status !== 'authenticated') return
    if (checked) return
    if (session?.user?.role !== 'admin') { setChecked(true); return }
    if (session?.user?.email === 'demo@tveo.co') { setChecked(true); return }

    setChecked(true)
    fetch('/api/onboarding').then(r => r.json()).then(d => {
      const steps    = d.data ?? []
      const tourDone = steps.some((s: any) =>
        s.step === 'tour_completed' || s.step === 'tour_skipped'
      )
      if (!tourDone) setShowTour(true)
    })
  }, [mounted, status, session?.user?.email])

  if (!mounted) return null
  if (!showTour) return null

  return <OnboardingTour onComplete={() => setShowTour(false)} />
}