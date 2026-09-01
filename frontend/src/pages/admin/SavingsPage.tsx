import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Search, Info, PlusCircle, MinusCircle, 
  Filter, Download, ArrowDownToLine, ArrowUpToLine, Loader2, AlertCircle, X
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { exportToCSV } from '../../utils/exportToCSV'
import type { User } from '../../types'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'

export const SavingsPage: React.FC = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const [page, setPage] = useState(1)

  // Server-side member search using API (loads when focused or typing)
  const { data: searchMembersData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['adminMembersSearch', searchQuery],
    queryFn: () => adminService.getMembers(1, searchQuery),
    enabled: isSearchFocused
  })

  const searchResults = searchMembersData?.data || []

  // Fetch selected member details if ID is present
  const { data: selectedMember, isLoading: isMemberLoading, isError: isMemberError } = useQuery({
    queryKey: ['adminMemberDetails', selectedMemberId],
    queryFn: () => adminService.getMember(selectedMemberId!),
    enabled: !!selectedMemberId
  })

  // Fetch member savings transactions history and balance
  const { data: txData, isLoading: isTxLoading, isError: isTxError } = useQuery({
    queryKey: ['savingsHistory', selectedMemberId, page],
    queryFn: () => adminService.getSavingsTransactions(selectedMemberId || undefined, page),
    enabled: !!selectedMemberId
  })

  const transactions = txData?.transactions?.data || []
  const latestBalance = txData?.balance || 0
  
  // Extract pagination info supporting both Laravel meta wrapper and direct pagination
  const totalTx = txData?.transactions?.meta?.total ?? txData?.transactions?.total ?? 0
  const currentPage = txData?.transactions?.meta?.current_page ?? txData?.transactions?.current_page ?? 1
  const lastPage = txData?.transactions?.meta?.last_page ?? txData?.transactions?.last_page ?? 1
  const from = txData?.transactions?.meta?.from ?? txData?.transactions?.from ?? 0
  const to = txData?.transactions?.meta?.to ?? txData?.transactions?.to ?? 0

  const mutation = useMutation({
    mutationFn: (data: { amount: number, description: string, transaction_date: string }) => {
      if (transactionType === 'deposit') {
        return adminService.recordSavingsDeposit(selectedMemberId!, data)
      } else {
        return adminService.recordSavingsWithdrawal(selectedMemberId!, data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsHistory', selectedMemberId] })
      queryClient.invalidateQueries({ queryKey: ['adminMemberDetails', selectedMemberId] })
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] })
      setTransactionType(null)
      setAmount('')
      setDescription('')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Transaction failed.')
    }
  })

  const handleSelectMember = (member: User) => {
    setSelectedMemberId(member.id)
    setSearchQuery('')
    setIsSearchFocused(false)
    setPage(1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return
    mutation.mutate({
      amount: Number(amount),
      description,
      transaction_date: date
    })
  }

  const handleExportSavings = () => {
    if (!selectedMember || !transactions || transactions.length === 0) {
      alert('No savings transactions loaded to export. Please select a member with transaction history.')
      return
    }

    const columns = [
      { header: 'Date', accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : (row.transaction_date || '') },
      { header: 'Transaction Type', accessor: (row: any) => row.type || row.transaction_type || '' },
      { header: 'Description', accessor: (row: any) => row.description || '' },
      { header: 'Amount (ETB)', accessor: (row: any) => Number(row.amount || 0) },
      { header: 'Balance After (ETB)', accessor: (row: any) => row.balance_after !== undefined ? Number(row.balance_after) : '' },
    ]

    const safeName = selectedMember?.name ? selectedMember.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'member'
    exportToCSV(`sacco-savings-${safeName}-report.csv`, columns, transactions)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  return (
    <motion.div 
      className="space-y-6 max-w-5xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Savings Management</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Record deposits and withdrawals for members
        </p>
      </div>

      {/* Member Selector & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Select Member Box */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center transition-colors relative">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Member</label>
          <div className="relative mb-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or member ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-950 border border-emerald-500 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none ring-4 ring-emerald-500/20 transition-all"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && (
            <div className="absolute left-6 right-6 top-[105px] z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {isSearchLoading ? (
                <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching members...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((m: User) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevents input blur before click processes
                      handleSelectMember(m)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex justify-between items-center transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-700"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{(m as any).num_shares || 0} shares</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No members found.</div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <Info className="w-4 h-4" />
            <span>Search and select a member to manage their savings account</span>
          </div>
        </div>

        {/* Selected Member Info Panel */}
        {isMemberLoading ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[180px]">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#0B6B3A]" /> Loading member details...
            </div>
          </div>
        ) : isMemberError ? (
          <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-sm flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p>Failed to load member savings details. Please select another member or try again.</p>
          </div>
        ) : selectedMember ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                  {selectedMember?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedMember?.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">ID: MEM-{selectedMember?.id?.toString().padStart(3, '0')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {(selectedMember as any).is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Current Balance</div>
                <div className="text-2xl font-extrabold text-[#0B6B3A] dark:text-emerald-400">
                  <span className="text-lg font-bold text-[#0B6B3A]/70 dark:text-emerald-400/70 mr-1">ETB</span>
                  {Number(latestBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-auto">
              <button 
                onClick={() => setTransactionType('deposit')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0B6B3A] text-white rounded-lg text-sm font-semibold hover:bg-[#095730] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Record Deposit
              </button>
              <button 
                onClick={() => setTransactionType('withdrawal')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <MinusCircle className="w-4 h-4" />
                Record Withdrawal
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 min-h-[160px] transition-colors">
            <Search className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">Select a member above to view and manage their savings</p>
          </div>
        )}
      </div>

      {/* Transaction History Table */}
      {selectedMember && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Transaction History
            </h3>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button 
                onClick={handleExportSavings}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount (ETB)</th>
                  <th className="px-6 py-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isTxLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0B6B3A]" /> Loading history...
                      </div>
                    </td>
                  </tr>
                ) : isTxError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-rose-500">Failed to load transaction history.</td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{tx.transaction_date || tx.created_at?.substring(0, 10)}</td>
                      <td className="px-6 py-4">
                        {tx.type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <ArrowDownToLine className="w-3 h-3" /> Deposit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            <ArrowUpToLine className="w-3 h-3" /> Withdrawal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{tx.description || '-'}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'} {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {Number(tx.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No transactions found for this member.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Showing {from} to {to} of {totalTx} entries</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                &lsaquo;
              </button>
              <button className="w-7 h-7 rounded bg-[#ECFDF5] dark:bg-emerald-500/10 text-[#0B6B3A] dark:text-emerald-400 font-bold border border-[#0B6B3A]/20 dark:border-emerald-500/20 transition-colors">
                {currentPage}
              </button>
              <button 
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage}
                className="px-2 py-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                &rsaquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <Dialog.Root open={transactionType !== null} onOpenChange={(open) => !open && setTransactionType(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
                Record {transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </Dialog.Title>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{selectedMember?.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current Balance</div>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(latestBalance)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">ETB</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-lg font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" placeholder="0.00" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" placeholder="e.g., Monthly savings contribution" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
              </div>

              {transactionType === 'withdrawal' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 text-sm rounded-lg border border-amber-200 dark:border-amber-900/50 flex gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500" />
                  <p>Ensure the member has sufficient balance and the withdrawal is approved before proceeding.</p>
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setTransactionType(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  transactionType === 'deposit' ? 'bg-[#0B6B3A] hover:bg-[#095730]' : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600'
                }`}>
                  {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mutation.isPending ? 'Processing...' : `Record ${transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.div>
  )
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
