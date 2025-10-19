import { NavLink } from 'react-router-dom'
import { ReactNode } from 'react'

interface SidebarItem {
  to?: string
  path?: string
  icon?: ReactNode | string
  label: string
  badge?: string | number
}

interface SidebarProps {
  items: SidebarItem[]
  title?: string
  currentPath?: string
  onNavigate?: (path: string) => void
}

export const Sidebar = ({ items, title, currentPath, onNavigate }: SidebarProps) => {
  const renderIcon = (icon: ReactNode | string | undefined) => {
    if (!icon) return null
    if (typeof icon === 'string') return <span>{icon}</span>
    return <span>{icon}</span>
  }

  return (
    <aside
      style={{
        width: '260px',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        padding: 'var(--spacing-xl)',
      }}
      className="hide-mobile"
    >
      {title && (
        <h3 className="gradient-text" style={{ marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-xl)' }}>
          {title}
        </h3>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {items.map((item) => {
          const itemPath = item.to || item.path || ''
          const isActive = currentPath ? currentPath.startsWith(itemPath) : false

          if (onNavigate) {
            return (
              <button
                key={itemPath}
                onClick={() => onNavigate(itemPath)}
                className={`flex items-center justify-between gap-md ${isActive ? 'sidebar-link-active' : 'sidebar-link'}`}
                style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                  fontWeight: 500,
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-md">
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="badge badge-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          }

          return (
            <NavLink
              key={itemPath}
              to={itemPath}
              className={({ isActive }) =>
                `flex items-center justify-between gap-md ${isActive ? 'sidebar-link-active' : 'sidebar-link'}`
              }
              style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
                fontWeight: 500,
              }}
            >
              <div className="flex items-center gap-md">
                {renderIcon(item.icon)}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="badge badge-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <style>{`
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--color-text-primary);
        }

        .sidebar-link-active {
          background: linear-gradient(90deg, rgba(0, 255, 136, 0.1), rgba(0, 170, 255, 0.1));
          border-left: 3px solid var(--color-accent-mint);
          color: var(--color-text-primary);
          font-weight: 600;
        }
      `}</style>
    </aside>
  )
}

// Layout wrapper with sidebar
interface LayoutWithSidebarProps {
  sidebar: ReactNode
  children: ReactNode
  navbar?: ReactNode
}

export const LayoutWithSidebar = ({ sidebar, children, navbar }: LayoutWithSidebarProps) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {navbar}
      <div style={{ display: 'flex', flex: 1 }}>
        {sidebar}
        <main style={{ flex: 1, padding: 'var(--spacing-2xl)', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
