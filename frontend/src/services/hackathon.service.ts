import api from './api'
import {
  Hackathon,
  CreateHackathonRequest,
  UpdateHackathonRequest,
  UpdateHackathonStatusRequest,
} from '@/types/hackathon.types'

/**
 * Hackathon Service
 * Handles all hackathon-related API calls
 */
class HackathonService {
  /**
   * Get all hackathons
   */
  async getAll(): Promise<Hackathon[]> {
    const response = await api.get<Hackathon[]>('/api/hackathons')
    return response.data
  }

  /**
   * Get hackathon by ID
   */
  async getById(id: number): Promise<Hackathon> {
    const response = await api.get<Hackathon>(`/api/hackathons/${id}`)
    return response.data
  }

  /**
   * Get active hackathon
   */
  async getActive(): Promise<Hackathon> {
    const response = await api.get<Hackathon>('/api/hackathons/active')
    return response.data
  }

  /**
   * Create new hackathon
   */
  async create(data: CreateHackathonRequest): Promise<Hackathon> {
    const response = await api.post<Hackathon>('/api/hackathons', data)
    return response.data
  }

  /**
   * Update hackathon
   */
  async update(id: number, data: UpdateHackathonRequest): Promise<Hackathon> {
    const response = await api.put<Hackathon>(`/api/hackathons/${id}`, data)
    return response.data
  }

  /**
   * Update hackathon status
   */
  async updateStatus(id: number, data: UpdateHackathonStatusRequest): Promise<Hackathon> {
    const response = await api.patch<Hackathon>(`/api/hackathons/${id}/status`, data)
    return response.data
  }

  /**
   * Delete hackathon
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/hackathons/${id}`)
  }
}

export default new HackathonService()
