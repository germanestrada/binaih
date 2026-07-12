'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

export interface FilterField {
  key:        string
  label:      string
  type:       'select' | 'text'
  options?:   { value: string; label: string }[]
  placeholder?: string
}

interface FilterBarProps {
  fields:    FilterField[]
  values:    Record<string, string>
  onChange:  (key: string, value: string) => void
  onClear?:  () => void
  count?:    number
  label?:    string
}

export default function FilterBar({ fields, values, onChange, onClear, count, label='Filtros' }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const activeCount = Object.values(values).filter(Boolean).length

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--white)', flexShrink: 0 }}>
      {/* Toggle bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '6px 12px',
            fontSize: 12, color: 'var(--mid)', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 500,
          }}
        >
          <Icon name="filter" size={13} color="currentColor" />
          {label}
          {activeCount > 0 && (
            <span style={{
              background: 'var(--accent)', color: 'var(--accent-ink)',
              borderRadius: '50%', width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>{activeCount}</span>
          )}
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={12} color="currentColor" />
        </button>

        {/* Chips de filtros activos */}
        {Object.entries(values).filter(([, v]) => v).map(([k, v]) => {
          const field = fields.find(f => f.key === k)
          const label2 = field?.type === 'select'
            ? field.options?.find(o => o.value === v)?.label ?? v
            : v
          return (
            <span key={k} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 500,
            }}>
              {field?.label}: {label2}
              <button onClick={() => onChange(k, '')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent-ink)', display: 'flex', padding: 0, opacity: .7,
              }}>✕</button>
            </span>
          )
        })}

        {activeCount > 0 && onClear && (
          <button onClick={onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--subtle)', fontFamily: 'inherit',
          }}>Limpiar todo</button>
        )}

        {count !== undefined && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>
            {count} resultado{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Panel de filtros */}
      {open && (
        <div style={{
          display: 'flex', gap: 12, padding: '0 24px 14px',
          flexWrap: 'wrap',
        }}>
          {fields.map(field => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  style={{
                    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                    padding: '7px 10px', fontSize: 12, fontFamily: 'inherit',
                    color: 'var(--ink)', outline: 'none', cursor: 'pointer',
                    minWidth: 160, background: 'var(--white)',
                  }}
                >
                  <option value="">{field.placeholder ?? 'Todos'}</option>
                  {field.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={values[field.key] ?? ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                    padding: '7px 10px', fontSize: 12, fontFamily: 'inherit',
                    color: 'var(--ink)', outline: 'none', minWidth: 200,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
