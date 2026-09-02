import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Search, CheckCircle2, Download, PlusCircle, Loader2, Clock, Check, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { exportToCSV } from '../../utils/exportToCSV'
import type { LoanSchedule } from '../../types'

export const RepaymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'overdue' | 'requests'>('record')
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Payment form state
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState('manual')

  // Payment Request Rejection Modal State
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const queryClient = useQueryClient()

  // Fetch pending payment requests
  const { data: paymentRequestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['adminPaymentRequests', 'pending'],
    queryFn: () => adminService.getPaymentRequests('pending')
  })
  const pendingPaymentRequests = paymentRequestsData?.data || []

  // Approve Payment Request Mutation
  const approveRequestMutation = useMutation({
    mutationFn: (id: number) => adminService.approvePaymentRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['adminActiveLoans'] })
      queryClient.invalidateQueries({ queryKey: ['adminOverdueRepayments'] })
      if (selectedLoanId) {
        queryClient.invalidateQueries({ queryKey: ['adminLoanDetails', selectedLoanId] })
      }
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Approval failed.')
    }
  })

  // Reject Payment Request Mutation
  const rejectRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.rejectPaymentRequest(id, { rejection_reason: reason }),
    onSuccess: () => {
      setRejectingRequestId(null)
      setRejectionReason('')
      queryClient.invalidateQueries({ queryKey: ['adminPaymentRequests'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Rejection failed.')
    }
  })

  // Fetch active loans for search
  const { data: loansData } = useQuery({
    queryKey: ['adminActiveLoans'],
    queryFn: () => adminService.getLoans('active', 1)
  })

  // Fetch selected loan details
  const { data: selectedLoan, isLoading: isLoanLoading } = useQuery({
    queryKey: ['adminLoanDetails', selectedLoanId],
    queryFn: () => selectedLoanId ? adminService.getLoanDetails(selectedLoanId) : null,
    enabled: !!selectedLoanId
  })

  // Fetch overdue stats / items
  const { data: overdueData, isLoading: isOverdueLoading } = useQuery({
    queryKey: ['adminOverdueRepayments'],
    queryFn: () => adminService.getOverdueRepayments()
  })

  const activeLoans = loansData?.data || []
  const searchResults = activeLoans.filter((l: any) => {
    const memberName = (l.user?.name || l.member?.name || '').toLowerCase()
    const loanNum = (l.loan_number || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return loanNum.includes(q) || memberName.includes(q)
  })

  // Normalize schedule array across backend LoanResource (repayment_schedule) and fallback (schedules)
  const scheduleData: LoanSchedule[] = selectedLoan?.repayment_schedule || selectedLoan?.schedules || []
  
  const unpaidSchedules = scheduleData.filter(s => {
    const due = Number(s.total_due ?? s.amount_due ?? 0) + Number((s as any).penalty_amount || 0)
    const paid = Number(s.amount_paid ?? 0)
    return s.status !== 'paid' && paid < due
  })
  
  // Calculate total repaid amount and progress
  const totalRepayable = Number(selectedLoan?.total_repayable || scheduleData.reduce((sum, s) => sum + Number(s.total_due ?? s.amount_due ?? 0) + Number((s as any).penalty_amount || 0), 0))
  const repaidAmount = scheduleData.reduce((sum, s) => {
    const due = Number(s.total_due ?? s.amount_due ?? 0) + Number((s as any).penalty_amount || 0)
    const paid = Number(s.amount_paid ?? (s.status === 'paid' ? due : 0))
    return sum + paid
  }, 0)

  const progressPercent = totalRepayable > 0 ? Math.min(100, (repaidAmount / totalRepayable) * 100) : 0

  const paymentMutation = useMutation({
    mutationFn: (data: { schedule_id: number, amount_paid: number, payment_date: string, method?: string }) => {
      return adminService.recordRepayment(selectedLoanId!, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLoanDetails', selectedLoanId] })
      queryClient.invalidateQueries({ queryKey: ['adminActiveLoans'] })
      queryClient.invalidateQueries({ queryKey: ['adminOverdueRepayments'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardMetrics'] })
      setIsPaymentModalOpen(false)
      setSelectedScheduleId(null)
      setAmountPaid('')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to record repayment.')
    }
  })

  const handleOpenPaymentModal = (scheduleId?: number, defaultAmount?: number) => {
    if (scheduleId) {
      setSelectedScheduleId(scheduleId)
    } else if (unpaidSchedules.length > 0) {
      setSelectedScheduleId(unpaidSchedules[0].id)
    }
    
    if (defaultAmount !== undefined) {
      setAmountPaid(defaultAmount.toString())
    } else if (scheduleId) {
      const item = scheduleData.find(s => s.id === scheduleId)
      if (item) {
        const due = Number(item.total_due ?? item.amount_due ?? 0)
        const paid = Number(item.amount_paid ?? 0)
        setAmountPaid(Math.max(0, due - paid).toString())
      }
    } else if (unpaidSchedules.length > 0) {
      const item = unpaidSchedules[0]
      const due = Number(item.total_due ?? item.amount_due ?? 0)
      const paid = Number(item.amount_paid ?? 0)
      setAmountPaid(Math.max(0, due - paid).toString())
    }
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoanId || !selectedScheduleId || !amountPaid || isNaN(Number(amountPaid))) return
    paymentMutation.mutate({
      schedule_id: selectedScheduleId,
      amount_paid: Number(amountPaid),
      payment_date: paymentDate,
      method: paymentMethod
    })
  }

  const handleExportSchedule = () => {
    if (!selectedLoan || !scheduleData || scheduleData.length === 0) {
      alert('No repayment schedule available to export. Please select a loan account first.')
      return
    }

    const columns = [
      { header: 'Installment Number', accessor: (row: any) => row.installment_number },
      { header: 'Due Date', accessor: (row: any) => row.due_date },
      { header: 'Amount Due (ETB)', accessor: (row: any) => Number(row.total_due ?? row.amount_due ?? 0) },
      { header: 'Paid Amount (ETB)', accessor: (row: any) => Number(row.amount_paid ?? (row.status === 'paid' ? (row.total_due ?? row.amount_due ?? 0) : 0)) },
      { header: 'Status', accessor: (row: any) => row.status },
    ]

    const loanNum = selectedLoan.loan_number ? selectedLoan.loan_number : `loan-${selectedLoan.id}`
    exportToCSV(`loan-${loanNum}-repayment-schedule.csv`, columns, scheduleData)
  }

  const handlePayOverdueItem = (item: any) => {
    const loanId = item.loan?.id
    const scheduleId = item.schedule_entry?.id
    const remaining = Number(item.schedule_entry?.total_due ?? 0) - Number(item.schedule_entry?.amount_paid ?? 0)
    setSelectedLoanId(loanId)
    setSelectedScheduleId(scheduleId)
    setAmountPaid(remaining > 0 ? remaining.toString() : '0')
    setIsPaymentModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  const memberName = selectedLoan?.user?.name || selectedLoan?.member?.name || 'Member'
  const memberCode = selectedLoan?.user?.id ? `MEM-${selectedLoan.user.id.toString().padStart(3, '0')}` : `Loan ID: ${selectedLoan?.loan_number}`

  return (
    <motion.div 
      className="space-y-6 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Repayments</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review payment requests, record loan installments, and track overdue payments.
        </p>
      </div>

      {/* Overdue Alert Banner */}
      {overdueData && overdueData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 border-dashed rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-rose-500 dark:text-rose-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-rose-700 dark:text-rose-400 font-bold text-lg">Attention Required</h3>
              <p className="text-rose-600 dark:text-rose-300 text-sm mt-0.5 font-medium">
                {overdueData.length} overdue installment{overdueData.length > 1 ? 's' : ''} detected across active SACCO loans.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('overdue')}
            className="px-5 py-2.5 bg-rose-500 text-white font-semibold text-sm rounded-full shadow-sm hover:bg-rose-600 dark:hover:bg-rose-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            View Overdue ({overdueData.length})
          </button>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 border-b-2 font-medium text-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Pending Requests
            {pendingPaymentRequests.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 rounded-full font-bold">
                {pendingPaymentRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('record')}
            className={`py-4 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === 'record'
                ? 'border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Direct Repayment
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`py-4 border-b-2 font-medium text-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'overdue'
                ? 'border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Overdue Installments
            {overdueData && overdueData.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-full font-bold">
                {overdueData.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Pending Payment Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pending Member Payment Submissions ({pendingPaymentRequests.length})
              </h3>
            </div>
          </div>

          {isRequestsLoading ? (
            <div className="px-6 py-8 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading payment requests...
            </div>
          ) : pendingPaymentRequests.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No pending payment requests to review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Loan / Installment</th>
                    <th className="px-6 py-3">Amount Paid</th>
                    <th className="px-6 py-3">Method / Ref</th>
                    <th className="px-6 py-3">Requested Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingPaymentRequests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {req.member?.name || `Member #${req.member_id}`}
                        <div className="text-xs font-normal text-slate-400">{req.member?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {req.loan?.loan_number || `Loan #${req.loan_id}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          Inst #{req.loan_schedule?.installment_number ?? '-'} (Due: {req.loan_schedule?.due_date ?? '-'})
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(Number(req.amount))}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <span className="capitalize font-medium">{req.method?.replace('_', ' ') || 'Manual'}</span>
                        {req.notes && <div className="text-xs text-slate-400 mt-0.5">{req.notes}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : req.payment_date || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => approveRequestMutation.mutate(req.id)}
                            disabled={approveRequestMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingRequestId(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Tab */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Loan Search & Progress */}
          <div className="space-y-6">
            {/* Select Loan Box */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors relative">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Select Loan Account</h3>
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Member Name or Loan # (e.g. LN-2026-004)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] transition-all"
                />
              </div>

              {isSearchFocused && searchQuery && (
                <div className="absolute z-20 left-5 right-5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((loan: any) => {
                    const name = loan.user?.name || loan.member?.name || 'Member'
                    const amount = Number(loan.amount || loan.principal_amount || 0)
                    return (
                      <button
                        key={loan.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setSelectedLoanId(loan.id)
                          setSearchQuery('')
                          setIsSearchFocused(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex justify-between items-center transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-700 cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{name}</div>
                          <div className="text-xs text-slate-500">{loan.loan_number}</div>
                        </div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ETB {amount.toLocaleString()}
                        </div>
                      </button>
                    )
                  })}
                  {searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No active loans found matching query.</div>
                  )}
                </div>
              )}

              {isLoanLoading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0B6B3A]" /> Loading loan details...
                </div>
              ) : selectedLoanId && selectedLoan ? (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        {memberName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{memberName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {selectedLoan.loan_number} • {memberCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  Search and click a loan above to view repayment schedule
                </div>
              )}
            </div>

            {/* Loan Progress Box */}
            {selectedLoanId && selectedLoan && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Loan Progress</h3>
                
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Repaid Amount</div>
                    <div className="text-xl font-extrabold text-[#0B6B3A] dark:text-emerald-400">ETB {repaidAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Total Loan</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">ETB {totalRepayable.toLocaleString()}</div>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[#0B6B3A] dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
                  {progressPercent.toFixed(1)}% Completed
                </div>

                <button 
                  onClick={() => handleOpenPaymentModal()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0B6B3A] text-white rounded-lg text-sm font-semibold hover:bg-[#095730] transition-colors shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Record Direct Payment
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Schedule Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Repayment Schedule</h3>
                {selectedLoan && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {scheduleData.length} installment{scheduleData.length > 1 ? 's' : ''} total for {selectedLoan.loan_number}
                  </p>
                )}
              </div>
              {selectedLoanId && (
                <button 
                  onClick={handleExportSchedule}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0B6B3A] dark:text-emerald-400 hover:text-[#095730] dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Schedule
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Inst.</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Amount (ETB)</th>
                    <th className="px-6 py-4 text-right">Paid (ETB)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {selectedLoanId ? (
                    scheduleData.length > 0 ? (
                      scheduleData.map((row: any, idx: number) => {
                        const penalty = Number(row.penalty_amount || 0)
                        const dueAmount = Number(row.total_due ?? row.amount_due ?? 0) + penalty
                        const paidAmount = Number(row.amount_paid ?? (row.status === 'paid' ? dueAmount : 0))
                        const remaining = Math.max(0, dueAmount - paidAmount)

                        return (
                          <tr key={row.id || idx} className={`
                            transition-colors
                            ${row.status === 'paid' ? 'bg-slate-50/50 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                            ${row.status === 'overdue' ? 'bg-rose-50/20 dark:bg-rose-500/5' : ''}
                          `}>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {row.installment_number?.toString().padStart(2, '0')}
                            </td>
                            <td className={`px-6 py-4 font-medium ${row.status === 'overdue' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                              {row.due_date}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                              <div>{dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              {penalty > 0 && (
                                <div className="text-[10px] text-rose-500 font-semibold">+ {penalty.toLocaleString()} penalty</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                              {paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-center capitalize">
                              {row.status === 'paid' && (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  Paid
                                </span>
                              )}
                              {row.status === 'overdue' && (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50">
                                  Overdue
                                </span>
                              )}
                              {(row.status === 'pending' || row.status === 'partial') && (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                  {row.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {row.status !== 'paid' && remaining > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(row.id, remaining)}
                                  className="px-3 py-1 bg-[#0B6B3A] text-white text-xs font-semibold rounded hover:bg-[#095730] transition-colors cursor-pointer shadow-sm"
                                >
                                  Pay
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Complete</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                          No schedules found for this loan.
                        </td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        Select a loan from the search box on the left to view its repayment schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Installments Tab */}
      {activeTab === 'overdue' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Overdue Installments</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All past-due installments requiring repayment follow-up across your SACCO.
              </p>
            </div>
            {overdueData && (
              <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-bold text-xs rounded-full">
                {overdueData.length} Overdue Item{overdueData.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Borrower / Member</th>
                  <th className="px-6 py-4">Loan Number</th>
                  <th className="px-6 py-4 text-center">Inst. #</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Overdue Amount (ETB)</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isOverdueLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      Loading overdue installments...
                    </td>
                  </tr>
                ) : overdueData && overdueData.length > 0 ? (
                  overdueData.map((item: any, idx: number) => {
                    const sched = item.schedule_entry || {}
                    const memberObj = item.member || {}
                    const loanObj = item.loan || {}
                    const total = Number(sched.total_due ?? 0)
                    const penalty = Number(sched.penalty_amount || 0)
                    const paid = Number(sched.amount_paid ?? 0)
                    const overdueAmount = Math.max(0, (total + penalty) - paid)

                    return (
                      <tr key={sched.id || idx} className="hover:bg-rose-50/20 dark:hover:bg-rose-500/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          <div className="font-bold">{memberObj.name || 'Member'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{memberObj.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {loanObj.loan_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                          {sched.installment_number?.toString().padStart(2, '0') || '01'}
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                          {sched.due_date || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-white">
                          <div>{overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          {penalty > 0 && (
                            <div className="text-[10px] text-rose-500 font-semibold">+ {penalty.toLocaleString()} penalty</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handlePayOverdueItem(item)}
                            className="px-3 py-1.5 bg-[#0B6B3A] text-white text-xs font-semibold rounded hover:bg-[#095730] transition-colors cursor-pointer shadow-sm"
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      No overdue installments detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Request Rejection Modal */}
      {rejectingRequestId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Reject Payment Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide a reason for rejecting this payment submission (optional).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Payment receipt invalid or transaction reference not found"
              className="w-full p-3 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectingRequestId(null)
                  setRejectionReason('')
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => rejectRequestMutation.mutate({ id: rejectingRequestId, reason: rejectionReason })}
                disabled={rejectRequestMutation.isPending}
                className="px-4 py-2 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {rejectRequestMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      <Dialog.Root open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
                Record Direct Loan Repayment
              </Dialog.Title>
            </div>

            <form className="p-6 space-y-4" onSubmit={handlePaymentSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Installment Schedule <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedScheduleId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    setSelectedScheduleId(id)
                    const item = scheduleData.find(s => s.id === id)
                    if (item) {
                      const due = Number(item.total_due ?? item.amount_due ?? 0) + Number((item as any).penalty_amount || 0)
                      const paid = Number(item.amount_paid ?? 0)
                      const rem = Math.max(0, due - paid)
                      setAmountPaid(rem > 0 ? rem.toString() : due.toString())
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  required
                >
                  <option value="">Select Installment...</option>
                  {unpaidSchedules.map((s: any) => {
                    const due = Number(s.total_due ?? s.amount_due ?? 0) + Number(s.penalty_amount || 0)
                    const penalty = Number(s.penalty_amount || 0)
                    const paid = Number(s.amount_paid ?? 0)
                    const rem = Math.max(0, due - paid)
                    return (
                      <option key={s.id} value={s.id}>
                        Inst #{s.installment_number} - Due {s.due_date} (Remaining: ETB {rem.toLocaleString()} {penalty > 0 ? `incl. penalty` : ''})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Paid (ETB) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]"
                >
                  <option value="manual">Manual / Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6B3A] text-white rounded-lg text-sm font-semibold hover:bg-[#095730] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {paymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {paymentMutation.isPending ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.div>
  )
}
