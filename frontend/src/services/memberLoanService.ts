import api from "@/lib/api";

export type MemberLoanStatus =
  | "pending"
  | "approved"
  | "active"
  | "rejected"
  | "closed"
  | "completed";

export interface LoanGuarantorItem {
  id: number;
  member_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  amount_guaranteed: number;
  status: "pending" | "accepted" | "rejected";
}

export interface FinancialPositionData {
  current_savings: number;
  num_shares: number;
  share_capital: number;
  max_3x_limit: number;
  requested_amount: number;
  is_within_3x_limit: boolean;
  requires_guarantors: boolean;
  all_guarantors_accepted: boolean;
  is_eligible_for_approval: boolean;
}

export interface MemberLoan {
  id: number;
  loan_number: string;
  amount: number;
  purpose: string;
  status: MemberLoanStatus;
  interest_rate: number | null;
  term_months: number | null;
  total_repayable: number | null;
  monthly_installment: number | null;
  rejection_reason: string | null;
  approved_at: string | null;
  disbursed_at: string | null;
  created_at: string | null;
  repayment_schedule?: MemberLoanSchedule[];
  repayments?: MemberLoanRepayment[];
  guarantors?: LoanGuarantorItem[];
  financial_position?: FinancialPositionData;
}

export interface MemberLoanSchedule {
  id: number;
  installment_number: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  total_due: number;
  amount_paid: number;
  status: "pending" | "paid" | "overdue";
}

export interface MemberLoanRepayment {
  id: number;
  loan_schedule_id: number;
  amount: number;
  paid_at: string;
  method: string;
}

interface LaravelLoanPagination {
  data: MemberLoan[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
}

export interface MemberLoansPage {
  loans: MemberLoan[];
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
}

export interface ApplyForLoanRequest {
  amount: number;
  purpose: string;
  loan_type: string;
  term_months: number;
  guarantor_id?: number | null;
  guarantor_ids?: number[];
}

export async function getMemberLoans(page = 1): Promise<MemberLoansPage> {
  const { data } = await api.get<LaravelLoanPagination>("/me/loans", {
    params: { page },
  });

  return {
    loans: data.data ?? [],
    pagination: {
      currentPage: data.meta?.current_page ?? page,
      lastPage: data.meta?.last_page ?? 1,
      total: data.meta?.total ?? 0,
    },
  };
}

export async function getMemberLoan(id: string): Promise<MemberLoan> {
  const { data } = await api.get<{ data: MemberLoan }>(`/loans/${id}`);
  return data.data;
}

export async function applyForLoan(
  request: ApplyForLoanRequest,
): Promise<MemberLoan> {
  const { data } = await api.post<{ data: MemberLoan }>("/loans", request);
  return data.data;
}

export interface GuarantorSearchUser {
  id: number;
  name: string;
  email: string;
  national_id: string;
}

export async function searchGuarantors(query: string): Promise<GuarantorSearchUser[]> {
  const { data } = await api.get<{ data: GuarantorSearchUser[] }>("/guarantors/search", {
    params: { search: query }
  });
  return data.data;
}

export interface GuarantorRequest {
  id: number;
  loan_id: number;
  loan_number: string | null;
  applicant_name: string;
  applicant_email: string | null;
  loan_amount: number;
  loan_purpose: string | null;
  amount_guaranteed: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export async function getGuarantorRequests(): Promise<GuarantorRequest[]> {
  const { data } = await api.get<{ data: GuarantorRequest[] }>("/guarantor-requests");
  return data.data;
}

export async function acceptGuarantorRequest(id: number): Promise<void> {
  await api.patch(`/guarantor-requests/${id}/accept`);
}

export async function rejectGuarantorRequest(id: number): Promise<void> {
  await api.patch(`/guarantor-requests/${id}/reject`);
}
