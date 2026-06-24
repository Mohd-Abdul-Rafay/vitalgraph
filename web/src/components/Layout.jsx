import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useProfile } from '../context/ProfileContext.jsx'
import Onboarding from '../pages/Onboarding.jsx'
import { CONTENT_WIDTH_WIDE, CONTENT_WIDTH_NARROW } from '../lib/widths.js'

// Paths that use the narrow (form/editor) tier. All others default to wide.
const NARROW_PATHS = new Set(['/plan', '/profile'])

export default function Layout() {
  const { profile, saveProfile } = useProfile()
  const { pathname } = useLocation()

  // First-time user — show full-screen onboarding instead of the app shell
  if (!profile) {
    return <Onboarding onSave={saveProfile} />
  }

  const contentWidth = NARROW_PATHS.has(pathname) ? CONTENT_WIDTH_NARROW : CONTENT_WIDTH_WIDE

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-w)', flex: 1,
        display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
        <TopBar />
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '32px 36px',
          background: 'var(--bg)',
        }}>
          <div style={{ maxWidth: contentWidth, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
