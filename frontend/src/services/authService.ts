import api from '../lib/api'

export const authService = {
  forgotPassword: async (email: string) => {
    const response = await api.post('/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }) => {
    const response = await api.post('/reset-password', data)
    return response.data
  },

  changePassword: async (data: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }) => {
    const response = await api.put('/change-password', data)
    return response.data
  },

  enableTwoFactor: async (password: string) => {
    const response = await api.post('/two-factor/enable', { password })
    return response.data
  },

  confirmTwoFactor: async (code: string) => {
    const response = await api.post('/two-factor/confirm', { code })
    return response.data
  },

  disableTwoFactor: async (password: string) => {
    const response = await api.delete('/two-factor/disable', { data: { password } })
    return response.data
  },

  regenerateRecoveryCodes: async (password: string) => {
    const response = await api.get('/two-factor/recovery-codes', { data: { password } })
    return response.data
  },

  challengeTwoFactor: async (data: {
    two_factor_token: string
    code?: string
    recovery_code?: string
    remember_device?: boolean
  }) => {
    const response = await api.post('/two-factor/challenge', data)
    return response.data
  },
}
