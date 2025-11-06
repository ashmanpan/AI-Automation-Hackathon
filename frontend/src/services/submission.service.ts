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
   * Submit a flag for grading (deprecated - kept for backwards compatibility)
   */
  async submitFlag(data: SubmitFlagRequest): Promise<SubmitFlagResponse> {
    const response = await api.post<SubmitFlagResponse>('/api/submissions', data)
    return response.data
  }

  /**
   * Submit a file
   */
  async submitFile(teamExerciseId: number, file: File): Promise<Submission> {
    const formData = new FormData()
    formData.append('team_exercise_id', teamExerciseId.toString())
    formData.append('submission_type', 'file')
    formData.append('file', file)

    const response = await api.post<Submission>('/api/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  /**
   * Submit text content
   */
  async submitText(teamExerciseId: number, content: string): Promise<Submission> {
    const response = await api.post<Submission>('/api/submissions', {
      team_exercise_id: teamExerciseId,
      submission_type: 'text',
      content,
    })
    return response.data
  }

  /**
   * Submit URL (GitHub link, website, etc.)
   */
  async submitUrl(teamExerciseId: number, url: string): Promise<Submission> {
    const response = await api.post<Submission>('/api/submissions', {
      team_exercise_id: teamExerciseId,
      submission_type: 'url',
      content: url,
    })
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
    hackathon_id?: number
    ungraded?: boolean
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
    const response = await api.get<{ submissions: Submission[] }>('/api/submissions', {
      params: { team_id: teamId }
    })
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
