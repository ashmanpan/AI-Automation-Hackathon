import api from './api'
import {
  Exercise,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  Flag,
  CreateFlagRequest,
  Hint,
  CreateHintRequest,
  Attachment,
} from '@/types/exercise.types'

/**
 * Exercise Service
 * Handles all exercise-related API calls
 */
class ExerciseService {
  /**
   * Get all exercises
   */
  async getAll(params?: { category?: string; difficulty?: string; is_active?: boolean; hackathon_id?: number }): Promise<Exercise[]> {
    const response = await api.get<{ exercises: Exercise[] }>('/api/exercises', { params })
    return response.data.exercises
  }

  /**
   * Get exercise by ID
   */
  async getById(id: number): Promise<Exercise> {
    const response = await api.get<{ exercise: Exercise }>(`/api/exercises/${id}`)
    return response.data.exercise
  }

  /**
   * Create new exercise
   */
  async create(data: CreateExerciseRequest): Promise<Exercise> {
    const response = await api.post<{ exercise: Exercise }>('/api/exercises', data)
    return response.data.exercise
  }

  /**
   * Update exercise
   */
  async update(id: number, data: UpdateExerciseRequest): Promise<Exercise> {
    const response = await api.put<{ exercise: Exercise }>(`/api/exercises/${id}`, data)
    return response.data.exercise
  }

  /**
   * Delete exercise
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/exercises/${id}`)
  }

  /**
   * Update exercise status (draft, active, completed, cancelled)
   */
  async updateStatus(id: number, status: 'draft' | 'active' | 'completed' | 'cancelled'): Promise<Exercise> {
    const response = await api.patch<{ exercise: Exercise }>(`/api/exercises/${id}/status`, { status })
    return response.data.exercise
  }

  /**
   * Get exercise flags (admin only)
   */
  async getFlags(exerciseId: number): Promise<Flag[]> {
    const response = await api.get<{ flags: Flag[] }>(`/api/exercises/${exerciseId}/flags`)
    return response.data.flags
  }

  /**
   * Add flag to exercise
   */
  async addFlag(exerciseId: number, data: CreateFlagRequest): Promise<Flag> {
    const response = await api.post<{ flag: Flag }>(`/api/exercises/${exerciseId}/flags`, data)
    return response.data.flag
  }

  /**
   * Delete flag
   */
  async deleteFlag(exerciseId: number, flagId: number): Promise<void> {
    await api.delete(`/api/exercises/${exerciseId}/flags/${flagId}`)
  }

  /**
   * Get exercise hints
   */
  async getHints(exerciseId: number): Promise<Hint[]> {
    const response = await api.get<{ hints: Hint[] }>(`/api/exercises/${exerciseId}/hints`)
    return response.data.hints
  }

  /**
   * Add hint to exercise
   */
  async addHint(exerciseId: number, data: CreateHintRequest): Promise<Hint> {
    const response = await api.post<{ hint: Hint }>(`/api/exercises/${exerciseId}/hints`, data)
    return response.data.hint
  }

  /**
   * Delete hint
   */
  async deleteHint(exerciseId: number, hintId: number): Promise<void> {
    await api.delete(`/api/exercises/${exerciseId}/hints/${hintId}`)
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(exerciseId: number, file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<{ attachment: Attachment }>(
      `/api/exercises/${exerciseId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.attachment
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(exerciseId: number, attachmentId: number): Promise<void> {
    await api.delete(`/api/exercises/${exerciseId}/attachments/${attachmentId}`)
  }

  /**
   * Get exercise categories
   */
  async getCategories(): Promise<string[]> {
    const response = await api.get<{ categories: string[] }>('/api/exercises/categories')
    return response.data.categories
  }
}

export default new ExerciseService()
