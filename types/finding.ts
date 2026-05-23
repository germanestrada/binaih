export type FindingCategory = 'seguridad' | 'exhibicion' | 'inventario' | 'higiene' | 'atencion' | 'precio'

export interface Finding {
  id: string
  title: string
  desc: string
  icon: string
  color: string
  count: number
  stores: string[]
  category: FindingCategory
}
