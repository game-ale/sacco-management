import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../stores/auth'
import type { ApiNotification } from '../services/memberPortalService'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchMyDividends,
  fetchMyLoans,
  fetchMySavings,
  markNotificationsReadKey,
} from '../services/memberPortalService'

export type NotificationKind = 'loan' | 'savings' | 'dividend' | 'system' | 'guarantor_request'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  title: string
  message: string
  date: string
  read: boolean
  isBackendNotification?: boolean
  entityType?: string
  entityId?: string | number
  loanId?: string | number
  actionUrl?: string
  data?: Record<string, any>
}

export interface MemberNotificationContextType {
  notifications: NotificationItem[]
  loading: boolean
  error: string | null
  unreadCount: number
  markAllRead: () => Promise<void>
  markOneRead: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const MemberNotificationContext = createContext<MemberNotificationContextType | null>(null)

export function resolveNotificationDestination(notif: NotificationItem): string | null {
  // 1. Direct action URL if explicitly provided
  if (notif.actionUrl) {
    return notif.actionUrl
  }

  // 2. Exact loan / loan application ID
  if (notif.loanId) {
    return `/member/loans/${notif.loanId}`
  }

  // 3. Resource routing by type or kind
  const type = notif.entityType || notif.kind
  if (
    type === 'loan' ||
    type === 'loan_application' ||
    type === 'loan_disbursed' ||
    type === 'loan_overdue' ||
    type === 'guarantor_request' ||
    type === 'guarantor_response'
  ) {
    if (notif.entityId) {
      return `/member/loans/${notif.entityId}`
    }
    return '/member/loans'
  }

  if (type === 'savings' || type === 'contribution') {
    return '/member/savings'
  }

  if (type === 'dividend') {
    return '/member/dividends'
  }

  if (type === 'payment' || type === 'repayment') {
    return '/member/payments'
  }

  if (type === 'profile') {
    return '/member/profile'
  }

  // General fallback when no specific resource exists
  return null
}

export function MemberNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch real backend DB notifications
      let dbNotifs: ApiNotification[] = []
      try {
        dbNotifs = await fetchNotifications()
      } catch (err) {
        console.warn('Could not fetch backend notifications:', err)
      }

      const items: NotificationItem[] = []
      const readLocalIds: string[] = JSON.parse(
        localStorage.getItem(markNotificationsReadKey(user?.id)) || '[]'
      )

      if (Array.isArray(dbNotifs) && dbNotifs.length > 0) {
        dbNotifs.forEach((n) => {
          const data = n.data || {}
          const entityType = data.type || data.entity_type || 'system'
          const rawLoanId =
            data.loan_id ||
            data.application_id ||
            (entityType === 'loan' || entityType === 'loan_application' || entityType === 'loan_disbursed'
              ? data.entity_id
              : undefined)

          let actionUrl = data.action_url
          if (!actionUrl) {
            if (rawLoanId) {
              actionUrl = `/member/loans/${rawLoanId}`
            } else if (entityType === 'savings' || entityType === 'contribution') {
              actionUrl = '/member/savings'
            } else if (entityType === 'dividend') {
              actionUrl = '/member/dividends'
            } else if (entityType === 'payment') {
              actionUrl = '/member/payments'
            }
          }

          items.push({
            id: n.id,
            kind: (entityType as NotificationKind) || 'system',
            title: data.title || 'Notification',
            message: data.message || 'New notification',
            date: n.created_at,
            read: n.read_at !== null || readLocalIds.includes(n.id),
            isBackendNotification: true,
            entityType,
            entityId: data.entity_id || rawLoanId,
            loanId: rawLoanId,
            actionUrl,
            data,
          })
        })
      }

      // 2. Also build activity events if needed to complement DB notifications
      const [savings, loans, dividends] = await Promise.all([
        fetchMySavings().catch(() => null),
        fetchMyLoans().catch(() => []),
        fetchMyDividends().catch(() => []),
      ])

