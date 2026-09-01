import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import {
  getGuarantorRequests,
  acceptGuarantorRequest,
  rejectGuarantorRequest,
  type GuarantorRequest,
} from "@/services/memberLoanService";

const currencyFormatter = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 2,
});

export default function GuarantorRequestsSection() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["member", "guarantor-requests"],
    queryFn: () => getGuarantorRequests(),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => acceptGuarantorRequest(id),
    onSuccess: () => {
      toast.success("Guarantee request accepted.");
      queryClient.invalidateQueries({ queryKey: ["member", "guarantor-requests"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to accept guarantee request.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectGuarantorRequest(id),
    onSuccess: () => {
      toast.info("Guarantee request rejected.");
      queryClient.invalidateQueries({ queryKey: ["member", "guarantor-requests"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reject guarantee request.");
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return null; // Don't take space if member has no guarantee requests
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/30 dark:bg-amber-950/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Guarantee Requests</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Members requesting you to act as a loan guarantor ({pendingRequests.length} pending)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          title="Refresh requests"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40 border border-amber-200/80 dark:border-amber-900/50 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
        {requests.map((req) => (
          <GuarantorRequestRow
            key={req.id}
            request={req}
            onAccept={() => acceptMutation.mutate(req.id)}
            onReject={() => rejectMutation.mutate(req.id)}
            isActing={acceptMutation.isPending || rejectMutation.isPending}
          />
        ))}
      </div>
    </section>
  );
}

function GuarantorRequestRow({
  request,
  onAccept,
  onReject,
  isActing,
}: {
  request: GuarantorRequest;
  onAccept: () => void;
  onReject: () => void;
  isActing: boolean;
}) {
  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">{request.applicant_name}</span>
          <span className="text-xs text-slate-500">({request.loan_number ?? "Application"})</span>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Requested Loan: <strong className="text-slate-900 dark:text-white">{currencyFormatter.format(request.loan_amount)}</strong>
          {request.amount_guaranteed > 0 && (
            <span className="ml-2 text-amber-700 dark:text-amber-400 font-medium">
              • Guaranteed Portion: {currencyFormatter.format(request.amount_guaranteed)}
            </span>
          )}
        </p>
        {request.loan_purpose && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{request.loan_purpose}"</p>
        )}
      </div>

      {request.status === "pending" ? (
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={onReject}
            disabled={isActing}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/60 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={isActing}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept
          </button>
        </div>
      ) : (
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
          Responded ({request.status})
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "accepted" | "rejected" }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  };

  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status]}`}>{status.toUpperCase()}</span>;
}
