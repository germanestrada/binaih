// app/(dashboard)/auditorias/nueva/page.tsx
// Redirige a /programacion — las auditorías se crean desde allí
import { redirect } from 'next/navigation'

export default function NuevaAuditoriaPage() {
  redirect('/programacion')
}