import { ReactNode } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export const LoadingSpinner = ({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) => {
  const spinnerClass = `spinner ${size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''}`

  if (fullScreen) {
    return (
      <div className="loading-overlay animate-fade-in">
        <div className={spinnerClass}></div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
      <div className={spinnerClass}></div>
      {text && <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>{text}</p>}
    </div>
  )
}

// Skeleton Loader for better UX
interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'card'
  count?: number
  className?: string
}

export const Skeleton = ({ variant = 'text', count = 1, className = '' }: SkeletonProps) => {
  const skeletonClass = `skeleton ${variant === 'text' ? 'skeleton-text' : variant === 'title' ? 'skeleton-title' : variant === 'avatar' ? 'skeleton-avatar' : ''} ${className}`

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass}></div>
      ))}
    </>
  )
}

// Card Skeleton for loading states
export const CardSkeleton = () => {
  return (
    <div className="card">
      <Skeleton variant="title" />
      <Skeleton variant="text" count={3} />
    </div>
  )
}

// Loading wrapper
interface LoadingProps {
  loading: boolean
  children: ReactNode
  fallback?: ReactNode
}

export const Loading = ({ loading, children, fallback }: LoadingProps) => {
  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>
  }

  return <>{children}</>
}
