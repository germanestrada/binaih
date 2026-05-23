import type { Store } from '@/types/store'
import type { Finding } from '@/types/finding'
import type { KpiData } from '@/types/kpi'

export const MOCK_STORES: Store[] = [
  { id: 'T001', name: 'Chapinero Centro',      city: 'Bogotá',      zone: 'Norte',     score: 94, audits: 12, findings: 1, status: 'active',   lat:  4.6473, lng: -74.0662 },
  { id: 'T002', name: 'Unicentro',              city: 'Bogotá',      zone: 'Norte',     score: 88, audits: 10, findings: 3, status: 'active',   lat:  4.7110, lng: -74.0464 },
  { id: 'T003', name: 'Centro Comercial Sur',   city: 'Bogotá',      zone: 'Sur',       score: 62, audits:  8, findings: 7, status: 'critical', lat:  4.5759, lng: -74.1241 },
  { id: 'T004', name: 'Mayorca',                city: 'Medellín',    zone: 'Occidente', score: 76, audits:  9, findings: 4, status: 'active',   lat:  6.2442, lng: -75.5812 },
  { id: 'T005', name: 'El Tesoro',              city: 'Medellín',    zone: 'Oriente',   score: 91, audits: 11, findings: 2, status: 'active',   lat:  6.2106, lng: -75.5591 },
  { id: 'T006', name: 'Buenaventura Plaza',     city: 'Cali',        zone: 'Centro',    score: 55, audits:  6, findings: 9, status: 'critical', lat:  3.4516, lng: -76.5320 },
  { id: 'T007', name: 'Jardín Plaza',           city: 'Cali',        zone: 'Centro',    score: 83, audits: 10, findings: 2, status: 'active',   lat:  3.4185, lng: -76.5220 },
  { id: 'T008', name: 'Canaveral',              city: 'Bucaramanga', zone: 'Norte',     score: 79, audits:  8, findings: 3, status: 'active',   lat:  7.1193, lng: -73.1227 },
]

export const MOCK_FINDINGS: Finding[] = [
  { id: 'F01', title: 'Exhibición deficiente',       desc: 'Productos mal ubicados o sin precio visible en góndola.', icon: '🏷️', color: '#fdecea', count: 34, stores: ['T003','T006','T001'], category: 'exhibicion' },
  { id: 'F02', title: 'Inventario desactualizado',   desc: 'Diferencias entre sistema y físico mayores al 5%.', icon: '📦', color: '#fff8e1', count: 28, stores: ['T003','T006','T008'], category: 'inventario' },
  { id: 'F03', title: 'Incumplimiento de protocolos',desc: 'Personal sin EPP o sin seguir procedimientos.', icon: '⚠️', color: '#ede9fe', count: 21, stores: ['T002','T004','T006'], category: 'seguridad'  },
  { id: 'F04', title: 'Atención al cliente',         desc: 'Tiempos de espera superiores a 5 minutos.', icon: '👥', color: '#e6f4ed', count: 18, stores: ['T003','T007'], category: 'atencion'   },
  { id: 'F05', title: 'Higiene y limpieza',          desc: 'Áreas comunes o almacén con suciedad visible.', icon: '🧹', color: '#e8f1fd', count: 15, stores: ['T006','T003'], category: 'higiene'    },
]

export const MOCK_KPI_DATA: KpiData = {
  totalStores: 8, audited: 7, avgScore: 78.5, criticalCount: 2,
  cards: [
    { id: 'stores',   label: 'Total Tiendas',  value: 8,      delta: '+1 este mes',          deltaType: 'up',   icon: '🏪', color: '#111' },
    { id: 'audited',  label: 'Auditadas',       value: 7,      delta: '87.5% cobertura',      deltaType: 'up',   icon: '✅', color: '#1a6b3a' },
    { id: 'score',    label: 'Score Promedio',  value: '78.5', delta: '+2.1 vs mes anterior', deltaType: 'up',   icon: '📊', color: '#111' },
    { id: 'critical', label: 'Críticas',        value: 2,      delta: 'Requieren acción',     deltaType: 'warn', icon: '⚠️', color: '#7a5200' },
    { id: 'findings', label: 'Hallazgos',       value: 31,     delta: '-4 vs mes anterior',   deltaType: 'up',   icon: '🔍', color: '#8b1a1a' },
  ],
  gauges: [
    { label: 'Cumplimiento', value: 82,   max: 100, delta: '+3.2% mes', color: '#1a6b3a' },
    { label: 'Cobertura',    value: 87.5, max: 100, delta: '+12.5%',    color: '#111'    },
  ],
  weeklyChart: [
    { label: 'Lun', value: 3 }, { label: 'Mar', value: 5 }, { label: 'Mié', value: 2 },
    { label: 'Jue', value: 7 }, { label: 'Vie', value: 4 }, { label: 'Sáb', value: 6 }, { label: 'Dom', value: 1 },
  ],
}
