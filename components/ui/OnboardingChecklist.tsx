'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const OnboardingTour = dynamic(() => import('./OnboardingTour'), { ssr: false }) as React.ComponentType<{ onComplete: () => void }>

interface ChecklistItem {
  id:    string
  label: string
  desc:  string
  href?: string
  isTour?: boolean
  done:  boolean
}

const ITEMS: Omit<ChecklistItem,'done'>[] = [
  { id:'tour_completed',    label:'Completar el tour inicial',       desc:'Explora las funciones principales',        isTour: true },
  { id:'first_location',   label:'Agregar tu primera locación',     desc:'Crea una tienda, bodega o sucursal',        href:'/admin/locaciones' },
  { id:'first_audit_type', label:'Crear un tipo de auditoría',      desc:'Define el checklist de tu operación',       href:'/admin/tipos-auditoria' },
  { id:'first_user',       label:'Invitar a tu equipo',             desc:'Agrega un auditor o viewer',                href:'/admin/usuarios' },
  { id:'first_audit',      label:'Realizar tu primera auditoría',   desc:'Completa un checklist en una locación',     href:'/auditorias/nueva' },
]

export default function OnboardingChecklist() {
  const router               = useRouter()
  const { data: session }    = useSession()
  const [mounted, setMounted]= useState(false)
  const [items,   setItems]  = useState<ChecklistItem[]>([])
  const [loading, setLoading]= useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [showTour, setShowTour]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const loadProgress = () => {
    fetch('/api/onboarding').then(r => r.json()).then(d => {
      const completed = new Set((d.data ?? []).filter((x: any) => x.completed).map((x: any) => x.step))
      setItems(ITEMS.map(it => ({ ...it, done: completed.has(it.id) })))
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!mounted) return
    loadProgress()
    window.addEventListener('onboarding:refresh', loadProgress)
    return () => window.removeEventListener('onboarding:refresh', loadProgress)
  }, [mounted])

  if (!mounted) return null
  if (loading) return null
  if (session?.user?.email === 'demo@tveo.co') return null

  const done  = items.filter(i => i.done).length
  const total = items.length
  const pct   = Math.round(done / total * 100)

  if (done === total) return null

  const handleItem = (item: ChecklistItem) => {
    if (item.done) return
    if (item.isTour) {
      setShowTour(true)
      return
    }
    if (item.href) router.push(item.href)
  }

  const handleTourComplete = () => {
    setShowTour(false)
    window.dispatchEvent(new CustomEvent('onboarding:refresh'))
  }

  return (
    <>
      {showTour && <OnboardingTour onComplete={handleTourComplete} />}

      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 16,
      }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <div style={{ position:'relative', width:36, height:36, flexShrink:0 }}>
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border2)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1558b0" strokeWidth="3"
                strokeDasharray={`${pct * 0.88} 88`} strokeLinecap="round"
                transform="rotate(-90 18 18)" style={{ transition:'stroke-dasharray .5s ease' }}/>
            </svg>
            <div style={{
              position:'absolute', inset:0, display:'flex',
              alignItems:'center', justifyContent:'center',
              fontSize:10, fontWeight:600, color:'#1558b0',
            }}>{pct}%</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>
              Configura tu cuenta — {done}/{total} completado
            </div>
            <div style={{ fontSize:11, color:'var(--subtle)', marginTop:2 }}>
              {done === 0 ? 'Comienza aquí para sacarle el máximo a TVEO' :
               done < 3   ? 'Vas bien, continúa con el siguiente paso' :
                            'Casi listo, un par de pasos más'}
            </div>
          </div>
          <div style={{ fontSize:14, color:'var(--subtle)', transition:'transform .2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▾</div>
        </button>

        <div style={{ height:2, background:'var(--border2)', margin:'0 16px' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'#1558b0', borderRadius:1, transition:'width .5s ease' }}/>
        </div>

        {!collapsed && (
          <div style={{ padding:'8px 16px 14px' }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                onClick={() => handleItem(item)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 0',
                  borderBottom: i < items.length-1 ? '1px solid var(--border2)' : 'none',
                  cursor: item.done ? 'default' : 'pointer',
                  opacity: item.done ? .6 : 1,
                }}
              >
                <div style={{
                  width:22, height:22, borderRadius:'50%', flexShrink:0,
                  background: item.done ? '#1558b0' : 'var(--surface)',
                  border: `2px solid ${item.done ? '#1558b0' : 'var(--border)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .2s',
                }}>
                  {item.done && <span style={{ fontSize:11, color:'white', fontWeight:700 }}>✓</span>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontSize:13, color:'var(--ink)', fontWeight:500,
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'var(--subtle)', marginTop:1 }}>{item.desc}</div>
                </div>
                {!item.done && (
                  <div style={{ fontSize:11, color:'#1558b0', fontWeight:500, flexShrink:0 }}>
                    {item.isTour ? 'Iniciar →' : 'Ir →'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}