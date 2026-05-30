'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const OnboardingTour      = dynamic(() => import('./OnboardingTour'),      { ssr: false }) as React.ComponentType<{ onComplete: () => void }>
const OnboardingChecklist = dynamic(() => import('./OnboardingChecklist'), { ssr: false })

export default function OnboardingWrapper() {
  const { data: session, status } = useSession()
  const [showTour, setShowTour]   = useState(false)
  const [checked,  setChecked]    = useState(false)

  useEffect(() => {
    // Solo ejecutar una vez cuando la sesión esté lista
    if (status !== 'authenticated') return
    if (checked) return
    if (session?.user?.role !== 'admin') { setChecked(true); return }
    if (session?.user?.email === 'demo@tveo.co') { setChecked(true); return }

    setChecked(true)
    fetch('/api/onboarding').then(r => r.json()).then(d => {
      const steps   = d.data ?? []
      const tourDone = steps.some((s: any) =>
        s.step === 'tour_completed' || s.step === 'tour_skipped'
      )
      if (!tourDone) setShowTour(true)
    })
  }, [status, session?.user?.email])

  if (status !== 'authenticated') return null
  if (session?.user?.role !== 'admin') return null
  if (session?.user?.email === 'demo@tveo.co') return null

  return (
    <>
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
      <OnboardingChecklist />
    </>
  )
}