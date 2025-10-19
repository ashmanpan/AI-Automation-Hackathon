import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Navbar, Sidebar } from '@/components/common'

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users/import', label: 'Import Users', icon: '📥' },
    { path: '/admin/teams', label: 'Manage Teams', icon: '🏆' },
    { path: '/admin/exercises', label: 'Manage Exercises', icon: '📝' },
    { path: '/admin/submissions', label: 'Submissions', icon: '📨' },
    { path: '/admin/leaderboard', label: 'Leaderboard', icon: '🏅' },
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

export default AdminLayout
