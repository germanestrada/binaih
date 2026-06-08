'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ITEMS = [
  { id:'first_location',   label:'Agregar tu primera locación',   desc:'Crea una tienda, bodega o sucursal',    isTour: false, href:'/admin/locaciones' },
  { id:'first_audit_type', label:'Crear un tipo de auditoría',    desc:'Define el checklist de tu operación',   isTour: false, href:'/admin/tipos-auditoria' },
  { id:'first_user',       label:'Invitar a tu equipo',           desc:'Agrega un auditor o viewer',            isTour: false, href:'/admin/usuarios' },
  { id:'first_audit',      label:'Realizar tu primera auditoría', desc:'Completa un checklist en una locación', isTour: false, href:'/programacion' },
]

// ID único para el contenedor — garantiza una sola instancia
const ROOT_ID = 'tveo-onboarding-v1'

export default function OnboardingChecklist() {
  const { data: session } = useSession()
  const router = useRouter()
  const renderedRef = useRef(false)

  useEffect(() => {
    // Verificar sesión
    if (!session?.user) return
    if (session.user.role !== 'admin') return
    if (session.user.email === 'demo@tveo.co') return

    // Eliminar cualquier instancia previa
    const existing = document.getElementById(ROOT_ID)
    if (existing) existing.remove()

    // Solo renderizar una vez
    if (renderedRef.current) return
    renderedRef.current = true

    const render = (completedSteps: Set<string>) => {
      const old = document.getElementById(ROOT_ID)
      if (old) old.remove()

      const done  = ITEMS.filter(i => completedSteps.has(i.id)).length
      const total = ITEMS.length
      const pct   = Math.round(done / total * 100)

      if (done === total) return

      // Crear contenedor
      const root = document.createElement('div')
      root.id    = ROOT_ID

      // Insertar antes del "Resumen general"
      const main = document.querySelector('main')
      if (!main) return
      const firstChild = main.firstChild
      main.insertBefore(root, firstChild)

      // Estado de colapso
      let collapsed = true

      const redraw = () => {
        root.innerHTML = ''

        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:16px;'

        // Header
        const header = document.createElement('button')
        header.style.cssText = 'width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left;'
        header.innerHTML = `
          <div style="position:relative;width:36px;height:36px;flex-shrink:0">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border2)" stroke-width="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1558b0" stroke-width="3"
                stroke-dasharray="${pct * 0.88} 88" stroke-linecap="round"
                transform="rotate(-90 18 18)"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#1558b0">${pct}%</div>
          </div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500;color:var(--ink)">Configura tu cuenta — ${done}/${total} completado</div>
            <div style="font-size:11px;color:var(--subtle);margin-top:2px">${done === 0 ? 'Comienza aquí para sacarle el máximo a TVEO' : done < 3 ? 'Vas bien, continúa con el siguiente paso' : 'Casi listo, un par de pasos más'}</div>
          </div>
          <div style="font-size:14px;color:var(--subtle);transition:transform .2s;transform:${collapsed ? 'rotate(-90deg)' : 'rotate(0)'}"">▾</div>
        `
        header.onclick = () => { collapsed = !collapsed; redraw() }
        wrapper.appendChild(header)

        // Progress bar
        const bar = document.createElement('div')
        bar.style.cssText = 'height:2px;background:var(--border2);margin:0 16px'
        bar.innerHTML = `<div style="height:100%;width:${pct}%;background:#1558b0;border-radius:1px;transition:width .5s ease"></div>`
        wrapper.appendChild(bar)

        // Items
        if (!collapsed) {
          const list = document.createElement('div')
          list.style.cssText = 'padding:8px 16px 14px'
          ITEMS.forEach((item, i) => {
            const isDone = completedSteps.has(item.id)
            const row    = document.createElement('div')
            row.style.cssText = `display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:${i < ITEMS.length-1 ? '1px solid var(--border2)' : 'none'};cursor:${isDone ? 'default' : 'pointer'};opacity:${isDone ? 0.6 : 1}`
            row.innerHTML = `
              <div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;background:${isDone ? '#1558b0' : 'var(--surface)'};border:2px solid ${isDone ? '#1558b0' : 'var(--border)'};display:flex;align-items:center;justify-content:center">
                ${isDone ? '<span style="font-size:11px;color:white;font-weight:700">✓</span>' : ''}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;color:var(--ink);font-weight:500;text-decoration:${isDone ? 'line-through' : 'none'}">${item.label}</div>
                <div style="font-size:11px;color:var(--subtle);margin-top:1px">${item.desc}</div>
              </div>
              ${!isDone ? `<div style="font-size:11px;color:#1558b0;font-weight:500;flex-shrink:0">${item.isTour ? 'Iniciar →' : 'Ir →'}</div>` : ''}
            `
            if (!isDone) {
              row.onclick = () => {
                if (item.isTour) {
                  window.dispatchEvent(new CustomEvent('onboarding:start-tour'))
                } else if (item.href) {
                  router.push(item.href)
                }
              }
            }
            list.appendChild(row)
          })
          wrapper.appendChild(list)
        }

        root.appendChild(wrapper)
      }

      redraw()

      // Escuchar refresh
      const onRefresh = () => {
        fetch('/api/onboarding').then(r => r.json()).then(d => {
          const c = new Set<string>((d.data ?? []).filter((x: any) => x.completed).map((x: any) => x.step as string))
          render(c)
        })
      }
      window.removeEventListener('onboarding:refresh', onRefresh)
      window.addEventListener('onboarding:refresh', onRefresh)
    }

    // Carga inicial
    fetch('/api/onboarding').then(r => r.json()).then(d => {
      const completed = new Set<string>((d.data ?? []).filter((x: any) => x.completed).map((x: any) => x.step as string))
      render(completed)
    })

    return () => {
      const el = document.getElementById(ROOT_ID)
      if (el) el.remove()
      renderedRef.current = false
    }
  }, [session?.user?.email])

  // No renderiza nada en el árbol de React
  return null
}