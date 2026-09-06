import React, { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Loader2,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { membershipRequestService } from '../../services/membershipRequestService'
import type { MembershipRequest, PaginationMeta } from '../../types'

export const MembershipRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<MembershipRequest[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false)

  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await membershipRequestService.getMembershipRequests({
        status: statusFilter,
        search: searchQuery || undefined,
        page: page,
      })
      setRequests(res.data)
      if (res.meta) {
        setMeta(res.meta)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load membership requests.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, page])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (id: number) => {
    setActionLoading(true)
    try {
      await membershipRequestService.approveRequest(id)
      toast.success('Membership request approved! Invitation email sent to applicant.')
      fetchRequests()
      setViewModalOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve membership request.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenRejectModal = (req: MembershipRequest) => {
    setSelectedRequest(req)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!selectedRequest) return
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason.')
      return
    }

    setActionLoading(true)
    try {
      await membershipRequestService.rejectRequest(selectedRequest.id, rejectionReason)
      toast.error('Membership request rejected.')
      fetchRequests()
      setRejectModalOpen(false)
      setViewModalOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject membership request.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Membership Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review and manage public membership applications submitted to your SACCO.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-4 md:space-y-0 md:flex md:items-center md:justify-between transition-colors">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search applicant name, email, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold">Loading membership requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs font-semibold">{error}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold">No membership requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-6">Applicant</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">National ID</th>
                  <th className="py-3.5 px-6">Date Submitted</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div>{req.full_name}</div>
                      {req.message && (
                        <span className="text-[10px] text-slate-400 font-normal line-clamp-1">
                          "{req.message}"
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{req.email}</div>
                      <div className="text-[11px] text-slate-400">{req.phone_number}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px]">
                      {req.national_id || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-[11px] font-medium text-slate-500">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/60">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-700/60">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(req)
                          setViewModalOpen(true)
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenRejectModal(req)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Reject"
                          >
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Approve"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold">
              Page {meta.current_page} of {meta.last_page} ({meta.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Application Details</h3>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Applicant Name</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm">{selectedRequest.full_name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Email</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedRequest.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Phone</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedRequest.phone_number}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">National ID</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedRequest.national_id || 'N/A'}</span>
              </div>

              {selectedRequest.message && (
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Message</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">{selectedRequest.message}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 rounded-xl text-rose-700 dark:text-rose-300">
                  <span className="font-bold uppercase text-[10px] block mb-1">Rejection Reason</span>
                  <p>{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleOpenRejectModal(selectedRequest)}
                  className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
                >
                  Reject
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="px-4 py-2 bg-[#0B6B3A] text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
              <AlertCircle className="w-5 h-5" />
              <h3>Reject Membership Application</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to reject the membership application for <strong className="text-slate-900 dark:text-white">{selectedRequest.full_name}</strong>? Please provide a reason for the applicant.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for rejection..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/30 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
