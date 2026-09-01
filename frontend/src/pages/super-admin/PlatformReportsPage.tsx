import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Area, AreaChart, Legend
} from 'recharts'
import {
  TrendingUp,
  Wallet,
  CreditCard,
  Users,
  Download,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { superAdminReportsService } from '../../services/superAdminReportsService'
import { adminSaccoService } from '../../services/adminSaccoService'
import { toast } from 'sonner'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const PlatformReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('1Y')
  const [sort, setSort] = useState('savings_desc')
  const [exporting, setExporting] = useState(false)

  const { data: overview, isLoading: loadingOverview, isError: overviewError } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: superAdminReportsService.getOverview,
  })

  const { data: trends, isLoading: loadingTrends, isError: trendsError } = useQuery({
    queryKey: ['reports-trends', period],
    queryFn: () => superAdminReportsService.getGrowthTrends(period),
  })

  const { data: comparison, isLoading: loadingComparison, isError: comparisonError } = useQuery({
    queryKey: ['reports-comparison', sort],
    queryFn: () => superAdminReportsService.getSaccoComparison(sort),
  })

  const { data: geography, isLoading: loadingGeography, isError: geographyError } = useQuery({
    queryKey: ['reports-geography'],
    queryFn: superAdminReportsService.getGeographicDistribution,
  })

  const handleExportReport = async () => {
    try {
      setExporting(true)
      await adminSaccoService.exportSaccos()
      toast.success('Platform report exported successfully.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export report.'
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aggregate analytics and performance comparison across all registered SACCOs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Savings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Savings</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {loadingOverview ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : overviewError ? (
                  <span className="text-sm font-medium text-rose-500">Error loading</span>
                ) : (
                  formatCurrency(overview?.data?.total_savings || 0)
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Loans */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loans Disbursed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {loadingOverview ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : overviewError ? (
                  <span className="text-sm font-medium text-rose-500">Error loading</span>
                ) : (
                  formatCurrency(overview?.data?.total_loans_disbursed || 0)
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Repayments */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Repayments</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {loadingOverview ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : overviewError ? (
                  <span className="text-sm font-medium text-rose-500">Error loading</span>
                ) : (
                  formatCurrency(overview?.data?.total_repayments_collected || 0)
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Growth */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Growth</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                {loadingOverview ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : overviewError ? (
                  <span className="text-sm font-medium text-rose-500">Error</span>
                ) : (
                  <>
                    {overview?.data?.platform_growth || 0}%
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">This Month</span>
                  </>
                )}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Growth Trends</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cumulative savings and loans over time</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {['3M', '6M', '1Y', 'All'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    period === p ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loadingTrends ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading chart data...</span>
              </div>
            ) : trendsError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 gap-2">
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm font-medium">Failed to load platform growth trends.</span>
              </div>
            ) : !trends?.data || trends.data.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                <span>No growth trend data available.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey={period === 'All' ? 'month' : 'month_short'} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="savings" name="Savings" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
                  <Area type="monotone" dataKey="loans" name="Loans" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorLoans)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Geographic Distribution</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">SACCOs by region</p>
          </div>
          
          <div className="h-[260px] w-full">
            {loadingGeography ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading distribution...</span>
              </div>
            ) : geographyError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 gap-2">
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm font-medium">Failed to load geographic data.</span>
              </div>
            ) : !geography?.data || geography.data.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                <span>No geographic data available.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geography.data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="region" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={110} />
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                  />
                  <Bar dataKey="count" name="SACCOs" radius={[0, 4, 4, 0]} barSize={20}>
                    {geography.data.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#F59E0B' : '#64748B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* SACCO Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">SACCO Performance Comparison</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="savings_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Highest Savings</option>
              <option value="savings_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Lowest Savings</option>
              <option value="members_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Most Members</option>
              <option value="repayment_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Best Repayment Rate</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th className="px-5 py-3">SACCO Name</th>
                <th className="px-5 py-3 text-right">Members</th>
                <th className="px-5 py-3 text-right">Total Savings</th>
                <th className="px-5 py-3 text-right">Active Loans</th>
                <th className="px-5 py-3 text-right">Repayment Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingComparison ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      <span>Loading comparison data...</span>
                    </div>
                  </td>
                </tr>
              ) : comparisonError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-rose-500 font-medium">
                    Failed to load SACCO comparison data.
                  </td>
                </tr>
              ) : !comparison?.data || comparison.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    No SACCO comparison data available.
                  </td>
                </tr>
              ) : (
                comparison.data.map((sacco: any) => (
                  <tr key={sacco.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{sacco.name}</td>
                    <td className="px-5 py-4 text-right">{sacco.members_count}</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(sacco.total_savings)}</td>
                    <td className="px-5 py-4 text-right">{sacco.active_loans_count}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${sacco.repayment_rate >= 90 ? 'bg-emerald-500' : sacco.repayment_rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.min(100, Math.max(0, sacco.repayment_rate))}%` }}
                          />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300 w-9">{sacco.repayment_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
