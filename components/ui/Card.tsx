interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Card({ children, className='', style={}, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{ background:'#fff',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',cursor:onClick?'pointer':'default',...style }}
      className={className}
    >
      {children}
    </div>
  )
}
