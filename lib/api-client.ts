import axios, { AxiosRequestConfig } from "axios"
import type { ApiResponse, LoginResponse, HealthResponse, DashboardStats, CreateUserRequest, User } from "./types"

// Token management - stored in memory, not localStorage
let authToken: string | null = null

export const tokenManager = {
  setToken: (token: string | null) => {
    authToken = token
  },
  getToken: () => authToken,
  clearToken: () => {
    authToken = null
  },
}

// Helper to build auth headers
const buildHeaders = (requireAuth: boolean): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (requireAuth && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

// Base API client with auth support (uses both cookies and Authorization header)
export const apiClient = {
  async get<T>(endpoint: string, requireAuth = true): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: buildHeaders(requireAuth),
      withCredentials: true,
    }
    const response = await axios.get<T>(`/api${endpoint}`, config)
    return response.data
  },

  async post<T>(endpoint: string, data?: any, requireAuth = true): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: buildHeaders(requireAuth),
      withCredentials: true,
    }
    const response = await axios.post<T>(`/api${endpoint}`, data, config)
    return response.data
  },

  async put<T>(endpoint: string, data: any, requireAuth = true): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: buildHeaders(requireAuth),
      withCredentials: true,
    }
    const response = await axios.put<T>(`/api${endpoint}`, data, config)
    return response.data
  },

  async delete<T>(endpoint: string, requireAuth = true): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: buildHeaders(requireAuth),
      withCredentials: true,
    }
    const response = await axios.delete<T>(`/api${endpoint}`, config)
    return response.data
  },
}

// API service functions
export const api = {
  // Health & Debug
  health: {
    check: () => apiClient.get<HealthResponse>("/health", false),
    checkDb: () => apiClient.get<{ db: string; message?: string }>("/health/db", false),
  },

  // Auth
  auth: {
    login: (userId: string, password: string) =>
      apiClient.post<ApiResponse<LoginResponse>>("/login", { userId, password }, false),
    
    logout: () => apiClient.post<{ ok: boolean; message: string }>("/logout"),
    
    me: () => apiClient.get<ApiResponse<{ user: User; token: string }>>("/auth/me"),
    
    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post<ApiResponse>("/auth/change-password", { currentPassword, newPassword }),
  },

  // Admin
  admin: {
    createUser: (userData: CreateUserRequest) =>
      apiClient.post<ApiResponse<{ user: User }>>("/admin/create-user", userData),
    
    // Dashboard stats
    getStats: () => apiClient.get<ApiResponse<DashboardStats>>("/admin/stats"),
  },
}
