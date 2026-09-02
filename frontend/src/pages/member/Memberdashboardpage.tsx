import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Landmark,
  CreditCard,
  PiggyBank,
  Wallet,
  AlertCircle,
  Plus,
  Eye,
  UserCog,
} from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/auth";
import { MetricCard } from "@/components/member/Metriccard ";

import type { Loan, LoanSchedule } from "@/types";

interface SavingsTransaction {
  id: number;
  type: "deposit" | "withdraw";
  amount: number;
  balance_after: number;
  description: string | null;
  transaction_date: string;
  reference?: string;
  status?: "completed" | "processing" | "failed";
}

interface SavingsResponse {
  balance: number;
  change_percent?: number;
  transactions: SavingsTransaction[];
}

interface LoansResponse {
  loans: Loan[];
}

interface DividendsResponse {
  total: number;
  change_percent?: number;
}

async function fetchSavings(): Promise<SavingsResponse> {
  const { data } = await api.get("/me/savings");
  const payload = data.data ?? data;

  return {
    balance: Number(payload.balance ?? 0),
    change_percent: payload.change_percent,
    transactions: Array.isArray(payload.transactions)
      ? payload.transactions
      : (payload.transactions?.data ?? []),
  };
}

async function fetchLoans(): Promise<LoansResponse> {
  const { data } = await api.get("/me/loans");
  const payload = data.data ?? data;
  return { loans: Array.isArray(payload) ? payload : (payload.loans ?? []) };
}

async function fetchShareCapital(): Promise<{
  share_value: number;
  num_shares: number;
}> {
  const { data } = await api.get("/profile");
  const payload = data.data ?? data;
  return {
    share_value: payload.sacco?.share_value ?? 0,
    num_shares: payload.num_shares ?? 0,
  };
}

// TODO: point this at your real dividends endpoint — inferred to match
// the "Total Dividends" card in the reference design.
async function fetchDividends(): Promise<DividendsResponse> {
  const { data } = await api.get("/me/dividends");
  const payload = data.data ?? data;
  return {
    total: Number(payload.total ?? payload.balance ?? 0),
    change_percent: payload.change_percent,
  };
}

const statusStyles: Record<string, string> = {
  completed:
    "bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-900/30 dark:text-emerald-400",
  processing:
    "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-blue-900/30 dark:text-blue-400",
  failed: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-rose-900/30 dark:text-rose-400",
};

const ChangeBadge: React.FC<{ value: number }> = ({ value }) => (
  <span
    className={`text-xs font-semibold ${value >= 0 ? "text-emerald-600" : "text-rose-600"}`}
  >
    {value >= 0 ? "↑" : "↓"} {Math.abs(value)}%
  </span>
);

