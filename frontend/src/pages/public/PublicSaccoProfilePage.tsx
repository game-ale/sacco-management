import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Coins,
  ShieldCheck,
  ChevronRight,
  Loader2,
  FileText,
  UserCheck,
  ArrowRight,
} from 'lucide-react'
import { publicSaccoService } from '../../services/publicSaccoService'
import type { PublicSacco } from '../../types'
import { MembershipRequestModal } from '../../components/public/MembershipRequestModal'

export const PublicSaccoProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [sacco, setSacco] = useState<PublicSacco | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false)

  const fetchProfile = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await publicSaccoService.getPublicSaccoById(id)
      setSacco(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'SACCO profile not found or not publicly visible.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const formatCurrency = (amount?: number | null) => {
    if (amount == null) return 'N/A'
    return `ETB ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
        <p className="text-xs font-semibold">Loading SACCO profile...</p>
      </div>
    )
  }

  if (error || !sacco) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'The requested SACCO profile is not available.'}</p>
        <Link
          to="/saccos"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B6B3A] text-white text-xs font-bold rounded-xl"
        >
          Back to Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link to="/saccos" className="hover:text-slate-900 dark:hover:text-white transition-colors">
          Directory
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-white font-bold">{sacco.name}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-sm transition-colors relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#0B1727] dark:bg-slate-800 text-white flex items-center justify-center font-extrabold text-3xl shadow-md shrink-0">
              {sacco.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {sacco.name}
                </h1>
                {sacco.is_accepting_members ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Accepting Members</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/60">
                    <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Membership Closed</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                {sacco.category && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sacco.category}</span>
                  </span>
                )}
                {sacco.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sacco.location}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{(sacco.members_count ?? 0).toLocaleString()} Active Members</span>
                </span>
              </div>
            </div>
          </div>

          {sacco.is_accepting_members && (
            <button
              onClick={() => setApplyModalOpen(true)}
              className="px-6 py-3 bg-[#0B6B3A] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Apply for Membership</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Details (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2>About {sacco.name}</h2>
            </div>
            <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {sacco.description || 'No detailed description provided by this SACCO yet.'}
            </p>
          </div>

          {/* Eligibility Criteria */}
          {sacco.eligibility_criteria && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base">
                <FileText className="w-5 h-5 text-amber-500" />
                <h2>Membership Eligibility Criteria</h2>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {sacco.eligibility_criteria}
              </p>
            </div>
          )}

          {/* Share Requirements (if allowed) */}
          {sacco.show_share_info && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base">
                <Coins className="w-5 h-5 text-amber-500" />
                <h2>Share Capital Requirements</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Value Per Share
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(sacco.share_value)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Minimum Required Shares
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {sacco.min_shares ?? 1} shares
                  </span>
                </div>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                    Initial Share Investment
                  </span>
                  <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                    {formatCurrency(sacco.min_share_purchase_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Contact & Location
            </h3>

            <div className="space-y-4 text-xs">
              {sacco.contact_email && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase">Email</span>
                    <a href={`mailto:${sacco.contact_email}`} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      {sacco.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {sacco.contact_phone && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase">Phone</span>
                    <a href={`tel:${sacco.contact_phone}`} className="font-semibold text-slate-900 dark:text-white">
                      {sacco.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {sacco.location && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase">Location</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{sacco.location}</span>
                  </div>
                </div>
              )}
            </div>

            {sacco.is_accepting_members && (
              <div className="pt-2">
                <button
                  onClick={() => setApplyModalOpen(true)}
                  className="w-full py-3 bg-[#0B6B3A] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Apply to Join</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {sacco && (
        <MembershipRequestModal
          sacco={sacco}
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
        />
      )}
    </div>
  )
}
