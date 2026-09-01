import api from "@/lib/api";

export type MemberSavingsTransactionType = "deposit" | "withdraw";

export interface MemberSavingsTransaction {
  id: number;
  type: MemberSavingsTransactionType;
  amount: number;
  balance_after: number | null;
  description: string | null;
  date: string | null;
}

export interface MemberSavingsPage {
  balance: number;
  transactions: MemberSavingsTransaction[];
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
}

interface LaravelPagination<T> {
  data?: T[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
}

interface MemberSavingsPayload {
  balance?: number;
  transactions?: LaravelPagination<MemberSavingsTransaction>;
}

export async function getMemberSavings(page = 1): Promise<MemberSavingsPage> {
  const { data } = await api.get<{ data: MemberSavingsPayload }>(
    "/me/savings",
    { params: { page } },
  );
  const payload = data.data;
  const transactions = payload.transactions;

  return {
    balance: Number(payload.balance ?? 0),
    transactions: transactions?.data ?? [],
    pagination: {
      currentPage: transactions?.meta?.current_page ?? page,
      lastPage: transactions?.meta?.last_page ?? 1,
      total: transactions?.meta?.total ?? 0,
    },
  };
}
