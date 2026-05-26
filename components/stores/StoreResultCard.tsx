'use client'
import type { Store } from '@/types/store'
import { scoreLabel } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Link from 'next/link'

function scoreColor(s: number) {
  if (s >= 90) return { color: 'var(--ok)',  bg: 'var(--ok-bg)'  }
  if (s >= 75) return { color: 'var(--ink)', bg: 'var(--surface)'}
  if (s >= 60) return { color: 'var(--warn)',bg: 'var(--warn-bg)' }
  return          { color: 'var(--err)',  bg: 'var(--err-bg)'  }
}

export default function StoreResultCard({ store }: { store: Store }) {
  const sc = scoreColor(store.score)
  return (
    <Link href={`/tiendas/${store.id}`}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '13px 16px', marginBottom: 1,
          borderBottom: '1px solid var(--border2)',
          cursor: 'pointer', transition: 'background .1s',
          background: 'var(--white)',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--white)'}
      >
        {/* Score badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--r-md)',
          background: sc.bg, border: `1px solid ${sc.color}22`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: sc.color, lineHeight: 1 }}>{store.score}</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
            {store.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--subtle)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{store.id}</span>
            <span>·</span>
            <Icon name="pin" size={11} />
            <span>{store.city} · {store.zone}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--subtle)', flexShrink: 0, alignItems: 'center' }}>
          <div style={{ textAlign: 'center', minWidth: 36 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>{store.audits}</div>
            <div style={{ fontSize: 9, marginTop: 2, whiteSpace: 'nowrap' }}>audits</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 36 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: store.findings > 5 ? 'var(--err)' : 'var(--ink)', lineHeight: 1 }}>{store.findings}</div>
            <div style={{ fontSize: 9, marginTop: 2, whiteSpace: 'nowrap' }}>hallazgos</div>
          </div>
        </div>

        <Icon name="arrow-right" size={13} color="var(--subtle)" />
      </div>
    </Link>
  )
}
