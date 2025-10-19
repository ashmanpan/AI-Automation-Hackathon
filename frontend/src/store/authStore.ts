import { create } from 'zustand'
import { User, LoginRequest } from '@/types/user.types'
import authService from '@/services/auth.service'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  clearError: () => void
  initialize: () => void
}

/**
 * Auth Store using Zustand
 * Manages authentication state globally
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  /**
   * Initialize auth state from localStorage
   * Call this on app startup
   */
  initialize: () => {
    const token = authService.getToken()
    const user = authService.getCurrentUser()

    if (token && user) {
      set({ token, user })

      // Optionally validate token by fetching current user
      get().refreshUser().catch(() => {
        // Token invalid, logout
        get().logout()
      })
    }
  },

  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<boolean> => {
    set({ isLoading: true, error: null })

    try {
      const response = await authService.login(credentials)

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        error: null,
      })

      toast.success(`Welcome back, ${response.user.full_name || response.user.username}!`)
      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.'

      set({
        user: null,
        token: null,
        isLoading: false,
        error: errorMessage,
      })

      toast.error(errorMessage)
      return false
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    authService.logout()

    set({
      user: null,
      token: null,
      error: null,
    })

    toast.success('Logged out successfully')
  },

  /**
   * Refresh user data from API
   */
  refreshUser: async () => {
    try {
      const user = await authService.me()
      set({ user })
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null })
  },
}))

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  return !!user && !!token
}

/**
 * Hook to check user role
 */
export const useHasRole = (role: 'admin' | 'judge' | 'participant') => {
  const user = useAuthStore((state) => state.user)
  return user?.role === role
}

/**
 * Hook to get current user
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user)
}
