import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useProfile } from '../context/ProfileContext.jsx'
import Onboarding from '../pages/Onboarding.jsx'

export default function Layout() {
  const { profile, saveProfile } = useProfile()

  // First-time user — show full-screen onboarding instead of the app shell
  if (!profile) {
    return <Onboarding onSave={saveProfile} />
  }

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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
