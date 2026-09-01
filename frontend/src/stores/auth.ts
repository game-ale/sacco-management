import { create } from 'zustand'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types'
import api from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  getProfile: () => Promise<void>
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (data: LoginRequest) => {
    set({ isLoading: true })
    try {
      const response = await api.post<AuthResponse>('/login', data)
      const { user, access_token } = response.data
      localStorage.setItem('token', access_token)
      set({ user, token: access_token, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true })
    try {
      const response = await api.post<AuthResponse>('/saccos/register', data)
      const { user, access_token } = response.data
      localStorage.setItem('token', access_token)
      set({ user, token: access_token, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false })
    }
  },

  getProfile: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get<{ data: User }>('/profile')
      set({ user: response.data.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token)
    set({ token, isAuthenticated: true })
  },
}))
