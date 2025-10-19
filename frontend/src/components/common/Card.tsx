import { ReactNode, CSSProperties, MouseEventHandler } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  compact?: boolean
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
}

export const Card = ({ children, className = '', hover = true, compact = false, style, onClick }: CardProps) => {
  const classes = [
    'card',
    compact ? 'card-compact' : '',
    hover ? 'hover-lift' : '',
    className
  ].filter(Boolean).join(' ')

  return <div className={classes} style={style} onClick={onClick}>{children}</div>
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export const CardHeader = ({ title, subtitle, action }: CardHeaderProps) => {
  return (
    <div className="card-header">
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
}

export const CardBody = ({ children }: CardBodyProps) => {
  return <div className="card-body">{children}</div>
}

interface CardFooterProps {
  children: ReactNode
}

export const CardFooter = ({ children }: CardFooterProps) => {
  return <div className="card-footer">{children}</div>
}

// Stats Card variant
interface StatsCardProps {
  title: string
  value: string | number
  icon?: string
  variant?: 'success' | 'info' | 'warning' | 'error'
  trend?: {
    value: number | string
    label: string
    type?: 'success' | 'warning' | 'error'
  }
  className?: string
}

export const StatsCard = ({ title, value, icon, variant, trend, className = '' }: StatsCardProps) => {
  return (
    <Card className={`stats-card ${className}`} compact>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
          {title}
        </div>
        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }} className={variant ? 'gradient-text' : ''}>
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: 'var(--font-size-sm)', color: trend.type === 'warning' ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
          {trend.value} {trend.label}
        </div>
      )}
    </Card>
  )
}
