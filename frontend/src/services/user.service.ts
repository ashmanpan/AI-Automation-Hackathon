import api from './api'
import { User } from '@/types/user.types'

export interface CreateUserRequest {
  username: string
  password: string
  full_name?: string
  email?: string
  role: 'admin' | 'judge' | 'participant'
}

export interface UpdateUserRequest {
  full_name?: string
  email?: string
  role?: 'admin' | 'judge' | 'participant'
}

export interface BulkImportUser {
  username: string
  password: string
  full_name?: string
  email?: string
  role: 'admin' | 'judge' | 'participant'
}

export interface BulkImportResponse {
  success: boolean
  imported_count: number
  failed_count: number
  errors?: Array<{
    row: number
    username: string
    error: string
  }>
}

/**
 * User Service
 * Handles user management API calls (admin only)
 */
class UserService {
  /**
   * Get all users
   */
  async getAll(params?: { role?: string; search?: string }): Promise<User[]> {
    const response = await api.get<{ users: User[] }>('/api/users', { params })
    return response.data.users
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    const response = await api.get<{ user: User }>(`/api/users/${id}`)
    return response.data.user
  }

  /**
   * Create new user
   */
  async create(data: CreateUserRequest): Promise<User> {
    const response = await api.post<{ user: User }>('/api/users', data)
    return response.data.user
  }

  /**
   * Update user
   */
  async update(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await api.put<{ user: User }>(`/api/users/${id}`, data)
    return response.data.user
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/users/${id}`)
  }

  /**
   * Bulk import users from CSV file (auto-generates credentials)
   */
  async bulkImport(file: File): Promise<{
    message: string
    credentials: Array<{
      id: number
      username: string
      password: string
      full_name: string
      email: string | null
      role: string
    }>
  }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/api/users/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  /**
   * Download user template CSV
   */
  async downloadTemplate(): Promise<Blob> {
    // Generate template client-side since backend doesn't have this endpoint
    const csvContent = 'full_name,email,role\nJohn Doe,john@example.com,participant\nJane Smith,jane@example.com,judge\n'
    return new Blob([csvContent], { type: 'text/csv' })
  }

  /**
   * Reset user password (admin)
   */
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    await api.post(`/api/users/${userId}/reset-password`, { password: newPassword })
  }
}

export default new UserService()
