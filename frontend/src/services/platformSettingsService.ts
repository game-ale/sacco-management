import api from '../lib/api'
import type { PlatformSetting } from '../types'

export const platformSettingsService = {
  getSettings: async (): Promise<{ success?: boolean; data: PlatformSetting }> => {
    const response = await api.get<{ success?: boolean; data: PlatformSetting }>('/admin/platform-settings')
    return response.data
  },

  updateSettings: async (data: Partial<PlatformSetting>): Promise<{ success?: boolean; data: PlatformSetting; message?: string }> => {
    const response = await api.put<{ success?: boolean; data: PlatformSetting; message?: string }>('/admin/platform-settings', data)
    return response.data
  },
}
