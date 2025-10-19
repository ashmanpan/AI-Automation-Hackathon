import api from './api'
import { Leaderboard, AdminStats, JudgeStats, ParticipantStats } from '@/types/leaderboard.types'

/**
 * Leaderboard Service
 * Handles leaderboard and statistics API calls
 */
class LeaderboardService {
  /**
   * Get current leaderboard
   */
  async getLeaderboard(): Promise<Leaderboard> {
    const response = await api.get<Leaderboard>('/api/leaderboard')
    return response.data
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/api/stats/admin')
    return response.data
  }

  /**
   * Get judge dashboard statistics
   */
  async getJudgeStats(): Promise<JudgeStats> {
    const response = await api.get<JudgeStats>('/api/stats/judge')
    return response.data
  }

  /**
   * Get participant dashboard statistics
   */
  async getParticipantStats(teamId?: number): Promise<ParticipantStats> {
    const url = teamId ? `/api/stats/participant?team_id=${teamId}` : '/api/stats/participant'
    const response = await api.get<ParticipantStats>(url)
    return response.data
  }

  /**
   * Force leaderboard refresh (admin only)
   */
  async refreshLeaderboard(): Promise<Leaderboard> {
    const response = await api.post<Leaderboard>('/api/leaderboard/refresh')
    return response.data
  }
}

export default new LeaderboardService()
