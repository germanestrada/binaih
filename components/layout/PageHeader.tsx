'use client'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'

interface PageHeaderProps {
  title: string
  highlight?: string
  meta?: { label: string; value: string }[]
  backLabel?: string
  backHref?: string
}

export default function PageHeader({ title, highlight, meta = [], backLabel = 'Volver', backHref }: PageHeaderProps) {
  const router = useRouter()
  return (
    <div style={{
      background: 'var(--shell)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      borderBottom: '1px solid var(--shell-sep)',
      flexShrink: 0,
    }}>
      <button
        onClick={() => backHref ? router.push(backHref) : router.back()}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'none', border: '1px solid var(--shell-sep)',
          color: 'var(--shell-dim)', padding: '5px 12px',
          borderRadius: 'var(--r-sm)', fontSize: 12, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'border-color .15s, color .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--shell-text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--shell-dim)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--shell-sep)' }}
      >
        <Icon name="arrow-left" size={13} color="currentColor" />
        {backLabel}
      </button>

      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--shell-text)', letterSpacing: '.3px' }}>
        <span style={{ color: 'var(--shell-dim)', fontFamily: 'var(--font-mono)', fontSize: 12, marginRight: 8 }}>{title}</span>
        {highlight}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {meta.map(m => (
          <div key={m.label} style={{ fontSize: 11 }}>
            <span style={{ color: 'rgba(255,255,255,.3)' }}>{m.label} </span>
            <span style={{ color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
