import api from '../lib/api'

export interface SuperAdminPlatformSearchResponse {
  saccos: Array<{
    id: number
    name: string
    registration_number?: string | null
    status?: string | null
    region?: string | null
    email?: string | null
    contact_email?: string | null
  }>
  users: Array<{
    id: number
    name: string
    email?: string | null
    username?: string | null
    role?: string | null
    sacco?: {
      id?: number
      name?: string
    } | null
  }>
  membership_requests: Array<{
    id: number
    full_name: string
    email?: string | null
    phone_number?: string | null
    status?: string | null
    sacco?: {
      id?: number
      name?: string
    } | null
  }>
}

export const superAdminSearchService = {
  search: async (query: string): Promise<SuperAdminPlatformSearchResponse> => {
    const response = await api.get<{
      data: SuperAdminPlatformSearchResponse
    }>('/admin/search', {
      params: { q: query },
    })

    return response.data.data ?? { saccos: [], users: [], membership_requests: [] }
  },
}
