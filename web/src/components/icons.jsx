const svg = (path, { viewBox = '0 0 16 16', fill = 'currentColor' } = {}) =>
  ({ size = 16, style, className }) => (
    <svg width={size} height={size} viewBox={viewBox} fill={fill}
      style={style} className={className}>
      {path}
    </svg>
  )

export const DashboardIcon = svg(
  <>
    <rect x="1" y="1" width="6" height="6" rx="1.5"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5"/>
  </>
)

export const NutritionIcon = svg(
  <>
    <path d="M8 1C5.2 1 3 3.2 3 6c0 2 1.2 3.8 3 4.7V13h-.5a.5.5 0 000 1h5a.5.5 0 000-1H10v-2.3c1.8-.9 3-2.7 3-4.7 0-2.8-2.2-5-5-5zm0 1.5a3.5 3.5 0 010 7 3.5 3.5 0 010-7z"/>
    <path d="M6 5.5C6 4.1 7 3 8 3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const WearableIcon = svg(
  <>
    <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5v3l2 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="5.5" y=".5" width="5" height="2" rx="1" fill="currentColor"/>
    <rect x="5.5" y="13.5" width="5" height="2" rx="1" fill="currentColor"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const ReportsIcon = svg(
  <>
    <rect x="2" y="1" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 5h6M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const CoachIcon = svg(
  <>
    <path d="M8 1l1.5 3.5L13 5.5 10.5 8l.5 3.5L8 9.5 5 11.5l.5-3.5L3 5.5l3.5-1z"
      fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const SettingsIcon = svg(
  <>
    <path d="M8 5a3 3 0 100 6A3 3 0 008 5z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.7 3.3l-1 1M4.3 11.7l-1 1M12.7 12.7l-1-1M4.3 4.3l-1-1"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const BellIcon = svg(
  <>
    <path d="M8 1a5 5 0 00-5 5v3L1.5 11h13L13 9V6a5 5 0 00-5-5z"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M6.5 11.5a1.5 1.5 0 003 0" fill="none" stroke="currentColor" strokeWidth="1.5"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const SearchIcon = svg(
  <>
    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const ChevronDownIcon = svg(
  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
  { fill: 'none', viewBox: '0 0 16 16' }
)

export const LogoIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="#13b88a"/>
    <path d="M7 19l4.5-9 3 5.5 2-3.5 4.5 7" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
