import React from "react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentColor: "black" | "green" | "amber" | "blue" | "purple" | "rose";
  iconBgColor?: string;
  iconTextColor?: string;
  bgHighlight?: boolean;
  /**
   * Optional small line rendered under the value, e.g. a "↑12% vs last month"
   * change indicator. Pass a pre-styled node so callers control color/sign.
   */
  subtitle?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  accentColor,
  iconBgColor,
  iconTextColor,
  bgHighlight = false,
  subtitle,
}) => {
  const iconBgMap = {
    black: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    green:
      "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber:
      "bg-amber-100/80 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    blue: "bg-sky-100/80 text-sky-500 dark:bg-sky-900/30 dark:text-sky-400",
    purple:
      "bg-purple-100/80 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    rose: "bg-rose-100/80 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <div
      className={`rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs transition-shadow hover:shadow-xs ${
        bgHighlight
          ? "bg-[#FFFDF0] border-amber-300/80 dark:bg-amber-950/20 dark:border-amber-900/40"
          : "bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-extrabold tracking-wider uppercase ${
            bgHighlight
              ? "text-[#B45309] dark:text-amber-400"
              : "text-slate-500 dark:text-slate-400"
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
      {subtitle && <div className="mt-1.5 text-xs">{subtitle}</div>}
    </div>
  );
};
