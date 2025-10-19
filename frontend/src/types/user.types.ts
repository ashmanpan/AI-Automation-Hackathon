export interface User {
  id: number
  username: string
  full_name?: string
  email?: string
  role: 'admin' | 'judge' | 'participant'
  created_at?: string
  updated_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}
