import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Shield, Eye, EyeOff, CheckCircle2, AlertCircle, Clock, Lock, ArrowRight, Building2 } from 'lucide-react';
import {
  membershipActivationService,
  type ActivationValidationResponse,
} from '../../services/membershipActivationService';

const activationSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type ActivationForm = z.infer<typeof activationSchema>;

export function MembershipActivationPage() {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get('token') || '';
  const navigate = useNavigate();

  const [validationState, setValidationState] = useState<'LOADING' | 'VALID' | 'EXPIRED' | 'ALREADY_ACTIVATED' | 'INVALID' | 'USER_EXISTS' | 'SUCCESS'>('LOADING');
  const [details, setDetails] = useState<{ full_name?: string; email?: string; sacco_name?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivationForm>({
    resolver: zodResolver(activationSchema),
  });

  useEffect(() => {
    if (!token) {
      setValidationState('INVALID');
      setErrorMessage('Activation token is missing.');
      return;
    }

    let isMounted = true;

    const validate = async () => {
      try {
        const res: ActivationValidationResponse = await membershipActivationService.validateToken(token);
        if (!isMounted) return;

        if (res.status === 'valid' && res.data) {
          setDetails(res.data);
          setValidationState('VALID');
        } else if (res.status === 'expired') {
          setValidationState('EXPIRED');
          setErrorMessage(res.message || 'This activation link has expired.');
        } else if (res.status === 'already_activated') {
          setValidationState('ALREADY_ACTIVATED');
          setErrorMessage(res.message || 'This activation link has already been used.');
        } else if (res.status === 'user_exists') {
          setValidationState('USER_EXISTS');
          setErrorMessage(res.message || 'An account with this email already exists.');
        } else {
          setValidationState('INVALID');
          setErrorMessage(res.message || 'This activation link is invalid.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setValidationState('INVALID');
        setErrorMessage('Failed to validate activation link.');
      }
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const onSubmit = async (data: ActivationForm) => {
    setIsSubmitting(true);
    try {
      await membershipActivationService.completeActivation(token, {
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      toast.success('Account activated successfully!');
      setValidationState('SUCCESS');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to activate account. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto my-auto">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-[#0B6B3A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0B6B3A]/20 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Activate Your SACCO Account</h1>
          <p className="text-sm text-slate-500 mt-1">Complete your registration to access your member dashboard</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {/* 1. LOADING STATE */}
          {validationState === 'LOADING' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#0B6B3A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600">Verifying activation token...</p>
            </div>
          )}

          {/* 2. SUCCESS STATE */}
          {validationState === 'SUCCESS' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Account Activated Successfully!</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Your password has been set. You can now log in using your email address and new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 3. EXPIRED STATE */}
          {validationState === 'EXPIRED' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <Clock className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Activation Link Expired</h2>
                <p className="text-sm text-slate-600 mt-2">{errorMessage}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Please contact your SACCO administrator to request a new activation link.
                </p>
              </div>
              <Link
                to="/saccos"
                className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                Return to Directory
              </Link>
            </div>
          )}

          {/* 4. ALREADY ACTIVATED STATE */}
          {validationState === 'ALREADY_ACTIVATED' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Already Activated</h2>
                <p className="text-sm text-slate-600 mt-2">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 5. INVALID / USER_EXISTS STATE */}
          {(validationState === 'INVALID' || validationState === 'USER_EXISTS') && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Invalid Activation Link</h2>
                <p className="text-sm text-slate-600 mt-2">{errorMessage}</p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-xl font-medium transition-all"
                >
                  Go to Login
                </button>
                <Link
                  to="/"
                  className="block w-full py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Back to Homepage
                </Link>
              </div>
            </div>
          )}

          {/* 6. VALID FORM STATE */}
          {validationState === 'VALID' && details && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* SACCO Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-[#0B6B3A] shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Application</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{details.sacco_name}</p>
                  <p className="text-xs text-slate-500 truncate">{details.full_name} ({details.email})</p>
                </div>
              </div>

              {/* Create Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]'
                    } focus:ring-1 outline-none bg-slate-50/50`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm ${
                      errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]'
                    } focus:ring-1 outline-none bg-slate-50/50`}
                    {...register('password_confirmation')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-xs text-red-500 mt-1">{errors.password_confirmation.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
