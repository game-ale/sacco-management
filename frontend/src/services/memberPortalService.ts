import api from '../lib/api'

export interface SavingsTransaction {
  id: number
  type: 'deposit' | 'withdraw'
  amount: number
  balance_after: number | null
  description: string | null
  date: string
}

export interface SavingsSummary {
  balance: number
  transactions: SavingsTransaction[]
}

export interface Loan {
  id: number
  sacco_id: number
  user_id: number
  amount: number
  purpose: string
  status: string
  interest_rate: number | null
  term_months: number | null
  total_repayable: number | null
  monthly_installment: number | null
  rejection_reason: string | null
  approved_at: string | null
  disbursed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Dividend {
  id: number
  sacco_id: number
  member_id: number
  period: string
  num_shares: number
  share_pct: number
  amount: number
  total_pool: number
  created_at: string | null
  updated_at: string | null
}

export interface ChangePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

/** GET /api/v1/me/savings
 *
 * The backend returns `transactions` as a paginated resource collection
 * (`{ data: [...], links, meta }`), not a plain array — so it's unwrapped
 * here to keep the rest of the app working with a flat transaction list.
 */
export async function fetchMySavings(): Promise<SavingsSummary> {
  const res = await api.get<{ data: { balance: number; transactions: SavingsTransaction[] | { data: SavingsTransaction[] } } }>(
    '/me/savings'
  )
  const raw = res.data.data
  const transactions = Array.isArray(raw.transactions) ? raw.transactions : raw.transactions?.data ?? []
  return { balance: raw.balance, transactions }
}

/** GET /api/v1/me/loans */
export async function fetchMyLoans(): Promise<Loan[]> {
  const res = await api.get<{ data: Loan[] }>('/me/loans')
  return res.data.data ?? []
}

/** GET /api/v1/me/dividends */
export async function fetchMyDividends(): Promise<Dividend[]> {
  const res = await api.get<{ data: Dividend[] }>('/me/dividends')
  return res.data.data ?? []
}

/** PUT /api/v1/change-password */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.put('/change-password', payload)
}

function storageKey(userId: number | string | undefined, bucket: string) {
  return `sacco:${bucket}:${userId ?? 'guest'}`
}

export interface ProfileExtras {
  phone?: string
  date_of_birth?: string
  address?: string
  employer?: string
  notification_prefs?: {
    sms_transaction_alerts: boolean
    email_newsletters: boolean
    dividend_deposit_alerts: boolean
  }
}

const defaultExtras: ProfileExtras = {
  notification_prefs: {
    sms_transaction_alerts: true,
    email_newsletters: false,
    dividend_deposit_alerts: true,
  },
}

export function getProfileExtras(userId: number | string | undefined): ProfileExtras {
  try {
    const raw = localStorage.getItem(storageKey(userId, 'profile-extras'))
    return raw ? { ...defaultExtras, ...JSON.parse(raw) } : defaultExtras
  } catch {
    return defaultExtras
  }
}

export function saveProfileExtras(userId: number | string | undefined, extras: ProfileExtras): void {
  localStorage.setItem(storageKey(userId, 'profile-extras'), JSON.stringify(extras))
}

export interface GeneratedStatement {
  id: string
  type: 'Savings Statement' | 'Loan Statement' | 'Combined Statement'
  period: string
  reference: string
  generated_at: string
}

export function getGeneratedStatements(userId: number | string | undefined): GeneratedStatement[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, 'statements'))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addGeneratedStatement(
  userId: number | string | undefined,
  statement: GeneratedStatement
): GeneratedStatement[] {
  const existing = getGeneratedStatements(userId)
  const updated = [statement, ...existing].slice(0, 20)
  localStorage.setItem(storageKey(userId, 'statements'), JSON.stringify(updated))
  return updated
}

export interface SupportTicket {
  id: string
  subject: string
  message: string
  created_at: string
}

export async function submitSupportTicket(
  userId: number | string | undefined,
  subject: string,
  message: string
): Promise<SupportTicket> {
  const ticket: SupportTicket = {
    id: `${Date.now()}`,
    subject,
    message,
    created_at: new Date().toISOString(),
  }
  try {
    const raw = localStorage.getItem(storageKey(userId, 'support-tickets'))
    const existing: SupportTicket[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(storageKey(userId, 'support-tickets'), JSON.stringify([ticket, ...existing]))
  } catch {
    // best-effort only
  }
  return Promise.resolve(ticket)
}

export function markNotificationsReadKey(userId: number | string | undefined): string {
  return storageKey(userId, 'notifications-read')
}

export interface ApiNotification {
  id: string
  type: string
  notifiable_type?: string
  notifiable_id?: number
  data: {
    title?: string
    message?: string
    type?: string
    icon?: string
    loan_id?: number
    [key: string]: any
  }
  read_at: string | null
  created_at: string
  updated_at?: string
}

export async function fetchNotifications(): Promise<ApiNotification[]> {
  const res = await api.get<{ data: ApiNotification[] }>('/notifications')
  return res.data.data ?? []
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post('/notifications/read-all')
}
