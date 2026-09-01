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
