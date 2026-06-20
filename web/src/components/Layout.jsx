import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 36px',
          background: 'var(--bg)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
