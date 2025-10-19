import { ReactNode, CSSProperties } from 'react'

interface AlertProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info'
  className?: string
  style?: CSSProperties
  onClose?: () => void
}

export const Alert = ({ children, variant = 'info', className = '', style, onClose }: AlertProps) => {
  return (
    <div className={`alert alert-${variant} ${className}`} style={{ position: 'relative', ...style }}>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--spacing-sm)',
            right: 'var(--spacing-sm)',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 'var(--font-size-xl)',
            lineHeight: 1,
            padding: 0,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  )
}
