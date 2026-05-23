'use client'
import { useState } from 'react'
import type { Finding } from '@/types/finding'
import Icon from '@/components/ui/Icon'

export default function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: '1px solid var(--border2)',
      background: 'var(--white)',
      transition: 'background .1s',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
      >
        {/* Rank number */}
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>{finding.count}</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{finding.title}</div>
          <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
            {finding.stores.length} tienda{finding.stores.length !== 1 ? 's' : ''} afectada{finding.stores.length !== 1 ? 's' : ''}
          </div>
        </div>

        <Icon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="var(--subtle)"
          style={{ transition: 'transform .2s', flexShrink: 0 }}
        />
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px 74px', borderTop: '1px solid var(--border2)' }}>
          <p style={{ fontSize: 12, color: 'var(--mid)', marginTop: 12, marginBottom: 10, lineHeight: 1.65 }}>{finding.desc}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {finding.stores.map(sid => (
              <span key={sid} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--mid)', padding: '3px 10px', borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
              }}>
                {sid}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
