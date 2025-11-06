/**
 * Team Types
 */

export interface Team {
  id: number
  name: string
  hackathon_id: number
  description?: string
  created_at: string
  updated_at?: string
  member_count?: number
  members?: TeamMember[]
  score?: number
}

export interface TeamMember {
  id: number
  user_id: number
  team_id: number
  username: string
  full_name?: string
  email?: string
  role: 'participant'
  joined_at: string
}

export interface CreateTeamRequest {
  hackathon_id?: number
  name: string
  description?: string
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
}

export interface AddTeamMemberRequest {
  user_id: number
}
