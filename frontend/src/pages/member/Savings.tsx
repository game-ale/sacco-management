import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleAlert,
  Landmark,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { getMemberSavings } from "@/services/memberSavingsService";

const currencyFormatter = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 2,
});

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

export default function Savings() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["member", "savings", page],
    queryFn: () => getMemberSavings(page),
  });

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("member.savings.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("member.savings.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {t("member.savings.refresh")}
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-emerald-800 bg-emerald-700 text-white shadow-sm dark:border-emerald-700 dark:bg-emerald-900">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-medium text-emerald-100">
              {t("member.savings.available_balance")}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {isLoading ? "—" : currencyFormatter.format(data?.balance ?? 0)}
            </p>
            <p className="mt-2 text-sm text-emerald-100">
              {t("member.savings.balance_description")}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {t("member.savings.transaction_history")}
              </h2>
              {!isLoading && pagination && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("member.savings.transactions_count", {
                    count: pagination.total,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5" aria-label={t("common.loading")}>
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <CircleAlert className="h-9 w-9 text-rose-500" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              {t("member.savings.load_error")}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("member.savings.load_error_description")}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {t("member.savings.try_again")}
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <Wallet className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              {t("member.savings.empty_title")}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("member.savings.empty_description")}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">{t("member.savings.date")}</th>
                    <th className="px-5 py-3">{t("member.savings.description")}</th>
                    <th className="px-5 py-3">{t("member.savings.type")}</th>
                    <th className="px-5 py-3 text-right">{t("member.savings.amount")}</th>
                    <th className="px-5 py-3 text-right">{t("member.savings.balance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const isDeposit = transaction.type === "deposit";
                    return (
                      <tr key={transaction.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(transaction.date)}</td>
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{transaction.description || t("member.savings.no_description")}</td>
                        <td className="px-5 py-4">
                          <TransactionType type={transaction.type} label={t(`member.savings.${transaction.type}`)} />
                        </td>
                        <td className={`px-5 py-4 text-right font-semibold ${isDeposit ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {isDeposit ? "+" : "−"}{currencyFormatter.format(transaction.amount)}
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-slate-700 dark:text-slate-200">
                          {transaction.balance_after === null ? "—" : currencyFormatter.format(transaction.balance_after)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {transactions.map((transaction) => {
                const isDeposit = transaction.type === "deposit";
                return (
                  <div key={transaction.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <TransactionIcon type={transaction.type} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{transaction.description || t("member.savings.no_description")}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <p className={`whitespace-nowrap text-sm font-semibold ${isDeposit ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isDeposit ? "+" : "−"}{currencyFormatter.format(transaction.amount)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between pl-11 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("member.savings.balance")}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{transaction.balance_after === null ? "—" : currencyFormatter.format(transaction.balance_after)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!isLoading && !error && pagination && pagination.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <button type="button" onClick={() => setPage((current) => current - 1)} disabled={pagination.currentPage <= 1 || isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
              {t("member.savings.previous")}
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t("member.savings.page", { current: pagination.currentPage, total: pagination.lastPage })}</span>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={pagination.currentPage >= pagination.lastPage || isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
              {t("member.savings.next")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function TransactionType({ type, label }: { type: "deposit" | "withdraw"; label: string }) {
  const isDeposit = type === "deposit";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isDeposit ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}>
      {isDeposit ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function TransactionIcon({ type }: { type: "deposit" | "withdraw" }) {
  const isDeposit = type === "deposit";
  return (
    <div className={`rounded-full p-2 ${isDeposit ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}>
      {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
    </div>
  );
}
