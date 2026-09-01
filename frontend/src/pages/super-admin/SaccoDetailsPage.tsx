import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Loader2,
  RefreshCw,
  Mail,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminSaccoService } from '../../services/adminSaccoService'
import type { Sacco, ExtendedSaccoDetails } from '../../types'

export const SaccoDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [details, setDetails] = useState<ExtendedSaccoDetails | null>(null)
  const [sacco, setSacco] = useState<Sacco | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  const fetchSaccoDetails = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await adminSaccoService.getSaccoExtendedDetails(id)
      if (response.data) {
        setDetails(response.data)
        setSacco(response.data.sacco)
        if (response.data.sacco.rejection_reason) {
          setRejectionReason(response.data.sacco.rejection_reason)
        }
      }
    } catch {
      // Fallback to simple getSaccoById if details endpoint fails
      try {
        const fallbackRes = await adminSaccoService.getSaccoById(id)
        setSacco(fallbackRes.data)
      } catch (fallbackErr: unknown) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to fetch SACCO details.'
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSaccoDetails()
  }, [fetchSaccoDetails])

  const handleApprove = async () => {
    if (!id || !sacco) return
    setActionLoading(true)
    try {
      const response = await adminSaccoService.approveSacco(id)
      setSacco(response.data || { ...sacco, status: 'approved' })
      toast.success(`${sacco.name} has been approved successfully!`)
      setTimeout(() => navigate('/super-admin/saccos'), 1200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve SACCO.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!id || !sacco) return
    setActionLoading(true)
    try {
      const response = await adminSaccoService.rejectSacco(id, rejectionReason)
      setSacco(response.data || { ...sacco, status: 'rejected', rejection_reason: rejectionReason })
      toast.error(`${sacco.name} application has been rejected.`)
      setTimeout(() => navigate('/super-admin/saccos'), 1200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject SACCO.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-semibold">Loading SACCO details...</span>
        </div>
      </div>
    )
  }

  if (error || !sacco) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-700 dark:text-slate-300 space-y-4 transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">SACCO Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'The requested SACCO could not be found.'}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={fetchSaccoDetails}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
          <Link
            to="/super-admin/saccos"
            className="px-4 py-2 bg-[#0B1727] dark:bg-amber-500 dark:text-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-[#0B1727]/90 transition-colors"
          >
            Back to SACCOs
          </Link>
        </div>
      </div>
    )
  }

  const admin = details?.administrator

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link to="/super-admin/saccos" className="hover:text-slate-900 dark:hover:text-white transition-colors">
          SACCOs
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="text-slate-900 dark:text-white font-bold">{sacco.name}</span>
      </nav>

      {/* Page Title & Status Badge */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            SACCO Details
          </h1>
          <button
            onClick={fetchSaccoDetails}
            disabled={loading}
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Refresh details"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {sacco.status === 'pending' && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FEF9C3] dark:bg-amber-950/80 text-[#854D0E] dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/60">
            <Clock className="w-3.5 h-3.5 text-[#854D0E] dark:text-amber-300" />
            <span>Pending Approval</span>
          </span>
        )}
        {sacco.status === 'approved' && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#DCFCE7] dark:bg-emerald-950/80 text-[#15803D] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-300" />
            <span>Approved</span>
          </span>
        )}
        {sacco.status === 'rejected' && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FEE2E2] dark:bg-rose-950/80 text-[#B91C1C] dark:text-rose-300 border border-rose-200/60 dark:border-rose-700/60">
            <XCircle className="w-3.5 h-3.5 text-[#B91C1C] dark:text-rose-300" />
            <span>Rejected</span>
          </span>
        )}
      </div>

      {/* Top 2 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Registration Details (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 transition-colors">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-slate-800 dark:text-slate-200" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Registration Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1 uppercase tracking-wide">
                SACCO Name
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {sacco.name}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1 uppercase tracking-wide">
                Registration Number
              </span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                {sacco.registration_number}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1 uppercase tracking-wide">
                Status
              </span>
              <span className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
                {sacco.status}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1 uppercase tracking-wide">
                Date Submitted
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {sacco.created_at ? new Date(sacco.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {sacco.rejection_reason && (
              <div className="md:col-span-2 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 p-3.5 rounded-xl">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block mb-1 uppercase tracking-wide">
                  Rejection Reason
                </span>
                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                  {sacco.rejection_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Administrator Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-slate-800 dark:text-slate-200" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Administrator Details
              </h2>
            </div>

            {admin ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#0B1727] dark:bg-slate-800 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                    {admin.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {admin.name}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      @{admin.username}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Primary SACCO Administrator</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                No administrator user registered yet for this SACCO.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Card: Operational Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 transition-colors">
        <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-slate-800 dark:text-slate-200" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Operational Preview
            </h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
            {sacco.status === 'approved' ? 'Active SACCO' : 'Pre-activation state'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border-l-[4px] border-l-slate-900 dark:border-l-slate-100 border border-slate-200/60 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Member Count
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(sacco.members_count ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border-l-[4px] border-l-emerald-500 border border-slate-200/60 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Total Savings
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(details?.total_savings ?? 0)}
            </span>
          </div>
          <div className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border-l-[4px] border-l-amber-500 border border-slate-200/60 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Active Loans
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(details?.active_loans_count ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Card: Review Decision */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
          Review Decision
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="rejectionReason"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2"
            >
              Rejection Reason (Optional Notes)
            </label>
            <textarea
              id="rejectionReason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={sacco.status !== 'pending'}
              placeholder="Enter optional notes..."
              className="w-full p-3.5 bg-slate-50/40 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              disabled={actionLoading || sacco.status !== 'pending'}
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-rose-600 dark:border-rose-900/60 bg-white dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 stroke-[2.5]" />}
              <span>Reject SACCO</span>
            </button>
            <button
              disabled={actionLoading || sacco.status !== 'pending'}
              onClick={handleApprove}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white text-sm font-bold transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
              <span>Approve SACCO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
