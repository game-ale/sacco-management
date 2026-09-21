import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

import { useAuthStore } from '../../stores/auth';

export default function VerifyPaymentPage() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref') || searchParams.get('reference');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const verifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!txRef) {
      setStatus('error');
      setMessage('Missing transaction reference.');
      toast.error('Missing transaction reference.');
      return;
    }

    if (verifiedRef.current === txRef) {
      return;
    }
    verifiedRef.current = txRef;

    const verify = async () => {
      try {
        const { data } = await api.get(`/payments/chapa/verify?tx_ref=${encodeURIComponent(txRef)}`);
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your transaction has been recorded successfully.');
          toast.success(data.message || 'Payment successful!');
          // Refresh user profile so new savings/shares balance reflects in other pages
          await useAuthStore.getState().getProfile();
        } else {
          setStatus('error');
          setMessage(data.message || 'Payment verification failed.');
          toast.error(data.message || 'Payment verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        const errMsg = err.response?.data?.message || 'Error verifying payment.';
        setMessage(errMsg);
        toast.error(errMsg);
      }
    };

    verify();
  }, [txRef]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {status === 'loading' && (
        <>
          <Loader2 className="w-16 h-16 animate-spin text-emerald-600 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Verifying Payment...</h2>
          <p className="text-slate-500 mt-2">Please wait while we confirm your payment with Chapa.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Payment Successful!</h2>
          <p className="text-slate-500 mt-2 mb-6">{message || 'Your transaction has been recorded successfully.'}</p>
          <button onClick={() => navigate('/member/payments')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
            Return to Payments
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-20 h-20 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Payment Failed</h2>
          <p className="text-slate-500 mt-2 mb-6">{message || 'We could not verify your payment. Please try again or contact support.'}</p>
          <button onClick={() => navigate('/member/payments')} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300">
            Return to Payments
          </button>
        </>
      )}
    </div>
  );
}
