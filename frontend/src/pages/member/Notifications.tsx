import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  PiggyBank,
  Wallet,
  ShieldCheck,
  CheckCheck,
  Loader2,
} from 'lucide-react'
import {
  useMemberNotifications,
  resolveNotificationDestination,
  type NotificationItem,
  type NotificationKind,
} from '../../hooks/useMemberNotifications'

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications, loading, error, unreadCount, markAllRead, markOneRead } = useMemberNotifications()

  // Track expanded message IDs for "View More / View Less"
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  // Track currently open notification for detailed view modal
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null)

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleOpenDetail = (notif: NotificationItem) => {
    if (!notif.read) {
      markOneRead(notif.id)
    }

    const destination = resolveNotificationDestination(notif)
    if (destination) {
      navigate(destination)
    } else {
      setSelectedNotif({ ...notif, read: true })
    }
  }

  const getIcon = (kind: NotificationKind) => {
    switch (kind) {
      case 'loan':
        return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case 'dividend':
        return <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      case 'guarantor_request':
        return <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      default:
        return <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const CHARACTER_LIMIT = 120

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#0B6B3A]/10 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
            <Bell className="w-6 h-6 text-[#0B6B3A] dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Stay updated on your account activity and requests.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0B6B3A] dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 rounded-lg border border-emerald-200/70 dark:border-emerald-800/50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-600" />
            <span className="text-sm font-medium">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Notifications</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are all caught up! Account updates will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif) => {
              const isExpanded = !!expandedIds[notif.id]
              const isLong = notif.message.length > CHARACTER_LIMIT
              const displayMessage =
                isLong && !isExpanded
                  ? `${notif.message.slice(0, CHARACTER_LIMIT)}...`
                  : notif.message

              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenDetail(notif)}
                  className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !notif.read
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="shrink-0 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    {getIcon(notif.kind)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 truncate">
                        <h3
                          className={`text-sm font-bold truncate ${
                            !notif.read
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                        {formatDate(notif.date)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 pr-6 leading-relaxed">
                      {displayMessage}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      {isLong && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(e, notif.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {isExpanded ? (
                            <>
                              View Less <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              View More <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDetail(notif)
                        }}
                        className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation()
                        markOneRead(notif.id)
                      }}
                      className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-700 transition-colors shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50">
                  {getIcon(selectedNotif.kind)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedNotif.title}
                  </h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(selectedNotif.date)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6">
              <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5" />
                Read
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedNotif.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotif(null)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
