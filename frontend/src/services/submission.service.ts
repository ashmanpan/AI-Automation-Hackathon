import api from './api'
import {
  Submission,
  SubmitFlagRequest,
  SubmitFlagResponse,
  GradingQueue,
  GradeSubmissionRequest,
} from '@/types/submission.types'

/**
 * Submission Service
 * Handles all submission-related API calls
 */
class SubmissionService {
  /**
   * Submit a flag for grading
   */
  async submitFlag(data: SubmitFlagRequest): Promise<SubmitFlagResponse> {
    const response = await api.post<SubmitFlagResponse>('/api/submissions', data)
    return response.data
  }

  /**
   * Get all submissions (admin/judge)
   */
  async getAll(params?: {
    exercise_id?: number
    team_id?: number
    user_id?: number
    is_correct?: boolean
  }): Promise<Submission[]> {
    const response = await api.get<{ submissions: Submission[] }>('/api/submissions', { params })
    return response.data.submissions
  }

  /**
   * Get submission by ID
   */
  async getById(id: number): Promise<Submission> {
    const response = await api.get<{ submission: Submission }>(`/api/submissions/${id}`)
    return response.data.submission
  }

  /**
   * Get team submissions
   */
  async getTeamSubmissions(teamId: number): Promise<Submission[]> {
    const response = await api.get<{ submissions: Submission[] }>(`/api/teams/${teamId}/submissions`)
    return response.data.submissions
  }

  /**
   * Get grading queue (judge)
   */
  async getGradingQueue(params?: { priority?: string; limit?: number }): Promise<GradingQueue[]> {
    const response = await api.get<{ queue: GradingQueue[] }>('/api/submissions/grading-queue', { params })
    return response.data.queue
  }

  /**
   * Grade a submission (judge)
   */
  async gradeSubmission(data: GradeSubmissionRequest): Promise<Submission> {
    const response = await api.post<{ submission: Submission }>('/api/submissions/grade', data)
    return response.data.submission
  }

  /**
   * Get submission statistics
   */
  async getStats(): Promise<{
    total_submissions: number
    correct_submissions: number
    pending_submissions: number
    avg_points: number
  }> {
    const response = await api.get('/api/submissions/stats')
    return response.data
  }
}

export default new SubmissionService()
