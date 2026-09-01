import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Users, Wallet, CreditCard, AlertTriangle, PieChart,
  ArrowUpRight, TrendingUp, Download
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts'
import { adminService } from '../../services/adminService'
import { useAuthStore } from '../../stores/auth'
import { exportToCSV } from '../../utils/exportToCSV'
import { format } from 'date-fns'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  // Fetch Metrics
  const { data: metrics } = useQuery({
    queryKey: ['adminDashboardMetrics'],
    queryFn: adminService.getDashboardMetrics
  })

  // Fetch Charts Data
  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ['adminDashboardCharts'],
    queryFn: adminService.getDashboardCharts
  })

  // Fetch Activity Data
  const { data: activities, isLoading: loadingActivity } = useQuery({
    queryKey: ['adminDashboardActivity'],
    queryFn: adminService.getDashboardActivity
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount)
  }
  
  const formatCompact = (amount: number) => {
    if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(0)}K`
    return `ETB ${amount}`
  }

  // Chart Colors
  const COLORS = {
    active: '#0B6B3A',
    pending: '#F59E0B',
    closed: '#10B981',
    rejected: '#EF4444'
  }

  const handleExportReport = () => {
    if (!metrics) {
      alert('No dashboard metrics available to export.')
      return
    }

    const rows = [
      { metric: 'Total Members', value: metrics.total_members?.value || 0, details: `+${metrics.total_members?.change || 0} this month` },
      { metric: 'Total Savings', value: `ETB ${metrics.total_savings?.value || 0}`, details: `+ETB ${metrics.total_savings?.change || 0} this month` },
      { metric: 'Active Loans', value: metrics.active_loans?.value || 0, details: `ETB ${metrics.active_loans?.outstanding_amount || 0} outstanding` },
      { metric: 'Overdue Repayments', value: metrics.overdue_repayments?.count || 0, details: `ETB ${metrics.overdue_repayments?.amount || 0} total overdue` },
      { metric: 'Share Capital', value: `ETB ${metrics.share_capital?.value || 0}`, details: `${metrics.share_capital?.total_shares || 0} total shares` },
    ]

    const columns = [
      { header: 'Metric', accessor: (row: any) => row.metric },
      { header: 'Value', accessor: (row: any) => row.value },
      { header: 'Details', accessor: (row: any) => row.details },
    ]

    exportToCSV('sacco-dashboard-report.csv', columns, rows)
  }

  return (
    <motion.div 
      className="space-y-6 max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.name || 'Admin'} • {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button 
            onClick={() => navigate('/admin/savings')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6B3A] text-white rounded-lg text-sm font-medium hover:bg-[#095730] transition-colors shadow-sm cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Members */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[140px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.total_members.value || 0}</div>
            <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{metrics?.total_members.change || 0} this month</span>
            </div>
          </div>
        </div>

        {/* Total Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[140px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Savings</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCompact(metrics?.total_savings.value || 0)}</div>
            <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{formatCurrency(metrics?.total_savings.change || 0)} this month</span>
            </div>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[140px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Loans</span>
            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.active_loans.value || 0}</div>
            <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatCompact(metrics?.active_loans.outstanding_amount || 0)} outstanding
            </div>
          </div>
        </div>

        {/* Overdue Repayments (Highlighted) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-rose-500 flex flex-col justify-between h-[140px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Overdue Repayments</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.overdue_repayments.count || 0}</div>
            <div className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics?.overdue_repayments.amount || 0)} overdue
            </div>
          </div>
        </div>

        {/* Share Capital */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[140px] transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Share Capital</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCompact(metrics?.share_capital.value || 0)}</div>
            <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {metrics?.share_capital.total_shares || 0} shares total
            </div>
          </div>
        </div>
      </motion.div>

      {/* Middle Row: Charts */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Savings & Loans Trend (Last 6 Months)</h3>
          </div>
          <div className="h-[300px] w-full">
            {loadingCharts ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">Loading chart...</div>
            ) : charts?.trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `ETB ${(val/1000)}K`} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="savings" name="Savings" stroke="#0B6B3A" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="loans" name="Loans" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">No chart data available</div>
            )}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Loan Status Distribution</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
            {loadingCharts ? (
              <div className="text-slate-400 dark:text-slate-500">Loading chart...</div>
            ) : charts?.loan_distribution ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <RechartsPieChart>
                    <Pie
                      data={charts.loan_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {charts.loan_distribution.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[(entry.name || '').toLowerCase() as keyof typeof COLORS] || '#CBD5E1'} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [value, 'Loans']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {charts.loan_distribution.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Loans</span>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full px-4">
                  {charts.loan_distribution.map((entry: any, index: number) => {
                    const total = charts.loan_distribution.reduce((acc: number, curr: any) => acc + curr.value, 0)
                    const percent = Math.round((entry.value / total) * 100)
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(entry.name || '').toLowerCase() as keyof typeof COLORS] || '#CBD5E1' }}></span>
                        <span className="capitalize">{entry.name || 'Unknown'} ({percent}%)</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-slate-400 dark:text-slate-500">No chart data available</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bottom Row: Recent Activity Table */}
      <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <button className="text-sm font-semibold text-[#0B6B3A] dark:text-emerald-400 hover:text-[#095730] dark:hover:text-emerald-300">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loadingActivity ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">Loading activity...</td>
                </tr>
              ) : activities && activities.length > 0 ? (
                activities.map((activity: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {format(new Date(activity.date), 'MMM d, yyyy • h:mm a')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {activity.member_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 dark:text-slate-400 capitalize">{activity.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {activity.description}
                    </td>
                    <td className={`px-6 py-4 font-semibold text-right whitespace-nowrap ${
                      activity.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                      activity.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {activity.amount > 0 ? '+' : ''}{formatCurrency(activity.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        activity.status === 'completed' || activity.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        activity.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        activity.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {activity.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
