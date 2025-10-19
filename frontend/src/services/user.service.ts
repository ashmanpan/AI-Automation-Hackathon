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
   * Bulk import users from CSV/JSON
   */
  async bulkImport(users: BulkImportUser[]): Promise<BulkImportResponse> {
    const response = await api.post<BulkImportResponse>('/api/users/bulk-import', { users })
    return response.data
  }

  /**
   * Download user template CSV
   */
  async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/api/users/import-template', {
      responseType: 'blob',
    })
    return response.data
  }

  /**
   * Reset user password (admin)
   */
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    await api.post(`/api/users/${userId}/reset-password`, { password: newPassword })
  }
}

export default new UserService()
