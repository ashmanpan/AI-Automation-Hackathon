import { CSSProperties } from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  className?: string
  style?: CSSProperties
}

export const Badge = ({ children, variant = 'primary', className = '', style }: BadgeProps) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {children}
    </span>
  )
}

// Status badge for exercise/submission status
interface StatusBadgeProps {
  status: 'draft' | 'active' | 'completed' | 'pending' | 'graded' | 'submitted' | 'in-progress'
  className?: string
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const variantMap: Record<typeof status, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    'draft': 'secondary',
    'active': 'info',
    'completed': 'success',
    'pending': 'warning',
    'graded': 'success',
    'submitted': 'info',
    'in-progress': 'primary'
  }

  return (
    <Badge variant={variantMap[status]} className={className}>
      {status.replace('-', ' ')}
    </Badge>
  )
}
