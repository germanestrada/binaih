'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const OnboardingTour = dynamic(() => import('./OnboardingTour'), { ssr: false }) as React.ComponentType<{ onComplete: () => void }>

export default function OnboardingWrapper() {
  const { data: session } = useSession()
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const startTour = () => setShowTour(true)
    window.addEventListener('onboarding:start-tour', startTour)
    return () => window.removeEventListener('onboarding:start-tour', startTour)
  }, [])

  const handleComplete = () => {
    setShowTour(false)
    window.dispatchEvent(new CustomEvent('onboarding:refresh'))
  }

  if (!showTour) return null
  if (session?.user?.email === 'demo@tveo.co') return null

  return <OnboardingTour onComplete={handleComplete} />
}