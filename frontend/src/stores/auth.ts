import { create } from 'zustand'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types'
import api from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  twoFactorToken: string | null
  isTwoFactorPending: boolean
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  getProfile: () => Promise<void>
  setToken: (token: string) => void
  setTwoFactorPending: (pending: boolean, token?: string | null) => void
  clearTwoFactorState: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  twoFactorToken: null,
  isTwoFactorPending: false,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (data: LoginRequest) => {
    set({ isLoading: true })
    try {
      const response = await api.post<AuthResponse>('/login', data)
      
      if (response.data.two_factor_required) {
        set({
          twoFactorToken: response.data.two_factor_token || null,
          isTwoFactorPending: true,
          isLoading: false,
        })
        return
      }

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
      set({ user: null, token: null, isAuthenticated: false, twoFactorToken: null, isTwoFactorPending: false })
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
    set({ token, isAuthenticated: true, isTwoFactorPending: false, twoFactorToken: null })
  },

  setTwoFactorPending: (pending: boolean, token: string | null = null) => {
    set({ isTwoFactorPending: pending, twoFactorToken: token })
  },

  clearTwoFactorState: () => {
    set({ isTwoFactorPending: false, twoFactorToken: null })
  }
}))
