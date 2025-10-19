/**
 * Exercise Types
 */

export interface Exercise {
  id: number
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit?: number
  is_active: boolean
  created_at: string
  updated_at: string
  flags?: Flag[]
  hints?: Hint[]
  attachments?: Attachment[]
  submission_count?: number
  solve_count?: number
}

export interface Flag {
  id: number
  exercise_id: number
  flag_text: string
  points: number
  is_case_sensitive: boolean
  created_at: string
}

export interface Hint {
  id: number
  exercise_id: number
  hint_text: string
  penalty_points: number
  order: number
  created_at: string
}

export interface Attachment {
  id: number
  exercise_id: number
  filename: string
  file_url: string
  file_size: number
  created_at: string
}

export interface CreateExerciseRequest {
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit?: number
  is_active?: boolean
  flags?: CreateFlagRequest[]
  hints?: CreateHintRequest[]
}

export interface UpdateExerciseRequest {
  title?: string
  description?: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  points?: number
  time_limit?: number
  is_active?: boolean
}

export interface CreateFlagRequest {
  flag_text: string
  points: number
  is_case_sensitive?: boolean
}

export interface CreateHintRequest {
  hint_text: string
  penalty_points: number
  order: number
}
