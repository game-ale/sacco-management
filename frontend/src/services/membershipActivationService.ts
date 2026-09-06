import api from '../lib/api';

export interface ActivationValidationResponse {
  status: 'valid' | 'invalid' | 'expired' | 'already_activated' | 'not_approved' | 'user_exists';
  message?: string;
  data?: {
    full_name: string;
    email: string;
    sacco_name: string;
    expires_at?: string;
  };
}

export interface CompleteActivationPayload {
  password: string;
  password_confirmation: string;
}

export const membershipActivationService = {
  validateToken: async (token: string): Promise<ActivationValidationResponse> => {
    try {
      const response = await api.get<ActivationValidationResponse>(`/public/membership-activation/${token}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        status: 'invalid',
        message: 'This activation link is invalid or unreachable.',
      };
    }
  },

  completeActivation: async (token: string, payload: CompleteActivationPayload) => {
    const response = await api.post(`/public/membership-activation/${token}`, payload);
    return response.data;
  },
};
