import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  UserPlus, Search, Filter, 
  Eye, Edit, Trash2, ChevronLeft, ChevronRight, X, Loader2
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { User } from '../../types'
import * as Dialog from '@radix-ui/react-dialog'

export const MembersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('latest')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state for member actions
  const [viewMember, setViewMember] = useState<User | null>(null)
  const [editMember, setEditMember] = useState<User | null>(null)
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null)

  // Form states
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    num_shares: 1,
    username: '',
    password: ''
  })
  const [addError, setAddError] = useState<string | null>(null)

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    num_shares: 0,
    is_active: true
  })
  const [editError, setEditError] = useState<string | null>(null)

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1) // Reset page on new search
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput])

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['adminMembers', page, searchQuery, sortOrder, statusFilter],
    queryFn: () => adminService.getMembers(page, searchQuery, sortOrder, statusFilter),
  })

  // Add Member Mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<User>) => adminService.createMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] })
      setIsAddModalOpen(false)
      setAddFormData({ name: '', email: '', phone: '', num_shares: 1, username: '', password: '' })
      setAddError(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create member.'
      setAddError(msg)
    }
  })

  // Edit Member Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => adminService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] })
      setEditMember(null)
      setEditError(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update member.'
      setEditError(msg)
    }
  })

  // Delete Member Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] })
      setDeleteMemberId(null)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete member.')
    }
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    createMutation.mutate({
      name: addFormData.name,
      email: addFormData.email,
      phone: addFormData.phone || undefined,
      num_shares: Number(addFormData.num_shares) || 1,
      username: addFormData.username || undefined,
      password: addFormData.password || undefined,
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMember) return
    setEditError(null)
    updateMutation.mutate({
      id: editMember.id,
      data: {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone || undefined,
        num_shares: Number(editFormData.num_shares),
        is_active: editFormData.is_active
      }
    })
  }

  const openEditModal = (member: User) => {
    setEditMember(member)
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      phone: (member as any).phone || '',
      num_shares: (member as any).num_shares || 0,
      is_active: (member as any).is_active !== false
    })
    setEditError(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  return (
    <motion.div 
      className="space-y-6 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Members</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your SACCO members, view balances, and update statuses.
          </p>
        </div>
        <button 
          onClick={() => { setIsAddModalOpen(true); setAddError(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B6B3A] text-white rounded-lg text-sm font-semibold hover:bg-[#095730] transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          Add Member
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="name">Name A-Z</option>
            </select>
            <button className="p-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <motion.div 
        variants={fadeInUp}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4 w-16">#</th>
                <th className="px-6 py-4">Member Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-right">Savings Balance</th>
                <th className="px-6 py-4 text-right">Shares</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">Loading members...</td>
                </tr>
              ) : membersData?.data && membersData.data.length > 0 ? (
                membersData.data.map((member: any, index: number) => {
                  const initials = (member.name || 'Member').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{index + 1 + (page - 1) * (membersData.meta?.per_page || 10)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID: {member.member_id || `MEM-${member.id.toString().padStart(3, '0')}`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700 dark:text-slate-300">{member.email}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{member.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#0B6B3A] dark:text-emerald-400 text-right">
                        {formatCurrency(member.savings_balance || 0)}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-right">
                        {member.num_shares || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          member.is_active !== false
                            ? 'bg-[#ECFDF5] dark:bg-emerald-500/10 text-[#0B6B3A] dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {member.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setViewMember(member)}
                            className="p-1.5 text-slate-400 hover:text-[#0B6B3A] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(member)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" 
                            title="Edit Member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteMemberId(member.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" 
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {membersData?.meta?.from || 0} to {membersData?.meta?.to || 0} of {membersData?.meta?.total || 0} members
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={!membersData?.links?.prev}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#0B6B3A] text-white text-sm font-medium">
              {page}
            </button>
            <button 
              disabled={!membersData?.links?.next}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add Member Modal */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">Add New Member</Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-lg">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] transition-colors" 
                  placeholder="e.g. Abebe Bekele" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input 
                  type="email" 
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] transition-colors" 
                  placeholder="abebe@example.com" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] transition-colors" 
                    placeholder="+251..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Shares</label>
                  <input 
                    type="number" 
                    min={0}
                    value={addFormData.num_shares}
                    onChange={(e) => setAddFormData({ ...addFormData, num_shares: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] transition-colors" 
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Dialog.Close type="button" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </Dialog.Close>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6B3A] text-white rounded-lg text-sm font-semibold hover:bg-[#095730] transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {createMutation.isPending ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* View Member Modal */}
      <Dialog.Root open={!!viewMember} onOpenChange={(open) => !open && setViewMember(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">Member Details</Dialog.Title>
              <button onClick={() => setViewMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewMember && (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Full Name</span>
                  <div className="font-bold text-slate-900 dark:text-white text-base">{viewMember.name}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Email</span>
                  <div className="text-slate-700 dark:text-slate-300">{viewMember.email}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Phone</span>
                  <div className="text-slate-700 dark:text-slate-300">{(viewMember as any).phone || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    <span className="text-xs text-slate-400">Savings Balance</span>
                    <div className="font-bold text-[#0B6B3A] dark:text-emerald-400 text-sm mt-1">
                      {formatCurrency((viewMember as any).savings_balance || 0)}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    <span className="text-xs text-slate-400">Shares Held</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                      {(viewMember as any).num_shares || 0}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                      (viewMember as any).is_active !== false
                        ? 'bg-[#ECFDF5] dark:bg-emerald-500/10 text-[#0B6B3A] dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {(viewMember as any).is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button onClick={() => setViewMember(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold">
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Member Modal */}
      <Dialog.Root open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">Edit Member</Dialog.Title>
              <button onClick={() => setEditMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-lg">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Shares</label>
                  <input 
                    type="number" 
                    value={editFormData.num_shares}
                    onChange={(e) => setEditFormData({ ...editFormData, num_shares: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={editFormData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'active' })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setEditMember(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6B3A] text-white rounded-lg text-sm font-semibold hover:bg-[#095730] disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Member Confirmation Modal */}
      <Dialog.Root open={!!deleteMemberId} onOpenChange={(open) => !open && setDeleteMemberId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">Delete Member</Dialog.Title>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this member? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setDeleteMemberId(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMemberId && deleteMutation.mutate(deleteMemberId)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.div>
  )
}
