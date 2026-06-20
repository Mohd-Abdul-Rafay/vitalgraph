import { NavLink } from 'react-router-dom'
import {
  LogoIcon, DashboardIcon, NutritionIcon,
  WearableIcon, ReportsIcon, CoachIcon, SettingsIcon,
} from './icons'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/nutrition',  label: 'Nutrition',  Icon: NutritionIcon },
]

const SOON = [
  { to: '/wearable', label: 'Wearable',  Icon: WearableIcon },
  { to: '/reports',  label: 'Reports',   Icon: ReportsIcon  },
  { to: '/coach',    label: 'AI Coach',  Icon: CoachIcon    },
]

function NavItem({ to, label, Icon }) {
  return (
    <NavLink to={to} end
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        marginBottom: 2, fontSize: 13.5,
        fontWeight: isActive ? 650 : 450,
        color: isActive ? 'var(--nav-active-text)' : 'var(--txt2)',
        background: isActive ? 'var(--nav-active-bg)' : 'transparent',
        transition: 'background .12s, color .12s',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{
            flexShrink: 0,
            color: isActive ? 'var(--nav-active-text)' : 'var(--txt2)',
            opacity: isActive ? 1 : 0.85,
          }} />
          <span style={{ flex: 1 }}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SoonItem({ to, label, Icon }) {
  return (
    <NavLink to={to} end
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        marginBottom: 2, fontSize: 13.5,
        fontWeight: isActive ? 650 : 450,
        color: isActive ? 'var(--violet-dark)' : 'var(--txt2)',
        background: isActive ? 'var(--violet-soft)' : 'transparent',
        transition: 'background .12s, color .12s',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{
            flexShrink: 0,
            color: isActive ? 'var(--violet)' : 'var(--txt2)',
            opacity: isActive ? 1 : 0.75,
          }} />
          <span style={{ flex: 1 }}>{label}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: .7,
            textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
            color: 'var(--violet-dark)', background: 'var(--violet-soft)',
            border: '1px solid var(--violet-mid)', flexShrink: 0,
          }}>soon</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-w)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ boxShadow: '0 2px 8px rgba(19,184,138,.28)', borderRadius: 7, lineHeight: 0 }}>
          <LogoIcon size={28} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', letterSpacing: -.3 }}>
          VitalGraph
        </span>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '12px 10px 0', flex: 1, overflow: 'auto' }}>
        {NAV.map(item => <NavItem key={item.to} {...item} />)}

        {/* Coming soon section */}
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: .9,
          textTransform: 'uppercase', color: 'var(--txt3)',
          padding: '18px 14px 7px',
        }}>
          Coming soon
        </div>
        {SOON.map(item => <SoonItem key={item.to} {...item} />)}
      </nav>

      {/* Settings pinned to bottom */}
      <div style={{ padding: '10px 10px 14px', borderTop: '1px solid var(--border)' }}>
        <NavItem to="/settings" label="Settings" Icon={SettingsIcon} />
      </div>
    </div>
  )
}
