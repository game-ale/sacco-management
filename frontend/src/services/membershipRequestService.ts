import api from '../lib/api'
import type { MembershipRequest, PaginatedResponse, ApiResponse } from '../types'

export interface MembershipRequestFilters {
  status?: string
  search?: string
  page?: number
}

export const membershipRequestService = {
  getMembershipRequests: async (
    filters?: MembershipRequestFilters
  ): Promise<PaginatedResponse<MembershipRequest>> => {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())

    const response = await api.get<PaginatedResponse<MembershipRequest>>(`/membership-requests?${params.toString()}`)
    return response.data
  },

  getMembershipRequestById: async (id: string | number): Promise<ApiResponse<MembershipRequest>> => {
    const response = await api.get<ApiResponse<MembershipRequest>>(`/membership-requests/${id}`)
    return response.data
  },

  approveRequest: async (id: string | number): Promise<ApiResponse<MembershipRequest>> => {
    const response = await api.post<ApiResponse<MembershipRequest>>(`/membership-requests/${id}/approve`)
    return response.data
  },

  rejectRequest: async (
    id: string | number,
    rejectionReason: string
  ): Promise<ApiResponse<MembershipRequest>> => {
    const response = await api.post<ApiResponse<MembershipRequest>>(`/membership-requests/${id}/reject`, {
      rejection_reason: rejectionReason,
    })
    return response.data
  },
}
