'use client'
import { useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'

interface AIAnalyzeButtonProps {
  auditId:       string
  itemResultId:  string
  itemTitle:     string
  itemDesc?:     string
  responseType:  string
  aiPrompt?:     string
  aiCriteria?:   string
  maxScore:      number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  evidenceUrl?:  string   // URL de imagen ya guardada
  onResult:      (result: AIResult) => void
  onEvidenceUrl?: (url: string) => void  // callback cuando se sube la imagen
}

export interface AIResult {
  status:       string
  score:        number
  confidence:   number
  reasoning:    string
  autoApproved: boolean
  raw:          Record<string,unknown>
}

export default function AIAnalyzeButton({
  auditId, itemResultId, itemTitle, itemDesc, responseType,
  aiPrompt, aiCriteria, maxScore, scaleMinLabel, scaleMaxLabel,
  evidenceUrl, onResult, onEvidenceUrl,
}: AIAnalyzeButtonProps) {
  const [loading,     setLoading]     = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState('')
  const [preview,     setPreview]     = useState<string|null>(evidenceUrl ?? null)
  const [storedUrl,   setStoredUrl]   = useState<string|null>(evidenceUrl ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // 1. Subir imagen a Supabase Storage
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file',     file)
      formData.append('audit_id', auditId)
      formData.append('item_id',  itemResultId)

      const uploadRes  = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        setError(uploadData.error ?? 'Error al subir imagen')
        setUploading(false)
        return
      }

      const imageUrl    = uploadData.url
      const signedUrl   = uploadData.signed_url ?? imageUrl
      setStoredUrl(imageUrl)
      setUploading(false)

      // Notificar URL al padre para guardar en BD
      onEvidenceUrl?.(imageUrl)

      // 2. Disparar análisis IA si el ítem lo tiene habilitado
      setLoading(true)
      const res  = await fetch('/api/ai/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl:    signedUrl,   // URL firmada para que la IA pueda acceder
          auditId, itemResultId, itemTitle, itemDesc,
          responseType, aiPrompt, aiCriteria, maxScore,
          scaleMinLabel, scaleMaxLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al analizar'); return }
      onResult(data)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const status = uploading ? 'uploading' : loading ? 'analyzing' : 'idle'

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {/* Preview de imagen */}
      {preview&&(
        <div style={{position:'relative',display:'inline-block'}}>
          <img src={preview} alt="evidencia"
            style={{width:120,height:80,objectFit:'cover',borderRadius:'var(--r-md)',border:'1px solid var(--border)',display:'block'}}/>
          {storedUrl&&(
            <a href={storedUrl} target="_blank" rel="noopener noreferrer"
              style={{position:'absolute',bottom:4,right:4,background:'rgba(0,0,0,.6)',color:'white',fontSize:9,padding:'2px 5px',borderRadius:3,textDecoration:'none'}}>
              Ver original
            </a>
          )}
        </div>
      )}

      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
        {/* Botón subir foto */}
        <button
          onClick={()=>fileRef.current?.click()}
          disabled={status!=='idle'}
          style={{
            display:'flex',alignItems:'center',gap:6,
            background:'var(--surface)',color:'var(--ink)',
            border:'1px solid var(--border)',padding:'6px 12px',
            borderRadius:'var(--r-sm)',fontSize:12,fontWeight:500,
            cursor:status!=='idle'?'default':'pointer',fontFamily:'inherit',
          }}
        >
          <Icon name="eye" size={13} color="currentColor"/>
          {preview ? '📷 Cambiar foto' : '📷 Adjuntar foto'}
        </button>

        {/* Estado */}
        {status==='uploading'&&(
          <span style={{fontSize:11,color:'var(--subtle)',display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:10,height:10,borderRadius:'50%',border:'2px solid var(--border)',borderTopColor:'var(--ink)',animation:'spin 1s linear infinite',display:'inline-block'}}/>
            Subiendo imagen…
          </span>
        )}
        {status==='analyzing'&&(
          <span style={{fontSize:11,color:'var(--subtle)',display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:10,height:10,borderRadius:'50%',border:'2px solid var(--border)',borderTopColor:'#7c3aed',animation:'spin 1s linear infinite',display:'inline-block'}}/>
            Analizando con IA…
          </span>
        )}
        {status==='idle'&&preview&&(
          <span style={{fontSize:11,color:'var(--ok)'}}>✓ Imagen guardada</span>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*,image/heic" capture="environment"
        style={{display:'none'}} onChange={handleFile}/>

      {error&&<div style={{fontSize:11,color:'var(--err)',padding:'4px 8px',background:'var(--err-bg)',borderRadius:'var(--r-sm)'}}>{error}</div>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}