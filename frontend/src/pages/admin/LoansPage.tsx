import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, Eye, Landmark, Loader2, X, CheckCircle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { adminService } from '../../services/adminService'
import { exportToCSV } from '../../utils/exportToCSV'

export const LoansPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: loanData, isLoading } = useQuery({
    queryKey: ['adminLoans', activeTab, page],
    queryFn: () => adminService.getLoans(activeTab, page)
  })

  // Modals state
  const [reviewLoan, setReviewLoan] = useState<any>(null)
  const [disburseLoan, setDisburseLoan] = useState<any>(null)
  const [detailLoan, setDetailLoan] = useState<any>(null)

  // Review Form State
  const [interestRate, setInterestRate] = useState('')
  const [termMonths, setTermMonths] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  const openReviewModal = (loan: any) => {
    setReviewLoan(loan)
    setInterestRate(loan.interest_rate?.toString() || '12') // Default 12% if none
    setTermMonths(loan.term_months?.toString() || '6') // Default from loan request
    setRejectionReason('')
  }
  
  const handleCloseModals = () => {
    setReviewLoan(null)
    setDisburseLoan(null)
    setDetailLoan(null)
  }

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => adminService.approveLoan(reviewLoan.id, {
      interest_rate: Number(interestRate),
      term_months: Number(termMonths)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLoans'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardMetrics'] })
      handleCloseModals()
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to approve loan.')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: () => adminService.rejectLoan(reviewLoan.id, {
      rejection_reason: rejectionReason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLoans'] })
      handleCloseModals()
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to reject loan.')
    }
  })

  const disburseMutation = useMutation({
    mutationFn: () => adminService.disburseLoan(disburseLoan.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLoans'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardMetrics'] })
      handleCloseModals()
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to disburse loan.')
    }
  })

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'active', label: 'Active' },
    { id: 'closed', label: 'Closed' },
    { id: 'rejected', label: 'Rejected' }
  ]

  const displayLoans = loanData?.data || []
  const totalCount = loanData?.meta?.total || 0
  const currentPage = loanData?.meta?.current_page || 1
  const lastPage = loanData?.meta?.last_page || 1
  const from = loanData?.meta?.from || 0
  const to = loanData?.meta?.to || 0

  const handleExportLoans = () => {
    if (!displayLoans || displayLoans.length === 0) {
      alert('No loan records currently loaded to export.')
      return
    }

    const columns = [
      { header: 'Loan Number', accessor: (row: any) => row.loan_number || '' },
      { header: 'Member Name', accessor: (row: any) => row.user?.name || row.member?.name || 'Member' },
      { header: 'Principal Amount (ETB)', accessor: (row: any) => Number(row.amount || row.principal_amount || 0) },
      { header: 'Purpose', accessor: (row: any) => row.purpose || '' },
      { header: 'Terms (Months)', accessor: (row: any) => row.term_months || '-' },
      { header: 'Interest Rate (%)', accessor: (row: any) => row.interest_rate || '-' },
      { header: 'Status', accessor: (row: any) => row.status || '' },
      { header: 'Created Date', accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '' },
    ]

    exportToCSV('sacco-loans-report.csv', columns, displayLoans)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  return (
    <motion.div 
      className="space-y-6 max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Loan Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, disburse, and track member loans.
          </p>
        </div>
        <button 
          onClick={handleExportLoans}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-full text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8 overflow-x-auto px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">Loan #</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Terms</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">Loading loans...</td>
                </tr>
              ) : displayLoans.length > 0 ? (
                displayLoans.map((loan: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#0B6B3A] dark:text-emerald-400">
                        {loan.loan_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {(loan.user?.name || loan.member?.name || 'Unknown').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{loan.user?.name || loan.member?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-normal mr-1">ETB</span>
                        {Number(loan.amount || loan.principal_amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">{loan.purpose}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white font-medium">{loan.interest_rate || '-'}% interest</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">{loan.term_months || '-'} months</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold ${
                        loan.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50' :
                        loan.status === 'approved' ? 'bg-blue-100 text-blue-700 border border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/50' :
                        loan.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50' :
                        loan.status === 'rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50' :
                        'bg-slate-100 text-slate-600 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {loan.status === 'pending' ? (
                        <button onClick={() => openReviewModal(loan)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#0B6B3A] dark:border-emerald-500 text-[#0B6B3A] dark:text-emerald-400 rounded-full text-xs font-semibold hover:bg-[#ECFDF5] dark:hover:bg-emerald-500/10 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      ) : loan.status === 'approved' ? (
                        <button onClick={() => setDisburseLoan(loan)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B6B3A] dark:bg-emerald-600 text-white rounded-full text-xs font-semibold hover:bg-[#095730] dark:hover:bg-emerald-700 transition-colors">
                          <Landmark className="w-3.5 h-3.5" /> Disburse
                        </button>
                      ) : (
                        <button onClick={() => setDetailLoan(loan)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
                          {loan.status === 'active' ? 'Details' : loan.status === 'closed' ? 'History' : 'Notes'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No loans found in this category.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {from} to {to} of {totalCount} loans
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Prev
            </button>
            <button className="w-8 h-8 rounded bg-[#F1F5F9] dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors">
              {currentPage}
            </button>
            <button 
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={currentPage === lastPage}
              className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal (Consolidated Financial Standing & 3x Limit Review) */}
      <Dialog.Root open={!!reviewLoan} onOpenChange={(open) => !open && handleCloseModals()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Admin Loan Review & Financial Audit
              </Dialog.Title>
              <button onClick={handleCloseModals} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {reviewLoan && (
                <>
                  {/* Applicant & Loan Overview */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Applicant Member</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{reviewLoan.user?.name || reviewLoan.member?.name}</div>
                      <div className="text-xs text-slate-500">{reviewLoan.user?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Requested Loan Amount</div>
                      <div className="text-base font-bold text-[#0B6B3A] dark:text-emerald-400">
                        ETB {Number(reviewLoan.amount || reviewLoan.principal_amount).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">{reviewLoan.purpose} ({reviewLoan.loan_number})</div>
                    </div>
                  </div>

                  {/* Financial Position Breakdown */}
                  {reviewLoan.financial_position && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Applicant Financial Standing & 3x Limit
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-lg">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">Current Savings</span>
                          <strong className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            ETB {Number(reviewLoan.financial_position.current_savings).toLocaleString()}
                          </strong>
                        </div>

                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-lg">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">Share Capital</span>
                          <strong className="text-sm font-bold text-blue-800 dark:text-blue-300">
                            ETB {Number(reviewLoan.financial_position.share_capital).toLocaleString()}
                            <span className="text-xs font-normal text-slate-500 ml-1">({reviewLoan.financial_position.num_shares} shares)</span>
                          </strong>
                        </div>

                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">3x Savings Limit</span>
                          <strong className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            ETB {Number(reviewLoan.financial_position.max_3x_limit).toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      {/* LOAN ELIGIBILITY BANNER */}
                      <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
                        reviewLoan.financial_position.is_eligible_for_approval
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300'
                          : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-300'
                      }`}>
                        {reviewLoan.financial_position.is_eligible_for_approval ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold">
                            {reviewLoan.financial_position.is_within_3x_limit
                              ? '✓ LOAN ELIGIBLE: Amount is within 3x Savings Limit'
                              : reviewLoan.financial_position.all_guarantors_accepted
                                ? '✓ LOAN ELIGIBLE: 3 Guarantors Required & All 3 Have Accepted'
                                : '⚠ LOAN INELIGIBLE: Requires 3 Accepted Guarantors'}
                          </p>
                          <p className="text-xs mt-1 opacity-90">
                            {reviewLoan.financial_position.is_within_3x_limit
                              ? 'No guarantors required because requested loan does not exceed 3x savings balance.'
                              : reviewLoan.financial_position.all_guarantors_accepted
                                ? 'Requested amount exceeds 3x savings limit. Exactly 3 guarantors were selected and all 3 have explicitly accepted.'
                                : 'Requested amount exceeds 3x savings limit. All 3 guarantors must accept their guarantee requests before this loan can be approved.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guarantors Table Section */}
                  {reviewLoan.financial_position?.requires_guarantors && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Required Guarantors Status (3 Required)
                      </h4>
                      {reviewLoan.guarantors && reviewLoan.guarantors.length > 0 ? (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                <th className="px-3 py-2">Guarantor</th>
                                <th className="px-3 py-2">Amount Guaranteed</th>
                                <th className="px-3 py-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {reviewLoan.guarantors.map((g: any, i: number) => (
                                <tr key={i}>
                                  <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white">
                                    {g.name} <span className="text-slate-400 text-[11px]">({g.email || 'Member'})</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                                    ETB {Number(g.amount_guaranteed).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      g.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                      g.status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
                                      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                    }`}>
                                      {g.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                          No guarantors attached to this loan application.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loan Parameters Setup */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Approved Interest Rate (%)</label>
                      <input 
                        type="number" 
                        value={interestRate} 
                        onChange={e => setInterestRate(e.target.value)} 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] text-slate-900 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Approved Term (Months)</label>
                      <input 
                        type="number" 
                        value={termMonths} 
                        onChange={e => setTermMonths(e.target.value)} 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] text-slate-900 dark:text-white" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Rejection Reason (if rejecting)</label>
                    <textarea 
                      value={rejectionReason} 
                      onChange={e => setRejectionReason(e.target.value)} 
                      rows={2}
                      placeholder="Only required if rejecting the loan"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-900 dark:text-white resize-none" 
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <button 
                onClick={() => rejectMutation.mutate()} 
                disabled={rejectMutation.isPending || approveMutation.isPending || !rejectionReason} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-2 border-rose-500 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>

              <button 
                onClick={() => approveMutation.mutate()} 
                disabled={
                  approveMutation.isPending || 
                  rejectMutation.isPending || 
                  !interestRate || 
                  !termMonths || 
                  (reviewLoan?.financial_position?.requires_guarantors && !reviewLoan?.financial_position?.all_guarantors_accepted)
                } 
                title={
                  reviewLoan?.financial_position?.requires_guarantors && !reviewLoan?.financial_position?.all_guarantors_accepted
                    ? "Cannot approve until all 3 guarantors have accepted"
                    : "Approve this loan"
                }
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#0B6B3A] text-white rounded-lg text-sm font-bold hover:bg-[#095730] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve Loan
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Disburse Modal */}
      <Dialog.Root open={!!disburseLoan} onOpenChange={(open) => !open && handleCloseModals()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8" />
            </div>
            <Dialog.Title className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Disburse Loan
            </Dialog.Title>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              You are about to disburse <strong className="text-slate-900 dark:text-white">ETB {Number(disburseLoan?.amount || disburseLoan?.principal_amount || 0).toLocaleString()}</strong> to <strong className="text-slate-900 dark:text-white">{disburseLoan?.user?.name || disburseLoan?.member?.name}</strong>. This will activate the loan and generate the repayment schedule.
            </p>
            <div className="flex gap-3">
              <button onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => disburseMutation.mutate()} 
                disabled={disburseMutation.isPending} 
                className="flex-1 py-2.5 bg-[#0B6B3A] text-white font-bold rounded-lg hover:bg-[#095730] transition-colors flex items-center justify-center gap-2"
              >
                {disburseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Disburse Now
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Details Modal */}
      <Dialog.Root open={!!detailLoan} onOpenChange={(open) => !open && handleCloseModals()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Loan Details
              </Dialog.Title>
              <button onClick={handleCloseModals} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {detailLoan && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Loan Number</div>
                      <div className="font-bold text-slate-900 dark:text-white">{detailLoan.loan_number}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Status</div>
                      <div className="font-bold text-slate-900 dark:text-white capitalize">{detailLoan.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Principal</div>
                      <div className="font-bold text-slate-900 dark:text-white">ETB {Number(detailLoan.amount || detailLoan.principal_amount).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Total Repayable</div>
                      <div className="font-bold text-[#0B6B3A] dark:text-emerald-400">ETB {Number(detailLoan.total_repayable || 0).toLocaleString()}</div>
                    </div>
                    {detailLoan.rejection_reason && (
                      <div className="col-span-2 mt-2 p-3 bg-rose-50 dark:bg-rose-500/10 rounded border border-rose-200 dark:border-rose-900/50">
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">Rejection Reason</div>
                        <div className="text-sm text-rose-700 dark:text-rose-300">{detailLoan.rejection_reason}</div>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      To manage repayments and view the full amortization schedule for this loan, please navigate to the <strong className="text-slate-900 dark:text-white">Repayments</strong> page.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
              <button onClick={handleCloseModals} className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </motion.div>
  )
}
