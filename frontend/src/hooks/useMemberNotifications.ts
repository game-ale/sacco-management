import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../stores/auth'
import {
  fetchMyDividends,
  fetchMyLoans,
  fetchMySavings,
  markNotificationsReadKey,
} from '../services/memberPortalService'

export type NotificationKind = 'loan' | 'savings' | 'dividend' | 'system'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  title: string
  message: string
  date: string
  read: boolean
}

/**
 * Builds the member's notification feed from real /me/savings, /me/loans
 * and /me/dividends data, and tracks which items have been marked read in
 * localStorage. Shared by NotificationsPage (the full list) and
 * MemberLayout (the sidebar/header unread badge) so both always agree on
 * the same count.
 */
export function useMemberNotifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [savings, loans, dividends] = await Promise.all([
          fetchMySavings().catch(() => null),
          fetchMyLoans().catch(() => []),
          fetchMyDividends().catch(() => []),
        ])

        const readIds: string[] = JSON.parse(
          localStorage.getItem(markNotificationsReadKey(user?.id)) || '[]'
        )

        const items: NotificationItem[] = []

        // Loan status notifications, built from real /me/loans data
        loans.forEach((loan) => {
          const statusMeta: Record<string, { title: string; message: string }> = {
            approved: {
              title: 'Loan Application Approved',
              message: `Your ${loan.purpose || 'loan'} application for ETB ${loan.amount.toLocaleString()} has been approved.`,
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
            id: `loan-${loan.id}`,
            kind: 'loan',
            title: meta.title,
            message: meta.message,
            date: loan.disbursed_at || loan.approved_at || loan.updated_at || loan.created_at || new Date().toISOString(),
            read: readIds.includes(`loan-${loan.id}`),
          })
        })

        // Savings transaction notifications, built from real /me/savings data
        savings?.transactions.slice(0, 8).forEach((tx) => {
          items.push({
            id: `savings-${tx.id}`,
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
            read: readIds.includes(`savings-${tx.id}`),
          })
        })

        // Dividend notifications, built from real /me/dividends data
        dividends.forEach((div) => {
          items.push({
            id: `dividend-${div.id}`,
            kind: 'dividend',
            title: 'Dividend Declared',
            message: `A dividend of ETB ${div.amount.toLocaleString()} for period ${div.period} has been credited to your account.`,
            date: div.created_at || new Date().toISOString(),
            read: readIds.includes(`dividend-${div.id}`),
          })
        })

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        if (!cancelled) setNotifications(items)
      } catch {
        if (!cancelled) setError('Could not load notifications right now.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const persistRead = useCallback(
    (ids: string[]) => {
      localStorage.setItem(markNotificationsReadKey(user?.id), JSON.stringify(ids))
    },
    [user?.id]
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      persistRead(updated.map((n) => n.id))
      return updated
    })
  }, [persistRead])

  const markOneRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        persistRead(updated.filter((n) => n.read).map((n) => n.id))
        return updated
      })
    },
    [persistRead]
  )

  return { notifications, loading, error, unreadCount, markAllRead, markOneRead }
}