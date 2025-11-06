export interface Hackathon {
  id: number
  name: string
  description: string | null
  start_time: string | null
  end_time: string | null
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_by: number | null
  created_at: string
}

export interface CreateHackathonRequest {
  name: string
  description?: string
  start_time?: string
  end_time?: string
}

export interface UpdateHackathonRequest {
  name?: string
  description?: string
  start_time?: string
  end_time?: string
}

export interface UpdateHackathonStatusRequest {
  status: 'draft' | 'active' | 'completed' | 'cancelled'
}
