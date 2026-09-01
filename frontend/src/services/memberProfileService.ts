import api from "@/lib/api";
import type { User } from "@/types";

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  national_id?: string;
  region?: string;
  zone?: string;
  town?: string;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const response = await api.put<{ data: User }>("/profile", data);
  return response.data.data;
}
