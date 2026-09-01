import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarDays, CircleAlert, Coins, RefreshCw, TrendingUp, type LucideIcon } from "lucide-react";
import { getMemberDividends } from "@/services/memberDividendService";

const currencyFormatter = new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 2 });

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function Dividends() {
  const { t } = useTranslation();
  const { data: dividends = [], error, isLoading, isFetching, refetch } = useQuery({ queryKey: ["member", "dividends"], queryFn: getMemberDividends });
  const totalDividends = dividends.reduce((total, dividend) => total + dividend.amount, 0);
  const latestDividend = dividends[0];

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("member.dividends.title")}</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("member.dividends.subtitle")}</p></div>
      <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{t("member.dividends.refresh")}</button>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard label={t("member.dividends.total_received")} value={isLoading ? "—" : currencyFormatter.format(totalDividends)} icon={Coins} tone="emerald" />
      <MetricCard label={t("member.dividends.distributions")} value={isLoading ? "—" : dividends.length} icon={TrendingUp} tone="blue" />
      <MetricCard label={t("member.dividends.latest_period")} value={isLoading ? "—" : latestDividend?.period ?? "—"} icon={CalendarDays} tone="amber" />
    </div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><Coins className="h-4 w-4" /></div><div><h2 className="font-semibold text-slate-900 dark:text-white">{t("member.dividends.history")}</h2>{!isLoading && <p className="text-xs text-slate-500 dark:text-slate-400">{t("member.dividends.distributions_count", { count: dividends.length })}</p>}</div></div>
      {isLoading ? <div className="space-y-3 p-5" aria-label={t("common.loading")}>{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>
      : error ? <State icon={CircleAlert} title={t("member.dividends.load_error")} description={t("member.dividends.load_error_description")} action={t("member.dividends.try_again")} onAction={() => void refetch()} error />
      : dividends.length === 0 ? <State icon={Coins} title={t("member.dividends.empty_title")} description={t("member.dividends.empty_description")} />
      : <><div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"><tr><th className="px-5 py-3">{t("member.dividends.period")}</th><th className="px-5 py-3">{t("member.dividends.distributed_on")}</th><th className="px-5 py-3 text-right">{t("member.dividends.shares")}</th><th className="px-5 py-3 text-right">{t("member.dividends.share_percentage")}</th><th className="px-5 py-3 text-right">{t("member.dividends.total_pool")}</th><th className="px-5 py-3 text-right">{t("member.dividends.amount")}</th></tr></thead><tbody>{dividends.map((dividend) => <tr key={dividend.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{dividend.period}</td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(dividend.created_at)}</td><td className="px-5 py-4 text-right text-slate-700 dark:text-slate-200">{dividend.num_shares}</td><td className="px-5 py-4 text-right text-slate-700 dark:text-slate-200">{dividend.share_pct}%</td><td className="px-5 py-4 text-right text-slate-700 dark:text-slate-200">{currencyFormatter.format(dividend.total_pool)}</td><td className="px-5 py-4 text-right font-semibold text-emerald-700 dark:text-emerald-400">{currencyFormatter.format(dividend.amount)}</td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">{dividends.map((dividend) => <div key={dividend.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><Coins className="h-4 w-4" /></div><div><p className="font-medium text-slate-900 dark:text-white">{dividend.period}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("member.dividends.distributed_on_value", { date: formatDate(dividend.created_at) })}</p></div></div><p className="whitespace-nowrap text-sm font-semibold text-emerald-700 dark:text-emerald-400">{currencyFormatter.format(dividend.amount)}</p></div><div className="mt-3 grid grid-cols-3 gap-2 pl-11 text-xs text-slate-500 dark:text-slate-400"><DividendDetail label={t("member.dividends.shares")} value={String(dividend.num_shares)} /><DividendDetail label={t("member.dividends.share_percentage")} value={`${dividend.share_pct}%`} /><DividendDetail label={t("member.dividends.total_pool")} value={currencyFormatter.format(dividend.total_pool)} /></div></div>)}</div></>}
    </section>
  </div>;
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: LucideIcon; tone: "emerald" | "blue" | "amber" }) {
  const tones = { emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  return <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><div className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div>;
}

function DividendDetail({ label, value }: { label: string; value: string }) {
  return <div><p>{label}</p><p className="mt-0.5 truncate font-medium text-slate-700 dark:text-slate-200">{value}</p></div>;
}

function State({ icon: Icon, title, description, action, onAction, error = false }: { icon: LucideIcon; title: string; description: string; action?: string; onAction?: () => void; error?: boolean }) {
  return <div className="flex flex-col items-center px-5 py-14 text-center"><Icon className={`h-10 w-10 ${error ? "text-rose-500" : "text-slate-300 dark:text-slate-600"}`} /><h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>{action && <button type="button" onClick={onAction} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">{action}</button>}</div>;
}
