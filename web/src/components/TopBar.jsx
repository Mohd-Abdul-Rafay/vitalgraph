import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon, BellIcon, ChevronDownIcon } from './icons'

const USER = {
  name: 'Abdul Rafay',
  initials: 'AR',
  email: 'mohdabdulrafayofficial@gmail.com',
  subtitle: 'Recomp · 2,000 kcal',
}

function Avatar({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--violet-soft)', color: 'var(--violet)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * .35, fontWeight: 700, flexShrink: 0,
      letterSpacing: -.5,
    }}>
      {USER.initials}
    </div>
  )
}

function ProfileDropdown({ onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const go = (path) => { navigate(path); onClose() }

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', fontSize: 13.5, color: 'var(--txt)',
    cursor: 'pointer', borderRadius: 'var(--radius-sm)',
    transition: 'background .1s',
  }
  const hover = { background: 'var(--surface2)' }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: 230, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
      padding: '6px',
    }}>
      {/* Profile header */}
      <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Avatar size={36} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt)' }}>{USER.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 1 }}>{USER.subtitle}</div>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--txt3)', wordBreak: 'break-all' }}>{USER.email}</div>
      </div>

      {[
        { label: 'My profile',         path: '/profile'  },
        { label: 'My plan & targets',  path: '/nutrition' },
        { label: 'Settings',           path: '/settings'  },
      ].map(item => (
        <button key={item.path}
          style={{ ...itemStyle, width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
          onMouseEnter={e => Object.assign(e.currentTarget.style, hover)}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => go(item.path)}>
          {item.label}
        </button>
      ))}

      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

      <button
        style={{ ...itemStyle, width: '100%', textAlign: 'left', color: 'var(--coral)', border: 'none', background: 'none' }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'var(--coral-soft)' })}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
        onClick={onClose}>
        Sign out
      </button>
    </div>
  )
}

export default function TopBar() {
  const [dropOpen, setDropOpen] = useState(false)

  return (
    <div style={{
      height: 'var(--topbar-h)', background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16, flexShrink: 0,
    }}>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <SearchIcon size={14} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--txt3)', pointerEvents: 'none',
        }} />
        <input placeholder="Search…" style={{
          width: '100%', height: 34, paddingLeft: 32, paddingRight: 12,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', color: 'var(--txt)',
          outline: 'none', transition: 'border-color .15s',
        }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Bell */}
        <button style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: 'var(--radius-sm)',
          color: 'var(--txt2)', background: 'none',
          transition: 'background .12s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <BellIcon size={16} />
        </button>

        {/* Profile trigger */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 6px', borderRadius: 'var(--radius-sm)',
              background: dropOpen ? 'var(--surface2)' : 'none',
              border: '1px solid', borderColor: dropOpen ? 'var(--border2)' : 'transparent',
              transition: 'background .12s, border-color .12s', color: 'var(--txt)',
            }}
            onMouseEnter={e => { if (!dropOpen) e.currentTarget.style.background = 'var(--surface2)' }}
            onMouseLeave={e => { if (!dropOpen) e.currentTarget.style.background = 'none' }}
          >
            <Avatar size={28} />
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{USER.name}</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{USER.subtitle}</div>
            </div>
            <ChevronDownIcon size={14} style={{
              color: 'var(--txt3)',
              transform: dropOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform .15s',
            }} />
          </button>

          {dropOpen && <ProfileDropdown onClose={() => setDropOpen(false)} />}
        </div>
      </div>
    </div>
  )
}
