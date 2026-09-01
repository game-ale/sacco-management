import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: `${API_URL}/public`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface PublicStats {
  saccos_registered: number;
  active_members: number;
  birr_managed: number;
  monthly_growth: number[];
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const publicService = {
  getStats: async (): Promise<PublicStats> => {
    const response = await apiClient.get('/stats');
    return response.data.data;
  },

  submitContactForm: async (data: ContactFormData): Promise<void> => {
    await apiClient.post('/contact', data);
  },
};
