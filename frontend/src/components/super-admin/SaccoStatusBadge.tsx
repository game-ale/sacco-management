import React from 'react'

export type SaccoStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'Pending' | 'Approved' | 'Rejected' | 'Suspended'

interface SaccoStatusBadgeProps {
  status: SaccoStatus
  className?: string
}

export const SaccoStatusBadge: React.FC<SaccoStatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'suspended'

  switch (normalized) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF9C3] dark:bg-amber-950/80 text-[#854D0E] dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/60 ${className}`}
        >
          Pending
        </span>
      )
    case 'approved':
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] dark:bg-emerald-950/80 text-[#15803D] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/60 ${className}`}
        >
          Approved
        </span>
      )
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] dark:bg-rose-950/80 text-[#B91C1C] dark:text-rose-300 border border-rose-200/50 dark:border-rose-700/60 ${className}`}
        >
          Rejected
        </span>
      )
    case 'suspended':
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] dark:bg-amber-900/60 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-600/80 ${className}`}
        >
          Suspended
        </span>
      )
    default:
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 ${className}`}
        >
          {status}
        </span>
      )
  }
}

