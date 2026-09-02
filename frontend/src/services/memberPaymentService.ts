import api from "@/lib/api";
import {
  getMemberLoan,
  getMemberLoans,
  type MemberLoan,
  type MemberLoanRepayment,
} from "@/services/memberLoanService";

export interface CreateMemberRepaymentRequest {
  loanId: number;
  schedule_id: number;
  amount_paid: number;
  payment_date: string;
  method?: string;
  notes?: string;
}

export interface CreateMemberRepaymentResponse {
  repayment: MemberLoanRepayment;
  updated_schedule_entry: {
    id: number;
    loan_id: number;
    installment_number: number;
    due_date: string;
    total_due: number;
    amount_paid: number;
    status: "pending" | "partial" | "paid" | "overdue";
  };
}

export interface PaymentRequestItem {
  id: number;
  sacco_id: number;
  member_id: number;
  loan_id: number;
  loan_schedule_id: number;
  amount: number;
  method: string;
  payment_date: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  member?: { id: number; name: string; email: string };
  loan?: any;
  loan_schedule?: any;
  reviewer?: { id: number; name: string };
}

export async function getMemberPaymentLoans(): Promise<MemberLoan[]> {
  const firstPage = await getMemberLoans();
  const loans = [...firstPage.loans];

  for (let page = 2; page <= firstPage.pagination.lastPage; page += 1) {
    const nextPage = await getMemberLoans(page);
    loans.push(...nextPage.loans);
  }

  return loans;
}

export async function getMemberPaymentLoan(loanId: number): Promise<MemberLoan> {
  return getMemberLoan(String(loanId));
}

export async function getMemberRepaymentHistory(loanId: number): Promise<MemberLoanRepayment[]> {
  const { data } = await api.get<{ data: MemberLoanRepayment[] }>(`/loans/${loanId}/repayments`);
  return data.data ?? [];
}

export async function createMemberRepayment({ loanId, ...request }: CreateMemberRepaymentRequest): Promise<CreateMemberRepaymentResponse> {
  const { data } = await api.post<{ data: CreateMemberRepaymentResponse }>(`/loans/${loanId}/repayments`, request);
  return data.data;
}

export async function createPaymentRequest({
  loanId,
  schedule_id,
  amount_paid,
  payment_date,
  method,
  notes,
}: CreateMemberRepaymentRequest): Promise<PaymentRequestItem> {
  const { data } = await api.post<{ data: PaymentRequestItem }>(
    `/loans/${loanId}/payment-requests`,
    {
      schedule_id,
      amount_paid,
      payment_date,
      method: method ?? "manual",
      notes,
    },
  );
  return data.data;
}

export async function getMyPaymentRequests(page = 1): Promise<{
  data: PaymentRequestItem[];
  meta?: { current_page?: number; last_page?: number; total?: number };
}> {
  const { data } = await api.get<{
    data: PaymentRequestItem[];
    meta?: { current_page?: number; last_page?: number; total?: number };
  }>("/me/payment-requests", { params: { page } });
  return data;
}
