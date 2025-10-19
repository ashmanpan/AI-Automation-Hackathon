import api from './api'
import { LoginRequest, LoginResponse, User, ChangePasswordRequest } from '@/types/user.types'

/**
 * Authentication Service
 * Works for both On-Prem and AWS Amplify
 */

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials)

    // Store token and user in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      return null
    }
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token')
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  /**
   * Get current user from API (validate token)
   */
  async me(): Promise<User> {
    const response = await api.get<{ user: User }>('/api/auth/me')

    // Update localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data.user
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post('/api/auth/change-password', data)
  }

  /**
   * Check user role
   */
  hasRole(role: 'admin' | 'judge' | 'participant'): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  /**
   * Check if user is judge
   */
  isJudge(): boolean {
    return this.hasRole('judge')
  }

  /**
   * Check if user is participant
   */
  isParticipant(): boolean {
    return this.hasRole('participant')
  }

  /**
   * Get redirect path based on user role
   */
  getDefaultRedirect(): string {
    const user = this.getCurrentUser()

    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard'
      case 'judge':
        return '/judge/dashboard'
      case 'participant':
        return '/participant/dashboard'
      default:
        return '/login'
    }
  }
}

export default new AuthService()
