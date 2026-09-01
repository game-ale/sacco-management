import api from "@/lib/api";

export interface MemberDividend {
  id: number;
  sacco_id: number;
  member_id: number;
  period: string;
  num_shares: number;
  share_pct: number;
  amount: number;
  total_pool: number;
  created_at: string | null;
  updated_at: string | null;
}

export async function getMemberDividends(): Promise<MemberDividend[]> {
  const { data } = await api.get<{ data: MemberDividend[] }>("/me/dividends");
  return data.data ?? [];
}
