import api from '../lib/api'
import type { PublicSacco, PaginatedResponse, ApiResponse } from '../types'

export interface PublicSaccoFilters {
  search?: string
  location?: string
  category?: string
  page?: number
}

export interface SubmitMembershipRequestPayload {
  full_name: string
  email: string
  phone_number: string
  national_id?: string
  message?: string
}

export const publicSaccoService = {
  getPublicSaccos: async (filters?: PublicSaccoFilters): Promise<PaginatedResponse<PublicSacco>> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.location) params.append('location', filters.location)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.page) params.append('page', filters.page.toString())

    const response = await api.get<PaginatedResponse<PublicSacco>>(`/public/saccos?${params.toString()}`)
    return response.data
  },

  getPublicSaccoById: async (id: string | number): Promise<ApiResponse<PublicSacco>> => {
    const response = await api.get<ApiResponse<PublicSacco>>(`/public/saccos/${id}`)
    return response.data
  },

  submitMembershipRequest: async (
    saccoId: string | number,
    payload: SubmitMembershipRequestPayload
  ): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(`/public/saccos/${saccoId}/membership-requests`, payload)
    return response.data
  },
}