      loans.forEach((loan) => {
        const synthId = `loan-${loan.id}`
        if (!items.some((it) => it.id === synthId)) {
          const statusMeta: Record<string, { title: string; message: string }> = {
            approved: {
              title: 'Loan Application Approved',
              message: `Your ${loan.purpose || 'loan'} application for ETB ${loan.amount.toLocaleString()} has been approved.`,
            },
            active: {
              title: 'Loan Funds Disbursed',
              message: `ETB ${loan.amount.toLocaleString()} has been disbursed and is active.`,
            },
            disbursed: {
              title: 'Loan Funds Disbursed',
              message: `ETB ${loan.amount.toLocaleString()} has been disbursed to your savings account.`,
            },
            rejected: {
              title: 'Loan Application Update',
              message: loan.rejection_reason
                ? `Your loan application was not approved: ${loan.rejection_reason}`
                : 'Your loan application was not approved this time.',
            },
            pending: {
              title: 'Loan Application Submitted',
              message: `Your application for ETB ${loan.amount.toLocaleString()} is pending review.`,
            },
          }
          const meta = statusMeta[loan.status] || {
            title: 'Loan Status Update',
            message: `Your loan status is now "${loan.status}".`,
          }
          items.push({
            id: synthId,
            kind: 'loan',
            title: meta.title,
            message: meta.message,
            date: loan.disbursed_at || loan.approved_at || loan.updated_at || loan.created_at || new Date().toISOString(),
            read: readLocalIds.includes(synthId),
            isBackendNotification: false,
            entityType: 'loan_application',
            entityId: loan.id,
            loanId: loan.id,
            actionUrl: `/member/loans/${loan.id}`,
            data: { loan_id: loan.id, status: loan.status, rejection_reason: loan.rejection_reason },
          })
        }
      })

      savings?.transactions.slice(0, 5).forEach((tx) => {
        const synthId = `savings-${tx.id}`
        if (!items.some((it) => it.id === synthId)) {
          items.push({
            id: synthId,
            kind: 'savings',
            title: tx.type === 'deposit' ? 'Contribution Received' : 'Withdrawal Processed',
            message:
              tx.type === 'deposit'
                ? `We received your deposit of ETB ${tx.amount.toLocaleString()}. New balance: ETB ${(
                    tx.balance_after ?? savings.balance
                  ).toLocaleString()}.`
                : `A withdrawal of ETB ${tx.amount.toLocaleString()} was processed. New balance: ETB ${(
                    tx.balance_after ?? savings.balance
                  ).toLocaleString()}.`,
            date: tx.date,
            read: readLocalIds.includes(synthId),
            isBackendNotification: false,
            entityType: 'savings',
            entityId: tx.id,
            actionUrl: '/member/savings',
          })
        }
      })

      dividends.forEach((div) => {
        const synthId = `dividend-${div.id}`
        if (!items.some((it) => it.id === synthId)) {
          items.push({
            id: synthId,
            kind: 'dividend',
            title: 'Dividend Declared',
            message: `A dividend of ETB ${div.amount.toLocaleString()} for period ${div.period} has been credited to your account.`,
            date: div.created_at || new Date().toISOString(),
            read: readLocalIds.includes(synthId),
            isBackendNotification: false,
            entityType: 'dividend',
            entityId: div.id,
            actionUrl: '/member/dividends',
          })
        }
      })

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setNotifications(items)
    } catch {
      setError('Could not load notifications right now.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markOneRead = useCallback(
    async (id: string) => {
      // PREVENT DOUBLE DECREMENT: Check if notification is already read
      let wasAlreadyRead = false
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id)
        if (!target || target.read) {
          wasAlreadyRead = true
          return prev
        }
        return prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      })

      if (wasAlreadyRead) return

      // Persist read state locally
      const readLocalIds: string[] = JSON.parse(
        localStorage.getItem(markNotificationsReadKey(user?.id)) || '[]'
      )
      if (!readLocalIds.includes(id)) {
        readLocalIds.push(id)
        localStorage.setItem(markNotificationsReadKey(user?.id), JSON.stringify(readLocalIds))
      }

      // Send to backend API if DB notification
      if (!id.startsWith('loan-') && !id.startsWith('savings-') && !id.startsWith('dividend-')) {
        try {
          await markNotificationAsRead(id)
        } catch (err) {
          console.warn('Error marking notification as read on backend:', err)
          // Rollback on failure
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: false } : n))
          )
        }
      }
    },
    [user?.id]
  )

  const markAllRead = useCallback(async () => {
    let hadUnread = false
    setNotifications((prev) => {
      if (prev.every((n) => n.read)) {
        hadUnread = false
        return prev
      }
      hadUnread = true
      return prev.map((n) => ({ ...n, read: true }))
    })

    if (!hadUnread) return

    const allIds = notifications.map((n) => n.id)
    localStorage.setItem(markNotificationsReadKey(user?.id), JSON.stringify(allIds))

    try {
      await markAllNotificationsAsRead()
    } catch (err) {
      console.warn('Error marking all notifications as read on backend:', err)
      loadNotifications()
    }
  }, [notifications, user?.id, loadNotifications])

  const value = useMemo(
    () => ({
      notifications,
      loading,
      error,
      unreadCount,
      markAllRead,
      markOneRead,
      refetch: loadNotifications,
    }),
    [notifications, loading, error, unreadCount, markAllRead, markOneRead, loadNotifications]
  )

  return React.createElement(MemberNotificationContext.Provider, { value }, children)
}

export function useMemberNotifications() {
  const context = useContext(MemberNotificationContext)
  if (!context) {
    throw new Error('useMemberNotifications must be used within a MemberNotificationProvider')
  }
  return context
}
