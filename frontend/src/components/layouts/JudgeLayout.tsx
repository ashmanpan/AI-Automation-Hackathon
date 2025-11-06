import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Navbar, Sidebar } from '@/components/common'

interface JudgeLayoutProps {
  children: ReactNode
}

const JudgeLayout = ({ children }: JudgeLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navItems = [
    { path: '/judge/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/judge/queue', label: 'Grading Queue', icon: '📝' },
    { path: '/judge/history', label: 'Grading History', icon: '📜' },
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

export default JudgeLayout
