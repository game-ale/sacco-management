import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CircleAlert, Clock, CheckCircle2, XCircle, CreditCard, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import {
  createPaymentRequest,
  getMemberPaymentLoan,
  getMemberPaymentLoans,
  getMyPaymentRequests,
  type PaymentRequestItem,
} from "@/services/memberPaymentService";
import type { MemberLoanSchedule } from "@/services/memberLoanService";

interface PaymentForm {
  amount_paid: string;
  method: string;
  notes?: string;
}

const currency = new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 2 });
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const remaining = (schedule: MemberLoanSchedule) => Math.max(0, schedule.total_due - schedule.amount_paid);

export default function Payments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loanId, setLoanId] = useState<number | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<PaymentForm>({
    defaultValues: { amount_paid: "", method: "cash", notes: "" },
  });

  const loansQuery = useQuery({ queryKey: ["member", "payment-loans"], queryFn: getMemberPaymentLoans });
  const loanQuery = useQuery({ queryKey: ["member", "payment-loan", loanId], queryFn: () => getMemberPaymentLoan(loanId!), enabled: loanId !== null });
  const myRequestsQuery = useQuery({ queryKey: ["member", "payment-requests"], queryFn: () => getMyPaymentRequests() });

  const payableLoans = useMemo(() => (loansQuery.data ?? []).filter((loan) => loan.status === "active"), [loansQuery.data]);
  const payableSchedules = useMemo(() => (loanQuery.data?.repayment_schedule ?? []).filter((schedule) => remaining(schedule) > 0), [loanQuery.data]);
  const selectedSchedule = payableSchedules.find((schedule) => schedule.id === scheduleId) ?? null;

  useEffect(() => {
    if (loanId === null && payableLoans.length) setLoanId(payableLoans[0].id);
  }, [loanId, payableLoans]);

  useEffect(() => {
    setScheduleId(payableSchedules[0]?.id ?? null);
  }, [loanId, payableSchedules]);

  const paymentMutation = useMutation({
    mutationFn: createPaymentRequest,
    onSuccess: async () => {
      setSubmissionError(null);
      reset({ amount_paid: "", method: "cash", notes: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["member", "payment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["member", "payment-loans"] }),
        queryClient.invalidateQueries({ queryKey: ["member", "payment-loan", loanId] }),
      ]);
      toast.success("Payment request submitted for admin approval.");
    },
    onError: (error) => {
      const fallback = "Failed to submit payment request.";
      let message = fallback;
      if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
        message = data?.message ?? fallback;
        if (data?.errors?.amount_paid?.[0]) setError("amount_paid", { type: "server", message: data.errors.amount_paid[0] });
      }
      setSubmissionError(message);
    },
  });

  const submit = ({ amount_paid, method, notes }: PaymentForm) => {
    setSubmissionError(null);
    if (!loanId || !selectedSchedule) return;
    const amount = Number(amount_paid);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("amount_paid", { type: "validate", message: t("member.payments.amount_invalid") });
      return;
    }
    if (amount > remaining(selectedSchedule)) {
      setError("amount_paid", { type: "validate", message: t("member.payments.amount_exceeds") });
      return;
    }
    paymentMutation.mutate({
      loanId,
      schedule_id: selectedSchedule.id,
      amount_paid: amount,
      payment_date: new Date().toISOString().slice(0, 10),
      method,
      notes,
    });
  };

  if (loansQuery.isLoading) return <LoadingState />;
  if (loansQuery.isError) return <MessageState title={t("member.payments.load_error")} description={t("member.payments.load_error_description")} retry={loansQuery.refetch} />;
  if (!payableLoans.length) return <MessageState title={t("member.payments.empty_title")} description={t("member.payments.empty_description")} />;

  const myPaymentRequests = myRequestsQuery.data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("member.payments.title")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("member.payments.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loansQuery.refetch();
            void myRequestsQuery.refetch();
          }}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          {t("member.payments.refresh")}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit(submit)} noValidate className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Submit Payment Request</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Payments require admin approval before being applied to your loan</p>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            <Field label={t("member.payments.loan")}>
              <select value={loanId ?? ""} onChange={(e) => setLoanId(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="" disabled>{t("member.payments.choose_loan")}</option>
                {payableLoans.map((loan) => (
                  <option key={loan.id} value={loan.id}>{loan.loan_number} - {currency.format(loan.amount)}</option>
                ))}
              </select>
            </Field>

            {loanQuery.isLoading ? (
              <div className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ) : loanQuery.isError ? (
              <MessageState title={t("member.payments.loan_load_error")} description={t("member.payments.load_error_description")} retry={loanQuery.refetch} compact />
            ) : !selectedSchedule ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                {t("member.payments.no_installments")}
              </div>
            ) : (
              <>
                <Field label={t("member.payments.installment")}>
                  <select value={scheduleId ?? ""} onChange={(e) => setScheduleId(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    {payableSchedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {t("member.payments.installment_number", { number: schedule.installment_number })} - {formatDate(schedule.due_date)}
                      </option>
                    ))}
                  </select>
                </Field>

                <ScheduleSummary schedule={selectedSchedule} />

                <Field label={t("member.payments.amount")} error={errors.amount_paid?.message}>
                  <input type="number" min="0.01" max={remaining(selectedSchedule)} step="0.01" inputMode="decimal" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" aria-invalid={Boolean(errors.amount_paid)} {...register("amount_paid", { required: t("member.payments.amount_required") })} />
                </Field>

                <Field label={t("member.payments.method")}>
                  <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" {...register("method")}>
                    <option value="cash">{t("member.payments.method_cash")}</option>
                    <option value="bank_transfer">{t("member.payments.method_bank_transfer")}</option>
                    <option value="mobile_money">{t("member.payments.method_mobile_money")}</option>
                    <option value="manual">{t("member.payments.method_manual")}</option>
                  </select>
                </Field>

                <Field label="Reference / Notes (Optional)">
                  <input type="text" placeholder="Transaction ref or details" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" {...register("notes")} />
                </Field>
              </>
            )}
          </div>

          {submissionError && (
            <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              <CircleAlert className="h-5 w-5 shrink-0" />
              <p>{submissionError}</p>
            </div>
          )}

          <button type="submit" disabled={!selectedSchedule || paymentMutation.isPending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            <Send className="h-4 w-4" />
            {paymentMutation.isPending ? "Submitting Request..." : "Submit Payment Request"}
          </button>
        </form>

        {/* Requests & Approved Repayments Panel */}
        <div className="space-y-6">
          {/* Payment Requests */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">My Payment Requests</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track pending and past payment submissions</p>
            </div>
            {myRequestsQuery.isLoading ? (
              <div className="h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
            ) : myPaymentRequests.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No payment requests submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myPaymentRequests.map((req: PaymentRequestItem) => (
                  <div key={req.id} className="p-4 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{currency.format(req.amount)}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Submitted on {formatDate(req.created_at)} ({req.method})
                        </p>
                      </div>
                      <RequestStatusBadge status={req.status} />
                    </div>
                    {req.status === "rejected" && req.rejection_reason && (
                      <p className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                        Reason: {req.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Confirmed Repayments */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Completed Payment History</h2>
            </div>
            {loanQuery.isLoading ? (
              <div className="h-36 animate-pulse bg-slate-100 dark:bg-slate-800" />
            ) : (loanQuery.data?.repayments?.length ?? 0) === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t("member.payments.no_history")}</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {loanQuery.data?.repayments?.map((repayment) => (
                  <div key={repayment.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{currency.format(repayment.amount)}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatDate(repayment.paid_at)}</p>
                    </div>
                    <span className="text-xs capitalize font-medium text-slate-600 dark:text-slate-300">{repayment.method.replaceAll("_", " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
        <XCircle className="h-3 w-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      <Clock className="h-3 w-3" />
      Pending Approval
    </span>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function ScheduleSummary({ schedule }: { schedule: MemberLoanSchedule }) {
  const { t } = useTranslation();
  const values = [["total_due", schedule.total_due], ["amount_paid", schedule.amount_paid], ["remaining", remaining(schedule)]] as const;
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60 sm:grid-cols-3">
      <div className="col-span-2 sm:col-span-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("member.payments.due_date")}</p>
        <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatDate(schedule.due_date)}</p>
      </div>
      {values.map(([key, value]) => (
        <div key={key}>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t(`member.payments.${key}`)}</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{currency.format(value)}</p>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function MessageState({ title, description, retry, compact = false }: { title: string; description: string; retry?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center rounded-xl border border-slate-200 bg-white px-5 text-center dark:border-slate-800 dark:bg-slate-900 ${compact ? "py-6" : "py-16"}`}>
      <CircleAlert className="h-9 w-9 text-slate-400" />
      <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {retry && (
        <button type="button" onClick={() => void retry()} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
          {t("member.payments.try_again")}
        </button>
      )}
    </div>
  );
}
