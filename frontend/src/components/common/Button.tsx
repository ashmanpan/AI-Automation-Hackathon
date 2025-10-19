import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  icon?: boolean
  loading?: boolean
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
    icon ? 'btn-icon' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner spinner-sm" style={{ marginRight: '0.5rem' }}></span>
      )}
      {children}
    </button>
  )
}
