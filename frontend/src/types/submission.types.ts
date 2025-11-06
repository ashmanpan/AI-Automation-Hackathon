/**
 * Submission Types
 */

export interface Submission {
  id: number
  exercise_id: number
  team_id: number
  user_id: number
  submitted_flag: string
  is_correct: boolean
  points_awarded: number
  submitted_at: string
  graded_at?: string
  graded_by?: number
  exercise_title?: string
  team_name?: string
  username?: string
  // Extended properties for admin/judge views
  status?: 'pending' | 'graded' | 'reviewing'
  submission_type?: 'flag' | 'file' | 'text' | 'url'
  submitted_by_name?: string
  score?: number | null
  max_score?: number
}

export interface SubmitFlagRequest {
  exercise_id: number
  flag: string
}

export interface SubmitFlagResponse {
  success: boolean
  is_correct: boolean
  points_awarded: number
  message: string
  submission_id: number
}

export interface GradingQueue {
  id: number
  exercise_id: number
  team_id: number
  user_id: number
  submission_id: number
  exercise_title: string
  team_name: string
  username: string
  submitted_flag: string
  submitted_at: string
  priority: 'high' | 'normal' | 'low'
}

export interface GradeSubmissionRequest {
  submission_id: number
  is_correct: boolean
  points_awarded: number
  feedback?: string
}
