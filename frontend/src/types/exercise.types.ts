/**
 * Exercise Types
 */

export interface Exercise {
  id: number
  hackathon_id: number
  title: string
  description: string | null
  instructions?: string | null
  rubric?: string | null
  type: 'coding' | 'study' | 'presentation' | 'deployment' | 'other'
  max_score: number
  time_limit_minutes: number | null
  start_time: string | null
  end_time: string | null
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_at: string
  team_exercise_id?: number // Junction table ID when fetched by team
  assignment_status?: string // Status from team_exercises
  assigned_at?: string
  started_at?: string | null
  flags?: Flag[]
  hints?: Hint[]
  attachments?: Attachment[]
  submission_count?: number
  solve_count?: number
  // Legacy properties for backward compatibility
  points?: number
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
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
  hackathon_id?: number
  title: string
  description: string
  instructions?: string
  rubric?: string
  type: 'coding' | 'study' | 'presentation' | 'deployment' | 'other'
  max_score: number
  time_limit_minutes?: number
  start_time?: string
  assign_to?: 'all' | number[]
  flags?: CreateFlagRequest[]
  hints?: CreateHintRequest[]
}

export interface UpdateExerciseRequest {
  title?: string
  description?: string
  instructions?: string
  rubric?: string
  type?: 'coding' | 'study' | 'presentation' | 'deployment' | 'other'
  max_score?: number
  time_limit_minutes?: number
  start_time?: string
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
