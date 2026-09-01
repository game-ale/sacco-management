import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  Clock,
  Users,
  Wallet,
  FileText,
  XCircle,
  X,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { MetricCard } from '../../components/super-admin/MetricCard'
import { toast } from 'sonner'
import { adminSaccoService } from '../../services/adminSaccoService'
import type { Sacco, DashboardStats } from '../../types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export const SuperAdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingList, setPendingList] = useState<Sacco[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [growthData, setGrowthData] = useState<any[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, pendingRes, growthRes] = await Promise.all([
        adminSaccoService.getDashboardStats(),
        adminSaccoService.getSaccos({ status: 'pending' }),
        adminSaccoService.getSaccoGrowth(),
      ])

      if (statsRes.data) {
        setStats(statsRes.data)
      }

      if (pendingRes) {
        setPendingList(pendingRes.data || [])
      }

      if (growthRes.data) {
        // Reverse array to show oldest to newest left to right
        setGrowthData([...growthRes.data].reverse())
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleApprove = async (sacco: Sacco) => {
    setActionLoadingId(sacco.id)
    try {
      await adminSaccoService.approveSacco(sacco.id)
      toast.success(`${sacco.name} has been approved successfully.`)
      fetchDashboardData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve SACCO.'
      toast.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (sacco: Sacco) => {
    setActionLoadingId(sacco.id)
    try {
      await adminSaccoService.rejectSacco(sacco.id)
      toast.error(`${sacco.name} application has been rejected.`)
      fetchDashboardData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject SACCO.'
      toast.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="TOTAL SACCOS"
          value={loading ? '...' : (stats?.total_saccos ?? 0).toLocaleString()}
          icon={Building2}
          accentColor="black"
        />
        <MetricCard
          title="APPROVED SACCOS"
          value={loading ? '...' : (stats?.approved_saccos ?? 0).toLocaleString()}
          icon={CheckCircle2}
          accentColor="green"
        />
        <MetricCard
          title="PENDING APPROVAL"
          value={loading ? '...' : (stats?.pending_saccos ?? 0).toLocaleString()}
          icon={Clock}
          accentColor="amber"
          bgHighlight={true}
        />
        <MetricCard
          title="REJECTED SACCOS"
          value={loading ? '...' : (stats?.rejected_saccos ?? 0).toLocaleString()}
          icon={XCircle}
          accentColor="rose"
        />
        <MetricCard
          title="TOTAL MEMBERS"
          value={loading ? '...' : (stats?.total_members ?? 0).toLocaleString()}
          icon={Users}
          accentColor="blue"
        />
        <MetricCard
          title="TOTAL SAVINGS"
          value={loading ? '...' : formatCurrency(stats?.total_savings ?? 0)}
          icon={Wallet}
          accentColor="green"
        />
        <MetricCard
          title="TOTAL ACTIVE LOANS"
          value={loading ? '...' : (stats?.total_active_loans ?? 0).toLocaleString()}
          icon={FileText}
          accentColor="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* SACCO Growth Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 transition-colors">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">SACCO Growth</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cumulative registered SACCOs over the last 12 months</p>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="month_short" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)', backgroundColor: '#0F172A', color: '#F8FAFC' }}
                  />
                  <Area type="monotone" dataKey="cumulative" name="Total SACCOs" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SACCO Status Donut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col transition-colors">
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">SACCO Status</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Current application distribution</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: stats?.approved_saccos || 0, color: '#10B981' },
                          { name: 'Pending', value: stats?.pending_saccos || 0, color: '#F59E0B' },
                          { name: 'Rejected', value: stats?.rejected_saccos || 0, color: '#F43F5E' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {
                          [
                            { name: 'Approved', value: stats?.approved_saccos || 0, color: '#10B981' },
                            { name: 'Pending', value: stats?.pending_saccos || 0, color: '#F59E0B' },
                            { name: 'Rejected', value: stats?.rejected_saccos || 0, color: '#F43F5E' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))
                        }
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)', backgroundColor: '#0F172A', color: '#F8FAFC' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Approved
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span> Pending
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-[#F43F5E]"></span> Rejected
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pending SACCO Approvals Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden mt-6 transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Pending SACCO Approvals
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/super-admin/saccos?status=pending"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span>Loading pending SACCO approvals...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-rose-500 flex flex-col items-center justify-center gap-2">
              <span>{error}</span>
              <button
                onClick={fetchDashboardData}
                className="mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          ) : pendingList.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No pending SACCO approvals at this time.
            </div>
          ) : (
            pendingList.map((sacco) => (
              <div
                key={sacco.id}
                className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Left Info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100/90 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200/60 dark:border-slate-700">
                    <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <Link
                      to={`/super-admin/saccos/${sacco.id}`}
                      className="text-sm font-bold text-slate-900 dark:text-white leading-snug hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {sacco.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-100/90 dark:bg-slate-800 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {sacco.registration_number}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span>Submitted {sacco.created_at ? new Date(sacco.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                  <button
                    disabled={actionLoadingId === sacco.id}
                    onClick={() => handleReject(sacco)}
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoadingId === sacco.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    <span>Reject</span>
                  </button>
                  <button
                    disabled={actionLoadingId === sacco.id}
                    onClick={() => handleApprove(sacco)}
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoadingId === sacco.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


