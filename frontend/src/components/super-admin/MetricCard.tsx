import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  accentColor: 'black' | 'green' | 'amber' | 'blue' | 'purple' | 'rose'
  iconBgColor?: string
  iconTextColor?: string
  bgHighlight?: boolean
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  accentColor,
  iconBgColor,
  iconTextColor,
  bgHighlight = false,
}) => {
  const borderMap = {
    black: 'border-l-[4px] border-l-slate-900 dark:border-l-slate-100',
    green: 'border-l-[4px] border-l-emerald-500',
    amber: 'border-l-[4px] border-l-amber-500',
    blue: 'border-l-[4px] border-l-sky-400',
    purple: 'border-l-[4px] border-l-purple-500',
    rose: 'border-l-[4px] border-l-rose-500',
  }

  const iconBgMap = {
    black: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    green: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    blue: 'bg-sky-100/80 dark:bg-sky-950/60 text-sky-500 dark:text-sky-400',
    purple: 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    rose: 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
  }

  return (
    <div
      className={`rounded-xl border border-slate-200/90 dark:border-slate-800 ${borderMap[accentColor]} p-5 shadow-2xs transition-all hover:shadow-xs ${
        bgHighlight ? 'bg-[#FFFDF0] dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60' : 'bg-white dark:bg-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-extrabold tracking-wider uppercase ${
            bgHighlight ? 'text-[#B45309] dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {title}
        </span>
        <div
          className={`p-2.5 rounded-full flex items-center justify-center shrink-0 ${
            iconBgColor && iconTextColor
              ? `${iconBgColor} ${iconTextColor}`
              : iconBgMap[accentColor]
          }`}
        >
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>
      <div className="mt-2.5">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
          {value}
        </span>
      </div>
    </div>
  )
}

