import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Search,
  MapPin,
  Tag,
  Users,
  CheckCircle2,
  XCircle,
  Coins,
  ChevronRight,
  Loader2,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { publicSaccoService } from '../../services/publicSaccoService'
import type { PublicSacco, PaginationMeta } from '../../types'
import { MembershipRequestModal } from '../../components/public/MembershipRequestModal'

export const PublicSaccoDirectoryPage: React.FC = () => {
  const [saccos, setSaccos] = useState<PublicSacco[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)

  const [selectedSaccoForApply, setSelectedSaccoForApply] = useState<PublicSacco | null>(null)

  const fetchDirectory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await publicSaccoService.getPublicSaccos({
        search: search || undefined,
        location: locationFilter || undefined,
        category: categoryFilter || undefined,
        page: page,
      })
      setSaccos(res.data)
      if (res.meta) {
        setMeta(res.meta)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load public SACCO directory.')
    } finally {
      setLoading(false)
    }
  }, [search, locationFilter, categoryFilter, page])

  useEffect(() => {
    fetchDirectory()
  }, [fetchDirectory])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDirectory()
  }

  const formatCurrency = (amount?: number | null) => {
    if (amount == null) return 'N/A'
    return `ETB ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-linear-to-br from-[#0B1727] via-[#0B2538] to-[#0B6B3A] text-white p-8 lg:p-12 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Public SACCO Directory</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find & Join Verified SACCOs Across Ethiopia
          </h1>
          <p className="text-sm lg:text-base text-slate-300 font-normal leading-relaxed">
            Browse registered, government-approved Savings & Credit Cooperative Organizations. Explore membership terms, share requirements, and apply directly online.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 transition-colors"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SACCO name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 md:flex md:items-center gap-3">
          <div className="relative min-w-[140px]">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="relative min-w-[140px]">
            <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <button
            type="submit"
            className="col-span-2 md:col-span-1 px-5 py-2.5 bg-[#0B6B3A] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </form>

      {/* Directory Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-xs font-semibold">Loading SACCO directory...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-8 rounded-2xl text-center space-y-3">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={fetchDirectory}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
          >
            Try Again
          </button>
        </div>
      ) : saccos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Public SACCOs Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No SACCOs match your current filter parameters. Try clearing your search query or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saccos.map((sacco) => (
            <div
              key={sacco.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-emerald-500/30 transition-all group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B1727] dark:bg-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                      {sacco.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                        {sacco.name}
                      </h3>
                      {sacco.category && (
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {sacco.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  {sacco.is_accepting_members ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Accepting Members</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      <XCircle className="w-3 h-3 text-amber-600" />
                      <span>Membership Closed</span>
                    </span>
                  )}

                  {sacco.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{sacco.location}</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                {sacco.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {sacco.description}
                  </p>
                )}

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Members
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {(sacco.members_count ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {sacco.show_share_info ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Min. Share Investment
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1 text-[11px]">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        {formatCurrency(sacco.min_share_purchase_amount)}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                      Share info private
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Link
                  to={`/saccos/${sacco.id}`}
                  className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                {sacco.is_accepting_members && (
                  <button
                    onClick={() => setSelectedSaccoForApply(sacco)}
                    className="flex-1 py-2.5 px-3 bg-[#0B6B3A] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500">
            Page {meta.current_page} of {meta.last_page} ({meta.total} SACCOs)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      {selectedSaccoForApply && (
        <MembershipRequestModal
          sacco={selectedSaccoForApply}
          isOpen={!!selectedSaccoForApply}
          onClose={() => setSelectedSaccoForApply(null)}
        />
      )}
    </div>
  )
}
