import React from "react";
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

interface SavingsTransaction {
  id: number;
  type: "deposit" | "withdraw";
  amount: number;
  balance_after: number;
  description: string | null;
  transaction_date: string;
  // TODO: confirm these field names against your actual API response —
  // added to support the Reference/Status columns in the reference design.
  reference?: string;
  status?: "completed" | "processing" | "failed";
}

interface SavingsResponse {
  balance: number;
  change_percent?: number;
  transactions: SavingsTransaction[];
}

interface Loan {
  id: number;
  status: string;
  outstanding_balance?: number;
  next_due_date?: string;
  next_due_amount?: number;
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

  const activeLoans =
    loans?.loans.filter(
      (l) => l.status === "approved" || l.status === "disbursed",
    ) ?? [];
  const outstandingTotal = activeLoans.reduce(
    (sum, l) => sum + Number(l.outstanding_balance ?? 0),
    0,
  );
  const shareCapital =
    (shareInfo?.share_value ?? 0) * (shareInfo?.num_shares ?? 0);

  // Nearest upcoming installment across active loans, if any.
  const nextInstallment = activeLoans
    .filter((l) => l.next_due_date && l.next_due_amount)
    .sort(
      (a, b) =>
        new Date(a.next_due_date!).getTime() -
        new Date(b.next_due_date!).getTime(),
    )[0];

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
        <div className="lg:col-span-2 bg-[#FFF1F0] dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {t("member.dashboard.next_installment")}
              </h2>
              {nextInstallment ? (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("member.dashboard.installment_notice")}
                  </p>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      ETB {nextInstallment.next_due_amount!.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {t("member.dashboard.due")}{" "}
                      {new Date(
                        nextInstallment.next_due_date!,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("member.dashboard.no_installment_due")}
                </p>
              )}
            </div>
          </div>
          {nextInstallment && (
            <Link
              to="/member/payments"
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-2 px-5 rounded-lg shrink-0"
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