export const MemberDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: savings, isLoading: savingsLoading } = useQuery({
    queryKey: ["me", "savings"],
    queryFn: fetchSavings,
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["me", "loans"],
    queryFn: fetchLoans,
  });

  const { data: shareInfo, isLoading: shareLoading } = useQuery({
    queryKey: ["me", "profile", "shares"],
    queryFn: fetchShareCapital,
  });

  const { data: dividends, isLoading: dividendsLoading } = useQuery({
    queryKey: ["me", "dividends"],
    queryFn: fetchDividends,
  });

  const activeLoans = useMemo(() => {
    return loans?.loans.filter(
      (l: Loan) => l.status === "active" || l.status === "approved" || l.status === "disbursed"
    ) ?? [];
  }, [loans?.loans]);

  const outstandingTotal = activeLoans.reduce(
    (sum: number, l: Loan) => sum + Number(l.outstanding_balance ?? l.amount ?? 0),
    0
  );
  const shareCapital =
    (shareInfo?.share_value ?? 0) * (shareInfo?.num_shares ?? 0);

  // Dynamic next installment calculation across all active loans
  const upcomingInstallmentDetails = useMemo(() => {
    let bestLoan: Loan | null = null;
    let bestDueDate: Date | null = null;
    let bestAmount = 0;
    let bestDaysRemaining = 0;

    for (const loan of activeLoans) {
      if (loan.next_installment && loan.next_installment.due_date) {
        const dueDate = new Date(loan.next_installment.due_date);
        if (!bestDueDate || dueDate < bestDueDate) {
          bestLoan = loan;
          bestDueDate = dueDate;
          bestAmount = loan.next_installment.amount_due;
          bestDaysRemaining = loan.next_installment.remaining_days;
        }
      } else if (loan.next_due_date && loan.next_due_amount) {
        const dueDate = new Date(loan.next_due_date);
        if (!bestDueDate || dueDate < bestDueDate) {
          bestLoan = loan;
          bestDueDate = dueDate;
          bestAmount = loan.next_due_amount;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dDate = new Date(dueDate);
          dDate.setHours(0, 0, 0, 0);
          bestDaysRemaining = Math.round((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
      } else if (loan.repayment_schedule && loan.repayment_schedule.length > 0) {
        const unpaidSchedules = loan.repayment_schedule
          .filter((s: LoanSchedule) => s.status !== "paid")
          .sort((a: LoanSchedule, b: LoanSchedule) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        if (unpaidSchedules.length > 0) {
          const firstUnpaid = unpaidSchedules[0];
          const dueDate = new Date(firstUnpaid.due_date);
          if (!bestDueDate || dueDate < bestDueDate) {
            bestLoan = loan;
            bestDueDate = dueDate;
            bestAmount = (firstUnpaid.total_due ?? firstUnpaid.amount_due ?? 0) - (firstUnpaid.amount_paid ?? 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dDate = new Date(dueDate);
            dDate.setHours(0, 0, 0, 0);
            bestDaysRemaining = Math.round((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
      }
    }

    if (!bestLoan || !bestDueDate) return null;

    const formattedDate = bestDueDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let remainingBadgeText = "";
    let isOverdue = false;
    if (bestDaysRemaining > 1) {
      remainingBadgeText = `${bestDaysRemaining} days remaining`;
    } else if (bestDaysRemaining === 1) {
      remainingBadgeText = `1 day remaining`;
    } else if (bestDaysRemaining === 0) {
      remainingBadgeText = `Due today`;
    } else {
      isOverdue = true;
      remainingBadgeText = `${Math.abs(bestDaysRemaining)} ${Math.abs(bestDaysRemaining) === 1 ? "day" : "days"} overdue`;
    }

    return {
      loan: bestLoan,
      dueDate: bestDueDate,
      formattedDate,
      amount: bestAmount,
      daysRemaining: bestDaysRemaining,
      remainingBadgeText,
      isOverdue,
    };
  }, [activeLoans]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("member.dashboard.title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t("member.dashboard.subtitle", { name: user?.name ?? "" })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t("member.dashboard.savings_balance")}
          value={
            savingsLoading
              ? "—"
              : `ETB ${(savings?.balance ?? 0).toLocaleString()}`
          }
          icon={Landmark}
          accentColor="green"
          subtitle={
            savings?.change_percent !== undefined ? (
              <ChangeBadge value={savings.change_percent} />
            ) : undefined
          }
        />
        <MetricCard
          title={t("member.dashboard.outstanding_loans")}
          value={
            loansLoading ? "—" : `ETB ${outstandingTotal.toLocaleString()}`
          }
          icon={CreditCard}
          accentColor="rose"
          subtitle={
            !loansLoading ? (
              <span className="text-xs text-slate-500">
                {t("member.dashboard.loans_count", {
                  count: activeLoans.length,
                })}
              </span>
            ) : undefined
          }
        />
        <MetricCard
          title={t("member.dashboard.share_capital")}
          value={shareLoading ? "—" : `ETB ${shareCapital.toLocaleString()}`}
          icon={PiggyBank}
          accentColor="black"
          subtitle={
            !shareLoading ? (
              <span className="text-xs text-slate-500">
                {shareInfo?.num_shares ?? 0}{" "}
                {t("member.dashboard.shares_total")}
              </span>
            ) : undefined
          }
        />
        <MetricCard
          title={t("member.dashboard.total_dividends")}
          value={
            dividendsLoading
              ? "—"
              : `ETB ${(dividends?.total ?? 0).toLocaleString()}`
          }
          icon={Wallet}
          accentColor="amber"
          subtitle={
            dividends?.change_percent !== undefined ? (
              <ChangeBadge value={dividends.change_percent} />
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next Installment Due */}
        <div
          className={`lg:col-span-2 rounded-xl p-5 border flex items-center justify-between gap-4 flex-wrap transition-colors ${
            upcomingInstallmentDetails
              ? upcomingInstallmentDetails.isOverdue
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
                : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40"
              : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-full shrink-0 ${
                upcomingInstallmentDetails
                  ? upcomingInstallmentDetails.isOverdue
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              }`}
            >
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {t("member.dashboard.next_installment")}
              </h2>
              {upcomingInstallmentDetails ? (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {upcomingInstallmentDetails.loan.loan_number
                      ? `Loan #${upcomingInstallmentDetails.loan.loan_number}`
                      : t("member.dashboard.installment_notice")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      ETB {upcomingInstallmentDetails.amount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("member.dashboard.due")} {upcomingInstallmentDetails.formattedDate}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          upcomingInstallmentDetails.isOverdue
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                            : upcomingInstallmentDetails.daysRemaining === 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                        }`}
                      >
                        {upcomingInstallmentDetails.remainingBadgeText}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("member.dashboard.no_installment_due")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    You have no active loans or upcoming payment installments at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
          {upcomingInstallmentDetails && (
            <Link
              to="/member/payments"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shrink-0 transition-colors shadow-sm"
            >
              {t("member.dashboard.pay_now")}
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3">
            {t("member.dashboard.quick_actions")}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/member/loans/apply"
              className="flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-3 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              {t("member.dashboard.apply_for_loan")}
            </Link>
            <Link
              to="/member/savings"
              className="flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-3 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              {t("member.dashboard.view_savings")}
            </Link>
          </div>
          <Link
            to="/member/profile"
            className="mt-2 flex items-center justify-center gap-2 bg-[#0B1727] hover:bg-[#132234] text-white text-sm font-semibold py-2.5 px-4 rounded-lg"
          >
            <UserCog className="w-4 h-4" />
            {t("member.dashboard.edit_profile")}
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {t("member.dashboard.recent_transactions")}
          </h2>
          <Link
            to="/member/savings"
            className="text-sm text-emerald-700 font-medium"
          >
            {t("member.dashboard.view_all")} →
          </Link>
        </div>
        {savingsLoading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 font-semibold">
                    {t("member.dashboard.date")}
                  </th>
                  <th className="py-2 font-semibold">
                    {t("member.dashboard.description")}
                  </th>
                  <th className="py-2 font-semibold">
                    {t("member.dashboard.reference")}
                  </th>
                  <th className="py-2 font-semibold text-right">
                    {t("member.dashboard.amount")}
                  </th>
                  <th className="py-2 font-semibold text-right">
                    {t("member.dashboard.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {savings?.transactions.slice(0, 5).map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-50 dark:border-slate-800/50"
                  >
                    <td className="py-3 whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {tx.description || t(`member.dashboard.type_${tx.type}`)}
                    </td>
                    <td className="py-3 text-slate-400">
                      {tx.reference ?? "—"}
                    </td>
                    <td
                      className={`py-3 text-right font-medium whitespace-nowrap ${
                        tx.type === "deposit"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {tx.type === "deposit" ? "+" : "-"} ETB{" "}
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          statusStyles[tx.status ?? "completed"]
                        }`}
                      >
                        {t(
                          `member.dashboard.status_${tx.status ?? "completed"}`,
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
