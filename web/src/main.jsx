import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { ProfileProvider } from './context/ProfileContext.jsx'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Plan from './pages/Plan'
import Wearable from './pages/Wearable'
import Reports from './pages/Reports'
import Coach from './pages/Coach'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="plan"      element={<Plan />} />
            <Route path="wearable"  element={<Wearable />} />
            <Route path="reports"   element={<Reports />} />
            <Route path="coach"     element={<Coach />} />
            <Route path="settings"  element={<Settings />} />
            <Route path="profile"   element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  </StrictMode>,
)
