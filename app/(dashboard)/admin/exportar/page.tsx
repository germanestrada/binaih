'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const EXPORTS = [
  { type:'locations', label:'Locaciones',  desc:'ID, nombre, ciudad, zona, estado, score, gerente, área',        icon:'store'    },
  { type:'audits',    label:'Auditorías',  desc:'ID, locación, score, estado, fechas, duración, notas',           icon:'calendar' },
  { type:'findings',  label:'Hallazgos',   desc:'ID, locación, categoría, severidad, estado, fecha límite',       icon:'search'   },
  { type:'users',     label:'Usuarios',    desc:'ID, nombre, email, rol, zona, estado, último acceso',            icon:'user'     },
] as const

export default function ExportarPage() {
  const [loading,setLoading] = useState<string|null>(null)

  const download = async (type: string) => {
    setLoading(type)
    try {
      const res = await fetch(`/api/admin/export?type=${type}`)
      if(!res.ok){alert('Error al exportar');return}
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `binaih-${type}-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setLoading(null) }
  }

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1.2px',marginBottom:20}}>
        Exportar datos
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
        {EXPORTS.map(e=>(
          <div key={e.type} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <Icon name={e.icon as any} size={16} color="var(--ink)"/>
              <span style={{fontSize:14,fontWeight:500,color:'var(--ink)'}}>{e.label}</span>
            </div>
            <div style={{fontSize:12,color:'var(--subtle)',marginBottom:16,lineHeight:1.5}}>{e.desc}</div>
            <button
              onClick={()=>download(e.type)}
              disabled={loading===e.type}
              style={{display:'flex',alignItems:'center',gap:6,background:loading===e.type?'var(--surface)':'var(--accent)',color:loading===e.type?'var(--subtle)':'var(--accent-ink)',border:'none',padding:'9px 16px',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:500,cursor:loading===e.type?'default':'pointer',fontFamily:'inherit'}}
            >
              <Icon name="export" size={13} color="currentColor"/>
              {loading===e.type?'Generando…':'Descargar CSV'}
            </button>
          </div>
        ))}
      </div>
      <div style={{marginTop:20,padding:'16px',background:'var(--surface)',borderRadius:'var(--r-md)',border:'1px solid var(--border2)',fontSize:12,color:'var(--subtle)'}}>
        Los archivos CSV incluyen todos los registros del tenant activo. Los valores secretos de configuración no se incluyen en ninguna exportación.
      </div>
    </div>
  )
}
