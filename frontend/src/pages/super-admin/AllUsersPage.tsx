import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldOff,
  Key,
  Loader2,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { superAdminUserService, type GetUsersParams } from '../../services/superAdminUserService'

export const AllUsersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [params, setParams] = useState<GetUsersParams>({
    page: 1,
    sort: 'newest',
  })
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-users', params],
    queryFn: () => superAdminUserService.getUsers(params),
  })

  const suspendMutation = useMutation({
    mutationFn: (id: number) => superAdminUserService.suspendUser(id),
    onSuccess: () => {
      toast.success('User suspended successfully')
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to suspend user')
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => superAdminUserService.activateUser(id),
    onSuccess: () => {
      toast.success('User activated successfully')
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to activate user')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => superAdminUserService.resetPassword(id),
    onSuccess: (data) => {
      setTemporaryPassword(data?.data?.temporary_password)
      toast.success('Password reset successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reset password')
    },
  })

  const disable2FaMutation = useMutation({
    mutationFn: (id: number) => superAdminUserService.disableTwoFactor(id),
    onSuccess: () => {
      toast.success('Two-factor authentication disabled for user')
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to disable 2FA')
    },
  })

  const handleExport = () => {
    const exportParams = { ...params }
    delete exportParams.page
    delete exportParams.sort
    superAdminUserService.exportUsers(exportParams)
      .then(() => toast.success('Export started'))
      .catch(() => toast.error('Export failed'))
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, search: e.target.value, page: 1 })
  }

  const handleFilterChange = (key: keyof GetUsersParams, value: string) => {
    setParams({ ...params, [key]: value || undefined, page: 1 })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            All Users
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all platform members, SACCO admins, and superadmins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={params.search || ''}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              value={params.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">SACCO Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              value={params.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">SACCO</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No users found</h3>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                data?.data.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                        ${user.role === 'superadmin' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 
                          user.role === 'admin' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}
                      `}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {user.sacco ? user.sacco.name : <span className="text-slate-400 dark:text-slate-500 italic">None</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${user.is_active !== false 
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/60' 
                          : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-700/60'}
                      `}>
                        {user.is_active !== false ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                        ) : (
                          <><XCircle className="w-3.5 h-3.5" /> Suspended</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'superadmin' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setResetPasswordUser(user)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          
                          {user.two_factor_confirmed_at && (
                            <button
                              onClick={() => {
                                if(window.confirm('Are you sure you want to disable 2FA for this user? This is an emergency recovery action.')) {
                                  disable2FaMutation.mutate(user.id)
                                }
                              }}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Disable 2FA"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          )}

                          {user.is_active !== false ? (
                            <button
                              onClick={() => {
                                if(window.confirm('Are you sure you want to suspend this user?')) {
                                  suspendMutation.mutate(user.id)
                                }
                              }}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Suspend User"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if(window.confirm('Are you sure you want to activate this user?')) {
                                  activateMutation.mutate(user.id)
                                }
                              }}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Activate User"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data?.meta && data.meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="text-sm">
              Showing <span className="font-medium text-slate-900 dark:text-white">{data.meta.from}</span> to <span className="font-medium text-slate-900 dark:text-white">{data.meta.to}</span> of <span className="font-medium text-slate-900 dark:text-white">{data.meta.total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={params.page === 1}
                onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={params.page === data.meta.last_page}
                onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <Dialog.Root 
        open={!!resetPasswordUser} 
        onOpenChange={(open) => {
          if (!open) {
            setResetPasswordUser(null)
            setTemporaryPassword(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</Dialog.Title>
              {!temporaryPassword ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Are you sure you want to reset the password for <span className="font-bold text-slate-800 dark:text-slate-200">{resetPasswordUser?.name}</span>? 
                  They will be forced to change it on their next login.
                </p>
              ) : (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mb-2">Temporary Password Generated!</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-500/20 text-slate-800 dark:text-slate-200 font-mono text-sm">
                      {temporaryPassword}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(temporaryPassword)
                        toast.success('Password copied to clipboard')
                      }}
                      className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Please share this with the user securely.</p>
                </div>
              )}
            </div>
            {!temporaryPassword ? (
              <div className="flex justify-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={resetPasswordMutation.isPending}
                  onClick={() => resetPasswordUser && resetPasswordMutation.mutate(resetPasswordUser.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setResetPasswordUser(null)
                  setTemporaryPassword(null)
                }}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
