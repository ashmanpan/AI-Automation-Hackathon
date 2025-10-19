import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/common'
import { ReactNode, useEffect, useState } from 'react'
import authService from '@/services/auth.service'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('admin' | 'judge' | 'participant')[]
  requireAuth?: boolean
}

/**
 * Protected Route Component
 * Handles authentication and role-based access control
 */
export const ProtectedRoute = ({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, token, initialize } = useAuthStore()
  const location = useLocation()
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize auth on mount
  useEffect(() => {
    initialize()
    setIsInitializing(false)
  }, [initialize])

  // Show loading while initializing
  if (isInitializing) {
    return <LoadingSpinner fullScreen text="Loading..." />
  }

  // Check if authentication is required
  if (requireAuth && !token) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      // User doesn't have required role
      // Redirect to their default dashboard
      const redirectPath = user ? authService.getDefaultRedirect() : '/login'
      return <Navigate to={redirectPath} replace />
    }
  }

  // User is authenticated and has required role
  return <>{children}</>
}

/**
 * Admin Only Route
 */
export const AdminRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
}

/**
 * Judge Only Route
 */
export const JudgeRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute allowedRoles={['judge']}>{children}</ProtectedRoute>
}

/**
 * Participant Only Route
 */
export const ParticipantRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute allowedRoles={['participant']}>{children}</ProtectedRoute>
}

/**
 * Admin or Judge Route
 */
export const AdminOrJudgeRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute allowedRoles={['admin', 'judge']}>{children}</ProtectedRoute>
}
