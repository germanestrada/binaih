export default function EmptyState({ icon='📭', title='Sin resultados', desc='Intenta ajustar los filtros.' }: { icon?:string; title?:string; desc?:string }) {
  return (
    <div style={{ textAlign:'center',padding:'48px 24px',color:'var(--text2)' }}>
      <div style={{ fontSize:40,marginBottom:12 }}>{icon}</div>
      <div style={{ fontWeight:600,fontSize:15,marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13,color:'var(--text3)' }}>{desc}</div>
    </div>
  )
}
