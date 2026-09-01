import api from '../lib/api'
import type { 
  AdminDashboardMetrics, 
  User, 
  Loan, 
  PaginatedResponse 
} from '../types'

export const adminService = {
  // Dashboard
  getDashboardMetrics: async () => {
    const response = await api.get<{ success: boolean, data: AdminDashboardMetrics }>('/dashboard/metrics')
    return response.data.data
  },
  getDashboardCharts: async () => {
    const response = await api.get('/dashboard/charts')
    return response.data.data
  },
  getDashboardActivity: async () => {
    const response = await api.get('/dashboard/activity')
    return response.data.data
  },

  // Members
  getMembers: async (page = 1, search = '', sort = '', status = '') => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    if (search) params.append('search', search)
    if (sort) params.append('sort', sort)
    if (status) params.append('status', status)
    
    const response = await api.get<PaginatedResponse<User>>(`/members?${params.toString()}`)
    return response.data
  },
  createMember: async (data: Partial<User>) => {
    const response = await api.post('/members', data)
    return response.data
  },
  getMember: async (id: number) => {
    const response = await api.get<{ data: User }>(`/members/${id}`)
    return response.data.data
  },
  updateMember: async (id: number, data: Partial<User>) => {
    const response = await api.put(`/members/${id}`, data)
    return response.data
  },
  deleteMember: async (id: number) => {
    const response = await api.delete(`/members/${id}`)
    return response.data
  },

  // Savings
  getSavingsTransactions: async (memberId?: number, page = 1) => {
    if (!memberId) return { balance: 0, transactions: [] }
    const response = await api.get(`/members/${memberId}/savings?page=${page}`)
    return response.data.data // { balance, transactions }
  },
  recordSavingsDeposit: async (memberId: number, data: { amount: number, description?: string, transaction_date?: string }) => {
    const response = await api.post(`/members/${memberId}/savings/deposit`, data)
    return response.data
  },
  recordSavingsWithdrawal: async (memberId: number, data: { amount: number, description?: string, transaction_date?: string }) => {
    const response = await api.post(`/members/${memberId}/savings/withdraw`, data)
    return response.data
  },

  // Loans
  getLoans: async (status?: string, page = 1) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    if (status && status !== 'all') params.append('status', status)
    
    const response = await api.get<PaginatedResponse<Loan>>(`/loans?${params.toString()}`)
    return response.data
  },
  getLoanDetails: async (loanId: number) => {
    const response = await api.get(`/loans/${loanId}`)
    return response.data.data
  },
  approveLoan: async (loanId: number, data: { interest_rate: number, term_months: number }) => {
    const response = await api.patch(`/loans/${loanId}/approve`, data)
    return response.data
  },
  rejectLoan: async (loanId: number, data: { rejection_reason: string }) => {
    const response = await api.patch(`/loans/${loanId}/reject`, data)
    return response.data
  },
  disburseLoan: async (loanId: number) => {
    const response = await api.patch(`/loans/${loanId}/disburse`)
    return response.data
  },

  // Repayments
  getOverdueRepayments: async () => {
    const response = await api.get('/repayments/overdue')
    return response.data.data
  },
  recordRepayment: async (loanId: number, data: { schedule_id: number, amount_paid: number, payment_date: string, method?: string }) => {
    const response = await api.post(`/loans/${loanId}/repayments`, data)
    return response.data
  },

  // Shares
  getSharesSummary: async (page = 1, sort = '') => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    if (sort) params.append('sort', sort)
    
    const response = await api.get(`/shares/summary?${params.toString()}`)
    return response.data.data
  },
  updateShares: async (data: { member_id: number, shares: number }) => {
    const response = await api.post('/shares', data)
    return response.data
  },

  // Dividends
  getDividendsHistory: async () => {
    const response = await api.get('/dividends')
    return response.data.data
  },
  calculateDividends: async (data: { period: string, total_pool: number, reserve_percentage?: number }) => {
    const response = await api.post('/dividends/calculate', data)
    return response.data.data
  },
  distributeDividends: async (data: { period: string, total_pool: number, reserve_percentage?: number }) => {
    const response = await api.post('/dividends/distribute', data)
    return response.data
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/settings')
    return response.data.data
  },
  updateSettings: async (data: Record<string, any>) => {
    const response = await api.put('/settings', data)
    return response.data.data
  },

  // Search
  search: async (query: string) => {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`)
    return response.data.data
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/notifications')
    return response.data.data
  },
  markNotificationRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },
  markAllNotificationsRead: async () => {
    const response = await api.post('/notifications/read-all')
    return response.data
  }
}
