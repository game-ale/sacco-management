import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyPaymentPage from './VerifyPaymentPage';
import api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('VerifyPaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls backend verification with tx_ref and shows success message', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Payment processed successfully.',
      },
    });

    render(
      <MemoryRouter initialEntries={['/member/payments/verify?tx_ref=CHAPA-savings-1-0-0-TEST01']}>
        <VerifyPaymentPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifying Payment/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/payments/chapa/verify?tx_ref=CHAPA-savings-1-0-0-TEST01');
      expect(screen.getByText(/Payment Successful!/i)).toBeInTheDocument();
      expect(screen.getByText(/Payment processed successfully./i)).toBeInTheDocument();
    });
  });

  it('supports trx_ref alias parameter from Chapa redirect', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Your transaction has been recorded successfully.',
      },
    });

    render(
      <MemoryRouter initialEntries={['/member/payments/verify?trx_ref=CHAPA-loan-1-5-1-TEST02']}>
        <VerifyPaymentPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/payments/chapa/verify?tx_ref=CHAPA-loan-1-5-1-TEST02');
      expect(screen.getByText(/Payment Successful!/i)).toBeInTheDocument();
    });
  });

  it('displays payment failed when backend verification fails', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Payment verification failed.',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/member/payments/verify?tx_ref=CHAPA-savings-1-0-0-FAIL']}>
        <VerifyPaymentPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Payment verification failed./i)).toBeInTheDocument();
    });
  });

  it('displays error when no tx_ref or trx_ref is present in URL', async () => {
    render(
      <MemoryRouter initialEntries={['/member/payments/verify']}>
        <VerifyPaymentPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing transaction reference./i)).toBeInTheDocument();
    });
    expect(api.get).not.toHaveBeenCalled();
  });
});
