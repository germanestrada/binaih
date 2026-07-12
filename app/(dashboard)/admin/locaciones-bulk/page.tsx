'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Icon from '@/components/ui/Icon'

interface UploadRow { [key: string]: string }
interface UploadResult { ok: number; errors: { row: number; error: string }[] }

const TEMPLATE_HEADERS = ['nombre','ciudad','tipo','zona','direccion','gerente','telefono','area_m2','latitud','longitud']
const TEMPLATE_EXAMPLE = ['Tienda Centro','Bogotá','Tienda','Norte','Cll 72 # 10-34','Ana García','3001234567','450','4.6534','-74.0586']

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'tveo-locaciones-plantilla.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text: string): UploadRow[] {
  const lines   = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g,''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/['"]/g,''))
    return Object.fromEntries(headers.map((h,i) => [h, vals[i]??'']))
  })
}

export default function CargueLocacionesPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows,    setRows]    = useState<UploadRow[]>([])
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<UploadResult|null>(null)
  const [error,   setError]   = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setResult(null)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (!parsed.length) { setError('El archivo está vacío o no tiene el formato correcto'); return }
      setRows(parsed); setPreview(true)
    }
    reader.readAsText(file)
  }

  const upload = async () => {
    setLoading(true); setError('')
    const res  = await fetch('/api/admin/locations/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const data = await res.json() as UploadResult
    setLoading(false); setResult(data); setPreview(false)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 92px)'}}>
      <PageHeader title="Cargue masivo" highlight="Locaciones" meta={[]} backHref="/admin/locaciones" backLabel="Locaciones"/>
      <div style={{flex:1,overflowY:'auto',padding:'28px 32px'}}>
        <div style={{maxWidth:640}}>

          {/* Instrucciones */}
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'20px 24px',marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:12}}>Cómo funciona</div>
            <ol style={{fontSize:12,color:'var(--mid)',lineHeight:2.2,margin:0,paddingLeft:20}}>
              <li>Descarga la plantilla CSV con el formato requerido</li>
              <li>Completa los datos — solo <strong>nombre</strong> y <strong>ciudad</strong> son obligatorios</li>
              <li>El campo <strong>tipo</strong> debe coincidir exactamente con un tipo de locación existente</li>
              <li>Sube el archivo y revisa la vista previa antes de confirmar</li>
            </ol>
            <button onClick={downloadTemplate} style={{
              display:'flex',alignItems:'center',gap:7,marginTop:14,
              background:'none',border:'1px solid var(--border)',color:'var(--mid)',
              padding:'8px 16px',borderRadius:'var(--r-sm)',fontSize:12,
              cursor:'pointer',fontFamily:'inherit',fontWeight:500,
            }}>
              <Icon name="export" size={13}/>Descargar plantilla CSV
            </button>
          </div>

          {/* Upload */}
          {!preview&&!result&&(
            <div
              onClick={()=>fileRef.current?.click()}
              style={{
                border:'2px dashed var(--border)',borderRadius:'var(--r-lg)',
                padding:'40px',textAlign:'center',cursor:'pointer',
                background:'var(--surface)',transition:'border-color .15s',
              }}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor='var(--ink)'}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'}
            >
              <Icon name="export" size={28} color="var(--border)" style={{display:'block',margin:'0 auto 12px'}}/>
              <div style={{fontSize:14,color:'var(--mid)',marginBottom:4}}>Haz clic para seleccionar un archivo CSV</div>
              <div style={{fontSize:12,color:'var(--subtle)'}}>Solo archivos .csv</div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={handleFile}/>
            </div>
          )}

          {/* Vista previa */}
          {preview&&rows.length>0&&(
            <div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:12}}>
                Vista previa — {rows.length} locaciones a importar
              </div>
              <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',marginBottom:16}}>
                {/* Header */}
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:0,padding:'9px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:600,color:'var(--subtle)',textTransform:'uppercase',letterSpacing:'1px'}}>
                  {['Nombre','Ciudad','Zona','Tipo'].map(h=><div key={h}>{h}</div>)}
                </div>
                {/* Rows (max 10 preview) */}
                {rows.slice(0,10).map((row,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:0,padding:'10px 16px',borderBottom:i<Math.min(rows.length,10)-1?'1px solid var(--border2)':'none',fontSize:12}}>
                    <div style={{fontWeight:500,color:'var(--ink)'}}>{row.nombre||row.name||'—'}</div>
                    <div style={{color:'var(--mid)'}}>{row.ciudad||row.city||'—'}</div>
                    <div style={{color:'var(--subtle)'}}>{row.zona||row.zone||'—'}</div>
                    <div style={{color:'var(--subtle)'}}>{row.tipo||row.type||'—'}</div>
                  </div>
                ))}
                {rows.length>10&&(
                  <div style={{padding:'10px 16px',fontSize:11,color:'var(--subtle)',background:'var(--surface)',textAlign:'center'}}>
                    … y {rows.length-10} más
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>{setPreview(false);setRows([])}} style={{background:'none',border:'1px solid var(--border)',color:'var(--mid)',padding:'10px 20px',borderRadius:'var(--r-sm)',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  Cancelar
                </button>
                <button onClick={upload} disabled={loading} style={{background:loading?'var(--subtle)':'var(--ink)',color:'var(--accent-ink)',border:'none',padding:'10px 24px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:loading?'default':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:7}}>
                  <Icon name="check" size={13} color="white"/>
                  {loading?'Importando…':`Confirmar e importar ${rows.length} locaciones`}
                </button>
              </div>
            </div>
          )}

          {/* Resultado */}
          {result&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div style={{background:'var(--ok-bg)',border:'1px solid var(--ok)',borderRadius:'var(--r-lg)',padding:'20px',textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:40,color:'var(--ok)',lineHeight:1}}>{result.ok}</div>
                  <div style={{fontSize:12,color:'var(--ok)',marginTop:6,fontWeight:500}}>Importadas correctamente</div>
                </div>
                <div style={{background:result.errors.length?'var(--err-bg)':'var(--surface)',border:`1px solid ${result.errors.length?'var(--err)':'var(--border)'}`,borderRadius:'var(--r-lg)',padding:'20px',textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:40,color:result.errors.length?'var(--err)':'var(--subtle)',lineHeight:1}}>{result.errors.length}</div>
                  <div style={{fontSize:12,color:result.errors.length?'var(--err)':'var(--subtle)',marginTop:6,fontWeight:500}}>Con errores</div>
                </div>
              </div>
              {result.errors.length>0&&(
                <div style={{background:'var(--white)',border:'1px solid var(--err)',borderRadius:'var(--r-lg)',overflow:'hidden',marginBottom:16}}>
                  {result.errors.map((e,i)=>(
                    <div key={i} style={{padding:'10px 16px',borderBottom:i<result.errors.length-1?'1px solid var(--border2)':'none',fontSize:12}}>
                      <span style={{color:'var(--err)',fontWeight:600}}>Fila {e.row}:</span>{' '}
                      <span style={{color:'var(--mid)'}}>{e.error}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>{setResult(null);setRows([])}} style={{background:'none',border:'1px solid var(--border)',color:'var(--mid)',padding:'10px 20px',borderRadius:'var(--r-sm)',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  Importar más
                </button>
                <button onClick={()=>router.push('/admin/locaciones')} style={{background:'var(--accent)',color:'var(--accent-ink)',border:'none',padding:'10px 24px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>
                  Ver locaciones →
                </button>
              </div>
            </div>
          )}

          {error&&<div style={{fontSize:12,color:'var(--err)',marginTop:12,padding:'10px 14px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}
        </div>
      </div>
    </div>
  )
}
