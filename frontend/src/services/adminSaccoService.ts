import api from '../lib/api'
import type { Sacco, PaginatedResponse, DashboardStats, ExtendedSaccoDetails } from '../types'

export interface GetSaccosParams {
  status?: 'pending' | 'approved' | 'rejected' | 'suspended' | string
  search?: string
  region?: string
  sort?: string
  page?: number
}

export interface CreateSaccoPayload {
  sacco_name: string
  registration_number: string
  admin_name: string
  admin_email: string
  admin_username: string
  password: string
  password_confirmation: string
  national_id: string
  region: string
  zone: string
  town: string
}

export const adminSaccoService = {
  getDashboardStats: async (): Promise<{ success?: boolean; data: DashboardStats }> => {
    const response = await api.get<{ success?: boolean; data: DashboardStats }>('/admin/dashboard/stats')
    return response.data
  },

  getSaccos: async (params?: GetSaccosParams): Promise<PaginatedResponse<Sacco>> => {
    const response = await api.get<PaginatedResponse<Sacco>>('/admin/saccos', { params })
    return response.data
  },

  getSaccoById: async (id: string | number): Promise<{ data: Sacco }> => {
    const response = await api.get<{ data: Sacco }>(`/admin/saccos/${id}`)
    return response.data
  },

  getSaccoExtendedDetails: async (id: string | number): Promise<{ success?: boolean; data: ExtendedSaccoDetails }> => {
    const response = await api.get<{ success?: boolean; data: ExtendedSaccoDetails }>(`/admin/saccos/${id}/details`)
    return response.data
  },

  exportSaccos: async (params?: { status?: string; search?: string }): Promise<void> => {
    const response = await api.get('/admin/saccos/export', {
      params,
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `saccos-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  approveSacco: async (id: string | number): Promise<{ success?: boolean; message?: string; data: Sacco }> => {
    const response = await api.patch<{ success?: boolean; message?: string; data: Sacco }>(`/admin/saccos/${id}/approve`)
    return response.data
  },

  rejectSacco: async (
    id: string | number,
    rejectionReason?: string
  ): Promise<{ success?: boolean; message?: string; data: Sacco }> => {
    const payload = rejectionReason ? { rejection_reason: rejectionReason } : {}
    const response = await api.patch<{ success?: boolean; message?: string; data: Sacco }>(
      `/admin/saccos/${id}/reject`,
      payload
    )
    return response.data
  },

  suspendSacco: async (id: string | number): Promise<{ success?: boolean; message?: string; data: Sacco }> => {
    const response = await api.patch<{ success?: boolean; message?: string; data: Sacco }>(`/admin/saccos/${id}/suspend`)
    return response.data
  },

  reactivateSacco: async (id: string | number): Promise<{ success?: boolean; message?: string; data: Sacco }> => {
    const response = await api.patch<{ success?: boolean; message?: string; data: Sacco }>(`/admin/saccos/${id}/reactivate`)
    return response.data
  },

  getSaccoGrowth: async (): Promise<{ success?: boolean; data: any[] }> => {
    const response = await api.get<{ success?: boolean; data: any[] }>('/admin/dashboard/sacco-growth')
    return response.data
  },

  createSacco: async (payload: CreateSaccoPayload): Promise<any> => {
    const response = await api.post('/saccos/register', payload)
    return response.data
  },
}
