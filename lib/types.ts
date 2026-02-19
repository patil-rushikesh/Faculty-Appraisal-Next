export interface User {
  email: string
  name: string
  role: "admin"| "associate_dean" | "director" | "hod" | "dean" | "faculty"
  userId: string
  department?: string
  mobile?: string
  designation?: string
  status?: string
  createdAt?: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export interface LoginResponse {
  token: string
  user: User
}

export interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
}

export interface DashboardStats {
  totalUsers: number
  activeEvents: number
  totalSubmissions: number
  platformGrowth: number
}

export interface CreateUserRequest {
  userId: string
  name: string
  email: string
  department: string
  mobile: string
  designation: string
  status: string
  password: string
  role: string
}