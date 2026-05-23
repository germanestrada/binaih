type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray'

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  green:  { background:'var(--green-bg)',  color:'var(--green)'  },
  amber:  { background:'var(--amber-bg)',  color:'var(--amber)'  },
  red:    { background:'var(--red-bg)',    color:'var(--red)'    },
  blue:   { background:'var(--sky)',       color:'var(--blue)'   },
  purple: { background:'var(--purple-bg)', color:'var(--purple)' },
  gray:   { background:'var(--bg2)',       color:'var(--text2)'  },
}

export default function Badge({ label, variant='gray' }: { label:string; variant?:BadgeVariant }) {
  return (
    <span style={{ fontSize:11,fontWeight:600,padding:'2px 9px',borderRadius:20,...VARIANT_STYLES[variant] }}>
      {label}
    </span>
  )
}
