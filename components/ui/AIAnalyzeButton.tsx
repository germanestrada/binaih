'use client'
import { useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'

interface AIAnalyzeButtonProps {
  auditId:      string
  itemResultId: string
  itemTitle:    string
  itemDesc?:    string
  responseType: string
  aiPrompt?:    string
  aiCriteria?:  string
  maxScore:     number
  scaleMinLabel?:string
  scaleMaxLabel?:string
  onResult: (result: AIResult) => void
}

export interface AIResult {
  status:      string
  score:       number
  confidence:  number
  reasoning:   string
  autoApproved:boolean
  raw:         Record<string,unknown>
}

export default function AIAnalyzeButton({
  auditId, itemResultId, itemTitle, itemDesc, responseType,
  aiPrompt, aiCriteria, maxScore, scaleMinLabel, scaleMaxLabel, onResult,
}: AIAnalyzeButtonProps) {
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [preview,   setPreview]   = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setLoading(true)

    // Preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Convertir a base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload  = () => resolve((r.result as string).split(',')[1])
      r.onerror = reject
      r.readAsDataURL(file)
    })

    try {
      const res  = await fetch('/api/ai/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          auditId, itemResultId, itemTitle, itemDesc,
          responseType, aiPrompt, aiCriteria, maxScore,
          scaleMinLabel, scaleMaxLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al analizar'); setLoading(false); return }
      onResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {preview&&(
        <img src={preview} alt="preview" style={{width:80,height:60,objectFit:'cover',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}/>
      )}
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <button
          onClick={()=>fileRef.current?.click()}
          disabled={loading}
          style={{
            display:'flex',alignItems:'center',gap:6,
            background:loading?'var(--surface)':'var(--ink)',
            color:loading?'var(--subtle)':'white',
            border:'none',padding:'6px 12px',borderRadius:'var(--r-sm)',
            fontSize:12,fontWeight:500,cursor:loading?'default':'pointer',
            fontFamily:'inherit',transition:'all .15s',
          }}
        >
          <Icon name="eye" size={13} color="currentColor"/>
          {loading?'Analizando…':'✨ Analizar con IA'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
        {loading&&<div style={{fontSize:11,color:'var(--subtle)'}}>Procesando imagen…</div>}
      </div>
      {error&&<div style={{fontSize:11,color:'var(--err)'}}>{error}</div>}
    </div>
  )
}
