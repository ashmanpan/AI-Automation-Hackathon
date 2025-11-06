/**
 * Submission Types
 */

export interface Submission {
  id: number
  team_exercise_id: number
  submitted_by: number
  submission_type: 'file' | 'text' | 'url' | 'github'
  content: string | null
  file_path: string | null
  submitted_at: string
  // Extended properties from joins
  team_id?: number
  team_name?: string
  exercise_id?: number
  exercise_title?: string
  submitter_name?: string
  grade?: {
    score: number
    feedback: string
    graded_by: string
    graded_at: string
  }
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
