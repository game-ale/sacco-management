import api from "@/lib/api";
import type { User } from "@/types";

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  national_id?: string;
  region?: string;
  zone?: string;
  town?: string;
  profile_photo?: File;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  
  if (data.name) formData.append('name', data.name);
  if (data.phone) formData.append('phone', data.phone);
  if (data.national_id) formData.append('national_id', data.national_id);
  if (data.region) formData.append('region', data.region);
  if (data.zone) formData.append('zone', data.zone);
  if (data.town) formData.append('town', data.town);
  if (data.profile_photo) {
    formData.append('profile_photo', data.profile_photo);
  }

  const response = await api.post<{ data: User }>("/profile", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}
