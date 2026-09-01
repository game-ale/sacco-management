import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings2, Download, CheckCircle, Calculator } from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { exportToCSV } from '../../utils/exportToCSV'

export const DividendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('new')
  const [period, setPeriod] = useState('FY 2025/2026')
  const [poolAmount, setPoolAmount] = useState('500000')
  const [reservePercentage, setReservePercentage] = useState('20')
  const queryClient = useQueryClient()
  
  const { data: historyData } = useQuery({
    queryKey: ['adminDividendsHistory'],
    queryFn: adminService.getDividendsHistory
  })

  const calculateMutation = useMutation({
    mutationFn: (data: { period: string, total_pool: number, reserve_percentage: number }) => adminService.calculateDividends(data)
  })

  const distributeMutation = useMutation({
    mutationFn: (data: { period: string, total_pool: number, reserve_percentage: number }) => adminService.distributeDividends(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDividendsHistory'] })
      alert('Dividends distributed successfully!')
      setActiveTab('history')
      calculateMutation.reset()
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to distribute dividends')
    }
  })

  const handleCalculate = () => {
    const amount = Number(poolAmount.replace(/,/g, ''))
    const reserve = Number(reservePercentage)
    if (!amount || isNaN(amount) || isNaN(reserve)) return
    calculateMutation.mutate({ period, total_pool: amount, reserve_percentage: reserve })
  }

  const handleCommit = () => {
    if (!calculateMutation.data) return
    const amount = Number(poolAmount.replace(/,/g, ''))
    const reserve = Number(reservePercentage)
    distributeMutation.mutate({ period, total_pool: amount, reserve_percentage: reserve })
  }

  const handleExportDividends = () => {
    if (!previewData || previewData.length === 0) {
      alert('No dividend distribution calculation data available to export. Please calculate dividends first.')
      return
    }

    const columns = [
      { header: 'Member Name', accessor: (row: any) => row.member_name || row.name || 'Member' },
      { header: 'Shares Held', accessor: (row: any) => row.num_shares || row.shares || 0 },
      { header: 'Ownership Percentage (%)', accessor: (row: any) => row.ownership_percentage ?? row.ownership_pct ?? 0 },
      { header: 'Dividend Amount (ETB)', accessor: (row: any) => Number(row.dividend_amount ?? row.amount ?? 0) },
    ]

    exportToCSV('sacco-dividends-report.csv', columns, previewData)
  }

  const handleExportDividends = () => {
    if (!previewData || previewData.length === 0) {
      alert('No dividend distribution calculation data available to export. Please calculate dividends first.')
      return
    }

    const columns = [
      { header: 'Member Name', accessor: (row: any) => row.member_name || row.name || 'Member' },
      { header: 'Shares Held', accessor: (row: any) => row.num_shares || row.shares || 0 },
      { header: 'Ownership Percentage (%)', accessor: (row: any) => row.ownership_percentage ?? row.ownership_pct ?? 0 },
      { header: 'Dividend Amount (ETB)', accessor: (row: any) => Number(row.dividend_amount ?? row.amount ?? 0) },
    ]

    exportToCSV('sacco-dividends-report.csv', columns, previewData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(amount)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  const calculationData = calculateMutation.data
  const previewData = calculationData?.preview || []

  return (
    <motion.div 
      className="space-y-6 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dividends</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Calculate and distribute dividends to members based on shareholding.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('new')}
            className={`py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            New Distribution
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {activeTab === 'new' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column: Setup */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Settings2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Distribution Setup</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Financial Period</label>
                  <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  >
                    <option value="FY 2025/2026">FY 2025/2026</option>
                    <option value="FY 2024/2025">FY 2024/2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Dividend Pool (ETB)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">ETB</span>
                    <input 
                      type="text" 
                      value={poolAmount}
                      onChange={(e) => setPoolAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 text-lg font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Statutory Reserve (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={reservePercentage}
                      onChange={(e) => setReservePercentage(e.target.value)}
                      min="0" max="100"
                      className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">%</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Required percentage to hold back before distribution.</p>
                </div>

                <button 
                  onClick={handleCalculate}
                  disabled={calculateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B6B3A] dark:bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-[#095730] dark:hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {calculateMutation.isPending ? 'Calculating...' : 'Calculate Distribution'}
                </button>
              </div>
            </div>

            {calculationData && (
              <div className="bg-[#0B6B3A] dark:bg-slate-800 p-6 rounded-xl shadow-md border border-transparent dark:border-slate-700 text-white transition-colors">
                <h4 className="text-xs font-bold text-emerald-100 dark:text-emerald-400 uppercase tracking-wider mb-5">Calculation Summary</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10 dark:border-slate-700">
                    <span className="text-emerald-100/80 dark:text-slate-400 text-sm">Pool Amount</span>
                    <span className="font-bold text-xl dark:text-white">
                      <span className="text-sm font-medium text-emerald-200 dark:text-emerald-400 mr-1">ETB</span>
                      {formatCurrency(calculationData.total_pool)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/10 dark:border-slate-700">
                    <span className="text-emerald-100/80 dark:text-slate-400 text-sm">Statutory Reserve ({calculationData.reserve_percentage}%)</span>
                    <span className="font-bold text-lg dark:text-white text-emerald-200">
                      -{formatCurrency(calculationData.reserve_amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-white/10 dark:border-slate-700">
                    <span className="text-emerald-100/80 dark:text-slate-400 text-sm">Distributable</span>
                    <span className="font-bold text-lg dark:text-white">
                      {formatCurrency(calculationData.distributable_pool)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="block text-emerald-100/80 dark:text-slate-400 text-xs font-medium mb-1">Share Pool (70%)</span>
                      <span className="font-bold text-lg text-emerald-100 dark:text-emerald-400">
                        {formatCurrency(calculationData.share_pool)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-emerald-100/80 dark:text-slate-400 text-xs font-medium mb-1">Savings Pool (30%)</span>
                      <span className="font-bold text-lg text-emerald-100 dark:text-emerald-400">
                        {formatCurrency(calculationData.savings_pool)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Member Distribution Preview</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Based on shareholding as of end of period.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleExportDividends}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
                <button 
                  onClick={handleCommit}
                  disabled={!calculationData || distributeMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> 
                  {distributeMutation.isPending ? 'Committing...' : 'Commit'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4 text-center">Shares</th>
                    <th className="px-6 py-4 text-center">Savings (ETB)</th>
                    <th className="px-6 py-4 text-right">Share Div</th>
                    <th className="px-6 py-4 text-right">Sav. Int</th>
                    <th className="px-6 py-4 text-right">Total (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {previewData.length > 0 ? previewData.map((row: any) => (
                    <tr key={row.member_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {row.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">MEM-{row.member_id.toString().padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                        {row.shares} <span className="text-[10px] text-slate-400">({row.share_pct}%)</span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                        {formatCurrency(row.savings_balance)} <span className="text-[10px] text-slate-400">({row.savings_pct}%)</span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(row.share_dividend_amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(row.savings_interest_amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        Enter total pool amount and click Calculate Distribution to see the preview.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 text-center">
              {previewData.length > 0 ? `Showing ${previewData.length} members.` : 'No data to show.'}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        historyData && historyData.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Total Pool (ETB)</th>
                    <th className="px-6 py-4 text-center">Members</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {historyData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.period}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.distribution_date}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#0B6B3A] dark:text-emerald-400">
                        {row.total_pool.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">{row.member_count}</td>
                      <td className="px-6 py-4 text-center capitalize">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
          >
            <Calculator className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Past Distributions</h3>
            <p className="text-sm">There is no dividend history recorded for this SACCO.</p>
          </motion.div>
        )
      )}
    </motion.div>
  )
}

