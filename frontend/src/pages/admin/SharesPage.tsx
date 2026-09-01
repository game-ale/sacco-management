import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Tag, PieChart, Landmark, RefreshCw, 
  ArrowUpRight, Users, CheckCircle2, Download 
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { exportToCSV } from '../../utils/exportToCSV'

export const SharesPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminSharesSummary', page, sort],
    queryFn: () => adminService.getSharesSummary(page, sort)
  })

  const summary = data?.summary || {
    share_value: 0,
    total_shares: 0,
    total_capital: 0
  }

  const memberShares = data?.members?.data || []
  const totalMembers = data?.members?.total || 0
  const currentPage = data?.members?.current_page || 1
  const lastPage = data?.members?.last_page || 1
  const from = data?.members?.from || 0
  const to = data?.members?.to || 0

  const handleExportShares = () => {
    if (!memberShares || memberShares.length === 0) {
      alert('No member share distribution data available to export.')
      return
    }

    const columns = [
      { header: 'Member Name', accessor: (row: any) => row.name || 'Member' },
      { header: 'Member Number', accessor: (row: any) => row.member_id || row.id || '' },
      { header: 'Current Shares', accessor: (row: any) => row.shares || 0 },
      { header: 'Share Value (ETB)', accessor: (row: any) => Number(row.share_value || 0) },
      { header: 'Total Capital (ETB)', accessor: (row: any) => Number(row.total_capital || 0) },
      { header: 'Ownership Percentage (%)', accessor: (row: any) => row.ownership_pct ?? 0 },
    ]

    exportToCSV('sacco-share-capital-report.csv', columns, memberShares)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <motion.div 
      className="space-y-6 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Share Capital</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and track member equity distributions.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6B3A] text-white rounded-full text-sm font-semibold hover:bg-[#095730] transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" />
          Update Shares
        </button>
      </motion.div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Share Value */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[160px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Share Value</span>
            <Tag className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
              <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 mr-1">ETB</span>
              {summary.share_value.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Active nominal value</span>
            </div>
          </div>
        </div>

        {/* Total Shares Issued */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[160px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Shares Issued</span>
            <PieChart className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{summary.total_shares.toLocaleString()}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Distributed among {totalMembers} members</span>
            </div>
          </div>
        </div>

        {/* Total Share Capital */}
        <div className="bg-[#0B6B3A] p-6 rounded-xl shadow-md flex flex-col justify-between h-[160px] text-white overflow-hidden relative">
          <Landmark className="w-24 h-24 text-white/10 absolute -right-4 -top-4" />
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Share Capital</span>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold mb-2">
              <span className="text-2xl font-bold text-emerald-200 mr-1">ETB</span>
              {summary.total_capital.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Fully realized capital</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Shares Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Member Shares Distribution</h3>
          <div className="flex items-center gap-3">
            <select 
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
            >
              <option value="">Highest Ownership</option>
              <option value="lowest">Lowest Ownership</option>
              <option value="name">Name A-Z</option>
            </select>
            <button 
              onClick={handleExportShares}
              className="p-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Export Share Distribution"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Member #</th>
                <th className="px-6 py-4 text-center">Current Shares</th>
                <th className="px-6 py-4 text-right">Share Value</th>
                <th className="px-6 py-4 text-right">Total Capital</th>
                <th className="px-6 py-4 w-48">Ownership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">Loading shares data...</td>
                </tr>
              ) : memberShares.map((member: any, idx: number) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{from + idx}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{member.member_id}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">{member.shares}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">ETB {member.share_value.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-[#0B6B3A] dark:text-emerald-400">
                      ETB {member.total_capital.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-10">{member.ownership_pct}%</span>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${member.ownership_pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {from} to {to} of {totalMembers} members
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Prev
            </button>
            <button className="w-7 h-7 rounded bg-[#ECFDF5] dark:bg-emerald-500/10 text-[#0B6B3A] dark:text-emerald-400 font-bold border border-[#0B6B3A]/20 dark:border-emerald-500/20 transition-colors">
              {currentPage}
            </button>
            <button 
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={currentPage === lastPage}
              className="px-3 py-1 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
