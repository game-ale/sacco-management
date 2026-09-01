import React from 'react'
import { Bell, FileText, AlertCircle, Loader2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { formatDistanceToNow } from 'date-fns'

export const NotificationDropdown: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: adminService.getNotifications,
    refetchInterval: 30000, // Check for new notifications every 30 seconds
  })

  const markAsReadMutation = useMutation({
    mutationFn: adminService.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] })
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: adminService.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] })
    }
  })

  const unreadCount = notifications.filter((n: any) => !n.read_at).length

  const getIcon = (type: string, iconName?: string) => {
    if (iconName === 'alert-circle' || type === 'loan_overdue') return <AlertCircle className="w-4 h-4 text-rose-500" />
    if (iconName === 'file-text' || type === 'loan_application') return <FileText className="w-4 h-4 text-blue-500" />
    return <Bell className="w-4 h-4 text-slate-500" />
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors relative outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 rounded-full p-1">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 mr-2 sm:mr-6 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
          sideOffset={8}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-[#0B6B3A] text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  markAllAsReadMutation.mutate()
                }}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs font-semibold text-[#0B6B3A] hover:text-[#095730] dark:text-emerald-400 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Bell className="w-8 h-8 mb-3 opacity-20" />
                <span className="text-sm font-medium">All caught up!</span>
                <span className="text-xs">No notifications to show.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification: any) => {
                  const isUnread = !notification.read_at
                  const { title, message, icon, type } = notification.data
                  
                  return (
                    <DropdownMenu.Item 
                      key={notification.id}
                      onSelect={(e) => {
                        e.preventDefault()
                        if (isUnread) markAsReadMutation.mutate(notification.id)
                      }}
                      className={`flex gap-3 p-4 cursor-pointer outline-none transition-colors ${
                        isUnread 
                          ? 'bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isUnread ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {getIcon(type, icon)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${
                            isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 mt-0.5 font-medium">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${
                          isUnread ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                        }`}>
                          {message}
                        </p>
                      </div>

                      {isUnread && (
                        <div className="shrink-0 flex items-center justify-center w-4">
                          <div className="w-2 h-2 bg-[#0B6B3A] rounded-full"></div>
                        </div>
                      )}
                    </DropdownMenu.Item>
                  )
                })}
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
