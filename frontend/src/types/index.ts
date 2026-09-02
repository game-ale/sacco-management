export interface User {
  id: number
  name: string
  email: string
  username: string
  password?: string
  phone?: string
  num_shares?: number
  is_active?: boolean
  member_id?: string
  role?: string
  sacco_id?: number | null
  sacco_name?: string | null
  sacco_status?: string | null
  sacco?: Sacco | null
  national_id?: string
  region?: string
  zone?: string
  town?: string
  savings_balance?: number
  must_change_password?: boolean
  two_factor_confirmed_at?: string | null
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
  expires_at: string
  two_factor_required?: boolean
  two_factor_token?: string
  message?: string
}

export interface LoginRequest {
  login: string
  password: string
  remember_me?: boolean
}

export interface RegisterRequest {
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

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface Sacco {
  id: number
  name: string
  registration_number: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  rejection_reason?: string | null
  members_count?: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_saccos: number
  approved_saccos: number
  pending_saccos: number
  rejected_saccos: number
  total_members: number
  total_savings: number
  total_active_loans: number
}

export interface SaccoAdministrator {
  id: number
  name: string
  email: string
  username: string
}

export interface ExtendedSaccoDetails {
  sacco: Sacco
  administrator: SaccoAdministrator | null
  total_savings: number
  active_loans_count: number
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  links?: PaginationLinks
  meta?: PaginationMeta
}

export interface SavingsTransaction {
  id: number
  sacco_id: number
  member_id: number
  type: 'deposit' | 'withdrawal' | 'dividend' | 'fee'
  amount: number
  balance_after: number
  description: string
  reference_number?: string
  recorded_by?: number
  created_at: string
}

export interface LoanGuarantor {
  id: number
  member_id: number
  name: string
  email?: string | null
  phone?: string | null
  national_id?: string | null
  amount_guaranteed: number
  status: 'pending' | 'accepted' | 'rejected'
}

export interface FinancialPosition {
  current_savings: number
  num_shares: number
  share_capital: number
  max_3x_limit: number
  requested_amount: number
  is_within_3x_limit: boolean
  requires_guarantors: boolean
  all_guarantors_accepted: boolean
  is_eligible_for_approval: boolean
}

export interface NextInstallmentInfo {
  id: number
  installment_number: number
  due_date: string
  amount_due: number
  remaining_days: number
  status: string
}

export interface Loan {
  id: number
  sacco_id: number
  member_id: number
  loan_number: string
  amount: number
  outstanding_balance?: number
  next_due_date?: string
  next_due_amount?: number
  next_installment?: NextInstallmentInfo | null
  purpose: string
  interest_rate: number | null
  term_months: number | null
  status: 'pending' | 'approved' | 'active' | 'disbursed' | 'rejected' | 'closed'
  created_at: string
  member?: User
  user?: User
  repayment_schedule?: LoanSchedule[]
  schedules?: LoanSchedule[]
  repayments?: Repayment[]
  total_repayable?: number | null
  monthly_installment?: number | null
  guarantors?: LoanGuarantor[]
  financial_position?: FinancialPosition
}

export interface GuarantorRequest {
  id: number
  loan_id: number
  loan_number: string | null
  applicant_name: string
  applicant_email: string | null
  loan_amount: number
  loan_purpose: string | null
  amount_guaranteed: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface LoanSchedule {
  id: number
  loan_id: number
  installment_number: number
  due_date: string
  amount_due?: number
  total_due?: number
  principal_component?: number
  principal_due?: number
  interest_component?: number
  interest_due?: number
  amount_paid?: number
  status: 'pending' | 'paid' | 'overdue' | 'partial'
}

export interface Repayment {
  id: number
  sacco_id: number
  loan_id: number
  loan_schedule_id: number
  member_id: number
  amount: number
  payment_date: string
  payment_method: string
  reference_number: string
  status: 'completed' | 'pending'
}

export interface Dividend {
  id: number
  sacco_id: number
  user_id: number
  period: string
  amount: number
  shares_held: number
  ownership_percentage: number
  status: 'pending' | 'credited'
}

export interface AdminDashboardMetrics {
  total_members: {
    value: number
    change: number
  }
  total_savings: {
    value: number
    change: number
  }
  active_loans: {
    value: number
    outstanding_amount: number
  }
  overdue_repayments: {
    count: number
    amount: number
  }
  share_capital: {
    value: number
    total_shares: number
  }
}

export interface PlatformSetting {
  id?: number
  auto_approve_saccos: boolean
  require_registration_verification: boolean
  max_saccos_allowed: number | null
  default_interest_rate: number
  default_share_value: number
  default_loan_to_savings_ratio: number
  notify_new_sacco_registration: boolean
  notify_sacco_milestone: boolean
  weekly_platform_summary: boolean
  platform_name: string
  support_email: string | null
  terms_of_service_url: string | null
  privacy_policy_url: string | null
}

export interface GrowthTrend {
  month: string
  month_short: string
  members: number
  savings: number
  loans: number
  new_saccos?: number
  cumulative?: number
}

export interface GeographicDistribution {
  region: string
  count: number
  percentage: number
}

export interface SaccoComparison {
  id: number
  name: string
  status: string
  members_count: number
  total_savings: number
  active_loans_count: number
  repayment_rate: number
}

export interface PlatformOverview {
  total_savings: number
  total_loans_disbursed: number
  total_repayments_collected: number
  platform_growth: number
  total_members: number
}
