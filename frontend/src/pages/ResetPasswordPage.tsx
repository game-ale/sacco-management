import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, Loader2, ShieldCheck, TrendingUp, Zap, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '../services/authService'

const resetSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
})

type ResetFormValues = z.infer<typeof resetSchema>

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: email || '',
    }
  })

  const password = watch('password', '')

  // Password strength logic
  const calculateStrength = (pass: string) => {
    let score = 0
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200' }
    if (pass.length >= 8) score++
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) score++
    if (pass.match(/\d/)) score++
    if (pass.match(/[^a-zA-Z\d]/)) score++

    if (score < 2) return { score, text: 'Weak', color: 'bg-rose-500' }
    if (score === 2) return { score, text: 'Fair', color: 'bg-amber-500' }
    if (score === 3) return { score, text: 'Good', color: 'bg-emerald-400' }
    return { score, text: 'Strong', color: 'bg-[#0B6B3A]' }
  }

  const strength = calculateStrength(password)

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      setSubmitError('Invalid or missing reset token.')
      return
    }

    try {
      setSubmitError(null)
      await authService.resetPassword({
        token,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation
      })
      setIsSubmitted(true)
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Failed to reset password.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Left Side - Illustration / Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B6B3A] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#0B6B3A] font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Stitch AI</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Secure Access to Your SACCO
            </h2>
            <p className="text-green-50 text-sm leading-relaxed mb-4">
              From the traditional <span className="text-[#F59E0B] font-semibold">Equb</span> and <span className="text-[#F59E0B] font-semibold">Edir</span> systems, Ethiopians have always believed in the power of collective savings. SACCOs modernize this heritage.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium text-green-50 text-sm">Secure multi-tenant platform</span>
            </div>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium text-green-50 text-sm">Real-time tracking & analytics</span>
            </div>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium text-green-50 text-sm">Lightning fast loan processing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-green-200/60 text-sm">
          &copy; {new Date().getFullYear()} Stitch AI. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Set New Password
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Please choose a strong password for your account.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium text-center">
                  {submitError}
                </div>
              )}

              {/* Hidden Email Field if provided via URL */}
              {!email && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] outline-none bg-white dark:bg-slate-800`}
                    {...register('email')}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1 h-1.5 w-full">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 rounded-full ${
                            strength.score >= level ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                          } transition-all duration-300`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-right font-medium">
                      {strength.text}
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${errors.password_confirmation ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('password_confirmation')}
                  />
                </div>
                {errors.password_confirmation && <p className="text-sm text-red-500 mt-1">{errors.password_confirmation.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!token && !submitError)}
                className="w-full py-3.5 px-4 bg-[#0B6B3A] hover:bg-[#095730] text-white rounded-xl font-semibold shadow-sm shadow-[#0B6B3A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0B6B3A] dark:text-emerald-400 hover:text-[#095730] dark:hover:text-emerald-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Password Reset Successful</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B6B3A] hover:bg-[#095730] text-white font-semibold rounded-xl shadow-sm transition-colors"
              >
                Go to Login
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
