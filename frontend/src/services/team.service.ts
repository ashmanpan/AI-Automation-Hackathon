import api from './api'
import { Team, CreateTeamRequest, UpdateTeamRequest, AddTeamMemberRequest, TeamMember } from '@/types/team.types'

/**
 * Team Service
 * Handles all team-related API calls
 */
class TeamService {
  /**
   * Get all teams
   */
  async getAll(params?: { hackathon_id?: number }): Promise<Team[]> {
    const response = await api.get<{ teams: Team[] }>('/api/teams', { params })
    return response.data.teams
  }

  /**
   * Get team by ID
   */
  async getById(id: number): Promise<Team> {
    const response = await api.get<{ team: Team }>(`/api/teams/${id}`)
    return response.data.team
  }

  /**
   * Get current user's team
   */
  async getMyTeam(): Promise<Team> {
    const response = await api.get<{ team: Team }>('/api/teams/my-team')
    return response.data.team
  }

  /**
   * Create new team
   */
  async create(data: CreateTeamRequest): Promise<Team> {
    const response = await api.post<{ team: Team }>('/api/teams', data)
    return response.data.team
  }

  /**
   * Update team
   */
  async update(id: number, data: UpdateTeamRequest): Promise<Team> {
    const response = await api.put<{ team: Team }>(`/api/teams/${id}`, data)
    return response.data.team
  }

  /**
   * Delete team
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/teams/${id}`)
  }

  /**
   * Get team members
   */
  async getMembers(teamId: number): Promise<TeamMember[]> {
    const response = await api.get<{ members: TeamMember[] }>(`/api/teams/${teamId}/members`)
    return response.data.members
  }

  /**
   * Add member to team
   */
  async addMember(teamId: number, userId: number): Promise<void> {
    await api.post(`/api/teams/${teamId}/members`, { user_id: userId })
  }

  /**
   * Get unassigned participants for a hackathon
   */
  async getUnassignedParticipants(hackathonId: number): Promise<any[]> {
    const response = await api.get<{ participants: any[] }>(`/api/teams/unassigned`, {
      params: { hackathon_id: hackathonId }
    })
    return response.data.participants
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: number, userId: number): Promise<void> {
    await api.delete(`/api/teams/${teamId}/members/${userId}`)
  }

  /**
   * Get team leaderboard position
   */
  async getTeamStats(teamId: number): Promise<{
    rank: number
    total_score: number
    solved_count: number
  }> {
    const response = await api.get(`/api/teams/${teamId}/stats`)
    return response.data
  }
}

export default new TeamService()
