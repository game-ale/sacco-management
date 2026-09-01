import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  getMemberLoans,
  type MemberLoan,
  type MemberLoanStatus,
} from "@/services/memberLoanService";

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

import GuarantorRequestsSection from "./GuarantorRequests";

export default function Loans() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["member", "loans", page],
    queryFn: () => getMemberLoans(page),
  });

  const loans = data?.loans ?? [];
  const pagination = data?.pagination;
  const activeLoans = loans.filter((loan) => loan.status === "active").length;
  const pendingLoans = loans.filter((loan) => loan.status === "pending").length;

  return (
    <div className="space-y-6">
      <GuarantorRequestsSection />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("member.loans.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("member.loans.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {t("member.loans.refresh")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LoanMetric
          label={t("member.loans.total_loans")}
          value={isLoading ? "—" : pagination?.total ?? 0}
          icon={FileText}
          tone="emerald"
        />
        <LoanMetric
          label={t("member.loans.active_loans")}
          value={isLoading ? "—" : activeLoans}
          icon={BadgeCheck}
          tone="blue"
        />
        <LoanMetric
          label={t("member.loans.pending_applications")}
          value={isLoading ? "—" : pendingLoans}
          icon={Clock3}
          tone="amber"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {t("member.loans.loan_history")}
            </h2>
            {!isLoading && pagination && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("member.loans.loans_count", { count: pagination.total })}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5" aria-label={t("common.loading")}>
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <CircleAlert className="h-9 w-9 text-rose-500" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              {t("member.loans.load_error")}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("member.loans.load_error_description")}
            </p>
            <button type="button" onClick={() => void refetch()} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              {t("member.loans.try_again")}
            </button>
          </div>
        ) : loans.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              {t("member.loans.empty_title")}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("member.loans.empty_description")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}

        {!isLoading && !error && pagination && pagination.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <button type="button" onClick={() => setPage((current) => current - 1)} disabled={pagination.currentPage <= 1 || isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
              {t("member.loans.previous")}
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t("member.loans.page", { current: pagination.currentPage, total: pagination.lastPage })}
            </span>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={pagination.currentPage >= pagination.lastPage || isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
              {t("member.loans.next")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function LoanCard({ loan }: { loan: MemberLoan }) {
  const { t } = useTranslation();

  return (
    <article className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">{loan.loan_number}</h3>
            <LoanStatus status={loan.status} />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loan.purpose}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("member.loans.applied_on", { date: formatDate(loan.created_at) })}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("member.loans.loan_amount")}
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {currencyFormatter.format(loan.amount)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3 dark:border-slate-800">
        <LoanField label={t("member.loans.interest_rate")} value={loan.interest_rate === null ? "—" : `${loan.interest_rate}%`} />
        <LoanField label={t("member.loans.term")} value={loan.term_months === null ? "—" : t("member.loans.months", { count: loan.term_months })} />
        <LoanField label={t("member.loans.monthly_installment")} value={loan.monthly_installment === null ? "—" : currencyFormatter.format(loan.monthly_installment)} />
      </div>

      {loan.status === "rejected" && loan.rejection_reason && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          {t("member.loans.rejection_reason")}: {loan.rejection_reason}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Link to={`/member/loans/${loan.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
          {t("member.loans.view_details")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function LoanField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function LoanMetric({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof FileText; tone: "emerald" | "blue" | "amber" }) {
  const toneClasses = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`rounded-full p-2 ${toneClasses[tone]}`}><Icon className="h-4 w-4" aria-hidden="true" /></div>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function LoanStatus({ status }: { status: MemberLoanStatus }) {
  const { t } = useTranslation();
  const styles: Record<MemberLoanStatus, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{t(`member.loans.status_${status}`)}</span>;
}
