export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 75) return 'Bueno'
  if (score >= 60) return 'Regular'
  return 'Crítico'
}

export function scorePillClass(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800'
  if (score >= 75) return 'bg-blue-100 text-blue-800'
  if (score >= 60) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function exportToCSV(rows: (string | number)[][], filename: string): void {
  const csv = rows.map((r) => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = filename
  a.click()
}
