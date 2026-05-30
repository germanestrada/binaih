'use client'
import { useEffect, useState } from 'react'

// ── Definición de los pasos del tour ─────────────────────────
interface TourStep {
  id:       string
  title:    string
  body:     string
  target:   string   // selector CSS o ID del elemento a resaltar
  position: 'top'|'bottom'|'left'|'right'|'center'
  path?:    string   // redirigir a esta ruta antes de mostrar el paso
}

const TOUR_STEPS: TourStep[] = [
  {
    id:       'welcome',
    title:    '¡Bienvenido a TVEO! 👋',
    body:     'Este es tu portal de auditorías inteligentes. En 2 minutos te mostramos todo lo que puedes hacer. ¿Comenzamos?',
    target:   'body',
    position: 'center',
  },
  {
    id:       'dashboard_kpis',
    title:    'KPIs en tiempo real',
    body:     'Aquí ves el estado global de tu operación: score promedio, auditorías completadas, hallazgos críticos y cobertura. El color indica si estás en zona verde, amarilla o roja.',
    target:   '#kpi-grid',
    position: 'bottom',
  },
  {
    id:       'dashboard_chart',
    title:    'Actividad semanal',
    body:     'El gráfico muestra cuántas auditorías se completaron cada día. Te ayuda a verificar si tu equipo mantiene el ritmo de cobertura planeado.',
    target:   '#weekly-chart',
    position: 'top',
  },
  {
    id:       'recent_locations',
    title:    'Locaciones recientes',
    body:     'Ve el estado de tus tiendas y puntos de venta más recientes. En el menú lateral "Locaciones" puedes ver todas con mapa interactivo, filtros y vista split.',
    target:   '#stores-recent',
    position: 'top',
  },
  {
    id:       'recent_audits',
    title:    'Auditorías recientes',
    body:     'Las últimas auditorías completadas con su score y estado. Desde "Auditorías" puedes crear nuevas, ver el checklist completo y los análisis de IA.',
    target:   '#audits-recent',
    position: 'top',
  },
  {
    id:       'sidebar_nav',
    title:    'Navegación principal',
    body:     'Desde el menú lateral accedes a: Locaciones, Hallazgos, Top Hallazgos, Auditorías y el Panel de Administración para configurar tu operación.',
    target:   'nav',
    position: 'right',
  },
  {
    id:       'admin_hint',
    title:    'Panel de administración',
    body:     'En "Admin" configuras usuarios, tipos de locación, tipos de auditoría, reglas de IA, control de acceso por IP y horario, y mucho más. Sin soporte técnico.',
    target:   'body',
    position: 'center',
  },
  {
    id:       'finish',
    title:    '¡Listo para empezar! 🚀',
    body:     'Ya conoces las funciones principales. El checklist debajo te guía paso a paso para configurar tu primera locación y auditoría.',
    target:   'body',
    position: 'center',
  },
]

interface OnboardingTourProps {
  onComplete: () => void
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(true)
  const [pos,     setPos]     = useState({ top:0, left:0, width:0, height:0 })

  const current = TOUR_STEPS[step]
  const isLast  = step === TOUR_STEPS.length - 1
  const isFirst = step === 0

  // No hay navegación automática — el tour permanece en la página actual

  // Calcular posición del elemento objetivo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (current.target === 'body' || current.position === 'center') {
        setPos({ top: 0, left: 0, width: 0, height: 0 })
        return
      }
      const el = document.querySelector(current.target)
      if (el) {
        const r = el.getBoundingClientRect()
        setPos({ top: r.top, left: r.left, width: r.width, height: r.height })
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setPos({ top: 0, left: 0, width: 0, height: 0 })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [step])

  const next = async () => {
    if (isLast) {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'tour_completed' }),
      })
      setVisible(false)
      onComplete()
      return
    }
    setStep(s => s + 1)
  }

  const skip = async () => {
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'tour_skipped' }),
    })
    setVisible(false)
    onComplete()
  }

  if (!visible) return null

  // ── Calcular posición del tooltip ─────────────────────────
  const isCenter = current.position === 'center' || current.target === 'body' || pos.width === 0

  const tooltipStyle: React.CSSProperties = isCenter ? {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10001,
  } : {
    position: 'fixed',
    zIndex: 10001,
    ...(current.position === 'bottom' ? { top: pos.top + pos.height + 12, left: Math.max(16, pos.left) } : {}),
    ...(current.position === 'top'    ? { top: pos.top - 8, left: Math.max(16, pos.left), transform:'translateY(-100%)' } : {}),
    ...(current.position === 'right'  ? { top: pos.top, left: pos.left + pos.width + 12 } : {}),
    ...(current.position === 'left'   ? { top: pos.top, left: pos.left - 12, transform:'translateX(-100%)' } : {}),
  }

  return (
    <>
      {/* Overlay oscuro */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: isCenter ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.45)',
        pointerEvents: 'none',
      }}/>

      {/* Highlight del elemento */}
      {!isCenter && pos.width > 0 && (
        <div style={{
          position: 'fixed',
          top:    pos.top    - 4,
          left:   pos.left   - 4,
          width:  pos.width  + 8,
          height: pos.height + 8,
          zIndex: 10001,
          borderRadius: 8,
          border: '2px solid #1558b0',
          boxShadow: '0 0 0 4px rgba(21,88,176,.2)',
          pointerEvents: 'none',
        }}/>
      )}

      {/* Tooltip */}
      <div style={{
        ...tooltipStyle,
        background: 'white',
        borderRadius: 16,
        padding: '24px 24px 20px',
        width: 320,
        boxShadow: '0 24px 64px rgba(0,0,0,.3)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Progress dots */}
        <div style={{ display:'flex', gap:5, marginBottom:16 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i <= step ? '#1558b0' : '#e5e7eb',
              transition: 'background .3s',
            }}/>
          ))}
        </div>

        {/* Step counter */}
        <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8, fontWeight:500 }}>
          Paso {step + 1} de {TOUR_STEPS.length}
        </div>

        {/* Content */}
        <h3 style={{ fontSize:16, fontWeight:600, color:'#111', margin:'0 0 8px', lineHeight:1.3 }}>
          {current.title}
        </h3>
        <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, margin:'0 0 20px' }}>
          {current.body}
        </p>

        {/* Actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={skip} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:12, color:'#9ca3af', fontFamily:'inherit', padding:0,
          }}>
            Omitir tour
          </button>
          <div style={{ display:'flex', gap:8 }}>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} style={{
                background:'none', border:'1px solid #e5e7eb',
                padding:'8px 16px', borderRadius:8, fontSize:13,
                cursor:'pointer', fontFamily:'inherit', color:'#374151',
              }}>
                ← Atrás
              </button>
            )}
            <button onClick={next} style={{
              background:'#1558b0', color:'white', border:'none',
              padding:'8px 20px', borderRadius:8, fontSize:13,
              fontWeight:500, cursor:'pointer', fontFamily:'inherit',
            }}>
              {isLast ? '¡Empezar! 🚀' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}