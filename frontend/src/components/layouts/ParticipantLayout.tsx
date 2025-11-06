import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Navbar, Sidebar } from '@/components/common'

interface ParticipantLayoutProps {
  children: ReactNode
}

const ParticipantLayout = ({ children }: ParticipantLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navItems = [
    { path: '/participant/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/participant/exercises', label: 'Browse Exercises', icon: '📝' },
    { path: '/participant/submissions', label: 'My Submissions', icon: '📨' },
    { path: '/participant/guide', label: 'User Guide', icon: '📖' },
    // { path: '/leaderboard', label: 'Leaderboard', icon: '🏅' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          items={navItems}
          currentPath={location.pathname}
          onNavigate={navigate}
        />

        <main style={{ flex: 1, padding: 'var(--spacing-xl)', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default ParticipantLayout
