/**
 * Leaderboard Types
 */

export interface LeaderboardEntry {
  rank: number
  team_id: number
  team_name: string
  total_score: number
  solved_count: number
  last_submission?: string
  members?: string[]
  trend?: 'up' | 'down' | 'same'
}

export interface Leaderboard {
  entries: LeaderboardEntry[]
  last_updated: string
  total_teams: number
}

export interface AdminStats {
  total_users: number
  total_teams: number
  total_exercises: number
  total_submissions: number
  active_users: number
  pending_grading: number
  avg_score: number
  top_team?: {
    name: string
    score: number
  }
}

export interface JudgeStats {
  pending_submissions: number
  graded_today: number
  total_graded: number
  avg_grading_time: number
}

export interface ParticipantStats {
  team_rank?: number
  total_score: number
  solved_exercises: number
  total_exercises: number
  pending_submissions: number
  hints_used: number
}
