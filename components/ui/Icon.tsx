'use client'

type IconName =
  | 'home' | 'store' | 'search' | 'alert' | 'trophy' | 'calendar'
  | 'arrow-left' | 'arrow-right' | 'chevron-down' | 'chevron-up'
  | 'export' | 'user' | 'logout' | 'check' | 'x' | 'dot'
  | 'building' | 'pin' | 'clipboard' | 'wifi' | 'wifi-off'
  | 'trending-up' | 'trending-down' | 'minus' | 'eye' | 'filter'

const PATHS: Record<IconName, string> = {
  home:         'M3 10.5 L8 5 L13 10.5 M4.5 9.5 L4.5 14 L11.5 14 L11.5 9.5 M6.5 14 L6.5 11 L9.5 11 L9.5 14',
  store:        'M2 7 L8 2 L14 7 L14 14 L2 14 Z M6 14 L6 10 L10 10 L10 14 M2 7 L14 7',
  search:       'M7 12 A5 5 0 1 0 7 2 A5 5 0 1 0 7 12 Z M11 11 L14 14',
  alert:        'M8 3 L14 13 L2 13 Z M8 7 L8 10 M8 11.5 L8 12',
  trophy:       'M5 2 L11 2 L11 7 A3 3 0 0 1 5 7 Z M3 2 L5 2 L5 5 A2 2 0 0 1 3 5 Z M13 2 L11 2 L11 5 A2 2 0 0 1 13 5 Z M8 10 L8 13 M5.5 13 L10.5 13',
  calendar:     'M2 5 L14 5 L14 14 L2 14 Z M2 5 L2 3 L14 3 L14 5 M5 3 L5 1 M11 3 L11 1 M2 8 L14 8 M5 11 L5 11.1 M8 11 L8 11.1 M11 11 L11 11.1',
  'arrow-left': 'M11 8 L3 8 M7 4 L3 8 L7 12',
  'arrow-right':'M5 8 L13 8 M9 4 L13 8 L9 12',
  'chevron-down':'M3 5.5 L8 10.5 L13 5.5',
  'chevron-up':  'M3 10.5 L8 5.5 L13 10.5',
  export:       'M8 2 L8 11 M4 7 L8 11 L12 7 M2 12 L2 14 L14 14 L14 12',
  user:         'M8 7 A3 3 0 1 0 8 1 A3 3 0 1 0 8 7 Z M2 15 A6 6 0 0 1 14 15',
  logout:       'M6 2 L2 2 L2 14 L6 14 M10 5 L14 8 L10 11 M14 8 L6 8',
  check:        'M2 8 L6 12 L14 4',
  x:            'M3 3 L13 13 M13 3 L3 13',
  dot:          'M8 8 A1.5 1.5 0 1 0 8 5 A1.5 1.5 0 1 0 8 8 Z',
  building:     'M2 14 L2 4 L9 2 L9 14 M9 14 L9 6 L14 6 L14 14 M5 6 L5 6.1 M5 9 L5 9.1 M5 12 L5 12.1 M11.5 9 L11.5 9.1 M11.5 12 L11.5 12.1 M2 14 L14 14',
  pin:          'M8 1 A4 4 0 0 1 12 5 C12 9 8 13 8 13 C8 13 4 9 4 5 A4 4 0 0 1 8 1 Z M8 5 A1.5 1.5 0 1 0 8 2 A1.5 1.5 0 1 0 8 5',
  clipboard:    'M6 2 L10 2 A1 1 0 0 1 10 4 L6 4 A1 1 0 0 1 6 2 Z M4 3 L3 3 A1 1 0 0 0 2 4 L2 14 A1 1 0 0 0 3 15 L13 15 A1 1 0 0 0 14 14 L14 4 A1 1 0 0 0 13 3 L12 3 M5 8 L11 8 M5 11 L9 11',
  wifi:         'M1 6 A10 10 0 0 1 15 6 M3.5 8.5 A6 6 0 0 1 12.5 8.5 M6 11 A3 3 0 0 1 10 11 M8 13.5 A.75.75 0 1 0 8 12 A.75.75 0 1 0 8 13.5',
  'wifi-off':   'M1 1 L15 15 M8 13.5 A.75.75 0 1 0 8 12 A.75.75 0 1 0 8 13.5 M10 11 A3 3 0 0 0 6.2 9.5 M12.5 8.5 A6 6 0 0 0 4 7.5 M3.5 4.5 A9.5 9.5 0 0 0 1 6',
  'trending-up':'M1 12 L6 6 L9 9 L15 3 M10 3 L15 3 L15 8',
  'trending-down':'M1 4 L6 10 L9 7 L15 13 M10 13 L15 13 L15 8',
  minus:        'M3 8 L13 8',
  eye:          'M1 8 A7 7 0 0 1 15 8 A7 7 0 0 1 1 8 Z M8 10 A2 2 0 1 0 8 6 A2 2 0 1 0 8 10',
  filter:       'M1 3 L15 3 M3 8 L13 8 M5.5 13 L10.5 13',
}

interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

export default function Icon({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]?.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={`M${seg.trimEnd()}`} />
      ))}
    </svg>
  )
}
