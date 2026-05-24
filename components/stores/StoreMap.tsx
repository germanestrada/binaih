'use client'
import { useEffect, useRef } from 'react'
import type { Store } from '@/types/store'

interface StoreMapProps {
  stores: Store[]
  selectedId?: string | null
  onSelect?: (store: Store) => void
}

function scoreColor(score: number) {
  if (score >= 90) return { fill: '#1a6b3a', border: '#0f4022' }
  if (score >= 75) return { fill: '#111111', border: '#000000' }
  if (score >= 60) return { fill: '#7a5200', border: '#4a3100' }
  return                  { fill: '#8b1a1a', border: '#5a1010' }
}

function makePinSVG(score: number, selected: boolean): string {
  const { fill, border } = scoreColor(score)
  const size = selected ? 44 : 36
  const fontSize = selected ? 11 : 10
  const ringWidth = selected ? 3 : 1.5
  return `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${fill}" stroke="${border}" stroke-width="${ringWidth}"/>
      ${selected ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2 + 1}" fill="none" stroke="${fill}" stroke-width="2" opacity="0.4"/>` : ''}
      <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" font-family="Georgia,serif" font-size="${fontSize}" fill="white" font-weight="600">${score}</text>
      <line x1="${size/2}" y1="${size - 2}" x2="${size/2}" y2="${size + 7}" stroke="${border}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `
}

export default function StoreMap({ stores, selectedId, onSelect }: StoreMapProps) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const leafRef   = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    if (!mapRef.current || leafRef.current) return

    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(mapRef.current!, {
        center:    [5.5, -74.5],
        zoom:      6,
        zoomControl: false,
        attributionControl: false,
      })

      // CartoDB Positron — minimalista, blanco y negro, sin API key
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('© OpenStreetMap © CARTO')
        .addTo(map)

      stores.forEach(store => {
        if (!store.lat || !store.lng) return
        const isSelected = store.id === selectedId
        const icon = L.divIcon({
          html:      makePinSVG(store.score, isSelected),
          iconSize:  [isSelected ? 44 : 36, isSelected ? 52 : 44],
          iconAnchor:[isSelected ? 22 : 18, isSelected ? 52 : 44],
          className: '',
        })
        const marker = L.marker([store.lat, store.lng], { icon })
          .addTo(map)
          .on('click', () => onSelect?.(store))

        marker.bindTooltip(`
          <div style="font-family:system-ui;font-size:12px;padding:2px 0">
            <strong>${store.id} ${store.name}</strong><br/>
            <span style="color:#666">${store.city} · ${store.zone}</span>
          </div>
        `, { direction: 'top', offset: [0, -8] })

        markersRef.current.set(store.id, marker)
      })

      leafRef.current = { map, L }
    })

    return () => {
      leafRef.current?.map.remove()
      leafRef.current = null
    }
  }, [])

  // Actualizar markers cuando cambia selectedId
  useEffect(() => {
    if (!leafRef.current) return
    const { L } = leafRef.current

    markersRef.current.forEach((marker, id) => {
      const store = stores.find(s => s.id === id)
      if (!store) return
      const isSelected = id === selectedId
      const icon = L.divIcon({
        html:      makePinSVG(store.score, isSelected),
        iconSize:  [isSelected ? 44 : 36, isSelected ? 52 : 44],
        iconAnchor:[isSelected ? 22 : 18, isSelected ? 52 : 44],
        className: '',
      })
      marker.setIcon(icon)
    })

    if (selectedId) {
      const store = stores.find(s => s.id === selectedId)
      if (store?.lat && store?.lng) {
        leafRef.current.map.setView([store.lat, store.lng], 13, { animate: true })
      }
    }
  }, [selectedId, stores])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#f5f5f0' }} />
    </>
  )
}
