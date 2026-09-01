import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  FileText,
  Landmark,
  RefreshCw,
} from "lucide-react";
import {
  getMemberLoan,
  type MemberLoan,
  type MemberLoanSchedule,
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

export default function LoanDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: loan, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["member", "loan", id],
    queryFn: () => getMemberLoan(id ?? ""),
    enabled: Boolean(id),
  });
  const isNotFound = isAxiosError(error) && error.response?.status === 404;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/member/loans" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("member.loan_details.back_to_loans")}
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {t("member.loan_details.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("member.loan_details.subtitle")}
          </p>
        </div>
        {loan && (
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("member.loan_details.refresh")}
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !id || isNotFound ? (
        <MessageState icon={FileText} title={t("member.loan_details.not_found_title")} description={t("member.loan_details.not_found_description")} />
      ) : error ? (
        <MessageState icon={CircleAlert} title={t("member.loan_details.load_error")} description={t("member.loan_details.load_error_description")} retry={refetch} />
      ) : loan ? (
        <LoanDetailContent loan={loan} />
      ) : null}
    </div>
  );
}

function LoanDetailContent({ loan }: { loan: MemberLoan }) {
  const { t } = useTranslation();
  const schedule = loan.repayment_schedule ?? [];
  const repayments = loan.repayments ?? [];

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-emerald-800 bg-emerald-700 text-white shadow-sm dark:border-emerald-700 dark:bg-emerald-900">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-emerald-100">{loan.loan_number}</p>
              <LoanStatus status={loan.status} inverse />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{currencyFormatter.format(loan.amount)}</p>
            <p className="mt-2 text-sm text-emerald-100">{loan.purpose}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <CircleDollarSign className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionHeading icon={Landmark} title={t("member.loan_details.loan_information")} />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label={t("member.loan_details.loan_amount")} value={currencyFormatter.format(loan.amount)} />
          <DetailField label={t("member.loan_details.applied_on")} value={formatDate(loan.created_at)} />
          <DetailField label={t("member.loan_details.approved_on")} value={formatDate(loan.approved_at)} />
          <DetailField label={t("member.loan_details.disbursed_on")} value={formatDate(loan.disbursed_at)} />
          <DetailField label={t("member.loan_details.interest_rate")} value={loan.interest_rate === null ? "—" : `${loan.interest_rate}%`} />
          <DetailField label={t("member.loan_details.term")} value={loan.term_months === null ? "—" : t("member.loan_details.months", { count: loan.term_months })} />
          <DetailField label={t("member.loan_details.total_repayable")} value={loan.total_repayable === null ? "—" : currencyFormatter.format(loan.total_repayable)} />
          <DetailField label={t("member.loan_details.monthly_installment")} value={loan.monthly_installment === null ? "—" : currencyFormatter.format(loan.monthly_installment)} />
        </div>
        {loan.status === "rejected" && loan.rejection_reason && (
          <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            <span className="font-semibold">{t("member.loan_details.rejection_reason")}:</span> {loan.rejection_reason}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <SectionHeading icon={CalendarDays} title={t("member.loan_details.repayment_schedule")} />
        </div>
        {schedule.length === 0 ? (
          <EmptySection icon={CalendarDays} title={t("member.loan_details.no_schedule_title")} description={t("member.loan_details.no_schedule_description")} />
        ) : (
          <ScheduleTable schedule={schedule} />
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <SectionHeading icon={CreditCard} title={t("member.loan_details.payment_history")} />
        </div>
        {repayments.length === 0 ? (
          <EmptySection icon={CreditCard} title={t("member.loan_details.no_payments_title")} description={t("member.loan_details.no_payments_description")} />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {repayments.map((repayment) => (
              <div key={repayment.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{currencyFormatter.format(repayment.amount)}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("member.loan_details.paid_on", { date: formatDate(repayment.paid_at) })}</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{repayment.method}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ScheduleTable({ schedule }: { schedule: MemberLoanSchedule[] }) {
  const { t } = useTranslation();
  const scheduleStatusStyles = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    overdue: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3">{t("member.loan_details.installment")}</th>
            <th className="px-5 py-3">{t("member.loan_details.due_date")}</th>
            <th className="px-5 py-3 text-right">{t("member.loan_details.principal")}</th>
            <th className="px-5 py-3 text-right">{t("member.loan_details.interest")}</th>
            <th className="px-5 py-3 text-right">{t("member.loan_details.total_due")}</th>
            <th className="px-5 py-3 text-right">{t("member.loan_details.amount_paid")}</th>
            <th className="px-5 py-3 text-right">{t("member.loan_details.status")}</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((installment) => (
            <tr key={installment.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{installment.installment_number}</td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(installment.due_date)}</td>
              <td className="px-5 py-4 text-right text-slate-700 dark:text-slate-200">{currencyFormatter.format(installment.principal_due)}</td>
              <td className="px-5 py-4 text-right text-slate-700 dark:text-slate-200">{currencyFormatter.format(installment.interest_due)}</td>
              <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">{currencyFormatter.format(installment.total_due)}</td>
              <td className="px-5 py-4 text-right text-slate-700 dark:text-slate-200">{currencyFormatter.format(installment.amount_paid)}</td>
              <td className="px-5 py-4 text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scheduleStatusStyles[installment.status]}`}>{t(`member.loan_details.schedule_status_${installment.status}`)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Landmark; title: string }) {
  return <div className="flex items-center gap-2.5"><div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><Icon className="h-4 w-4" aria-hidden="true" /></div><h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2></div>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</p></div>;
}

function EmptySection({ icon: Icon, title, description }: { icon: typeof CalendarDays; title: string; description: string }) {
  return <div className="flex flex-col items-center px-5 py-12 text-center"><Icon className="h-9 w-9 text-slate-300 dark:text-slate-600" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p></div>;
}

function LoadingState() {
  return <div className="space-y-6" aria-label="Loading"><div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />{[0, 1].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>;
}

function MessageState({ icon: Icon, title, description, retry }: { icon: typeof FileText; title: string; description: string; retry?: () => void }) {
  const { t } = useTranslation();
  return <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-5 py-16 text-center dark:border-slate-800 dark:bg-slate-900"><Icon className="h-10 w-10 text-slate-400" aria-hidden="true" /><h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>{retry ? <button type="button" onClick={() => void retry()} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">{t("member.loan_details.try_again")}</button> : <Link to="/member/loans" className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">{t("member.loan_details.back_to_loans")}</Link>}</div>;
}

function LoanStatus({ status, inverse = false }: { status: MemberLoanStatus; inverse?: boolean }) {
  const { t } = useTranslation();
  const styles: Record<MemberLoanStatus, string> = inverse
    ? { pending: "bg-white/20 text-white", approved: "bg-white/20 text-white", active: "bg-white/20 text-white", rejected: "bg-white/20 text-white", closed: "bg-white/20 text-white", completed: "bg-white/20 text-white" }
    : { pending: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700", active: "bg-emerald-100 text-emerald-700", rejected: "bg-rose-100 text-rose-700", closed: "bg-slate-100 text-slate-700", completed: "bg-slate-100 text-slate-700" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{t(`member.loans.status_${status}`)}</span>;
}
