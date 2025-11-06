import { Link } from 'react-router-dom'
import { ReactNode } from 'react'
import { User } from '@/types/user.types'

interface NavbarProps {
  children?: ReactNode
  title?: string
  user?: User | null
  onLogout?: () => void
}

export const Navbar = ({ children, title = 'Hackathon Platform', user, onLogout }: NavbarProps) => {
  return (
    <nav
      style={{
        background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--spacing-md) var(--spacing-xl)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-dropdown)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="container flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-md">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <img
              src="/cisco-logo-white.png"
              alt="Cisco Logo"
              style={{ height: '32px', width: 'auto' }}
            />
            <h2 className="gradient-text" style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
              {title}
            </h2>
          </Link>
        </div>

        {/* Center Content */}
        <div className="flex items-center gap-lg">
          {children}
        </div>

        {/* User Menu */}
        {user && (
          <div className="flex items-center gap-md">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                <span className={`badge badge-${user.role === 'admin' ? 'warning' : user.role === 'judge' ? 'info' : 'primary'}`}>
                  {user.role}
                </span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn btn-ghost btn-sm"
                style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
