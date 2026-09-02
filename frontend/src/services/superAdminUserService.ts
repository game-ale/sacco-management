import api from '../lib/api'
import type { PaginatedResponse, User } from '../types'

export interface GetUsersParams {
  role?: string
  sacco_id?: number | string
  status?: string
  search?: string
  sort?: string
  page?: number
}

export const superAdminUserService = {
  getUsers: async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params })
    return response.data
  },

  getUser: async (id: string | number): Promise<{ data: User }> => {
    const response = await api.get<{ data: User }>(`/admin/users/${id}`)
    return response.data
  },

  suspendUser: async (id: string | number): Promise<{ success?: boolean; message?: string; data: User }> => {
    const response = await api.patch<{ success?: boolean; message?: string; data: User }>(`/admin/users/${id}/suspend`)
    return response.data
  },

  activateUser: async (id: string | number): Promise<{ success?: boolean; message?: string; data: User }> => {
    const response = await api.patch<{ success?: boolean; message?: string; data: User }>(`/admin/users/${id}/activate`)
    return response.data
  },

  resetPassword: async (id: string | number): Promise<{ success?: boolean; message?: string; data: { temporary_password: string } }> => {
    const response = await api.post(`/admin/users/${id}/reset-password`)
    return response.data
  },

  disableTwoFactor: async (id: string | number): Promise<{ success?: boolean; message?: string }> => {
    const response = await api.delete(`/admin/users/${id}/two-factor`)
    return response.data
  },

  exportUsers: async (params?: Omit<GetUsersParams, 'page' | 'sort' | 'search'>): Promise<void> => {
    const response = await api.get('/admin/users/export', {
      params,
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
