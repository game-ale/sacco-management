import api from '../lib/api'
import type { PlatformOverview, SaccoComparison, GrowthTrend, GeographicDistribution } from '../types'

export const superAdminReportsService = {
  getOverview: async (): Promise<{ success?: boolean; data: PlatformOverview }> => {
    const response = await api.get<{ success?: boolean; data: PlatformOverview }>('/admin/reports/overview')
    return response.data
  },

  getSaccoComparison: async (sort?: string): Promise<{ success?: boolean; data: SaccoComparison[] }> => {
    const response = await api.get<{ success?: boolean; data: SaccoComparison[] }>('/admin/reports/sacco-comparison', { params: { sort } })
    return response.data
  },

  getGrowthTrends: async (period?: string): Promise<{ success?: boolean; data: GrowthTrend[] }> => {
    const response = await api.get<{ success?: boolean; data: GrowthTrend[] }>('/admin/reports/growth-trends', { params: { period } })
    return response.data
  },

  getGeographicDistribution: async (): Promise<{ success?: boolean; data: GeographicDistribution[] }> => {
    const response = await api.get<{ success?: boolean; data: GeographicDistribution[] }>('/admin/reports/geographic-distribution')
    return response.data
  },
}
