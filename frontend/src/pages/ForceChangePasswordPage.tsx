import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '../services/authService'
import { useAuthStore } from '../stores/auth'

const changeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirmation: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords don't match",
  path: ['new_password_confirmation'],
})

type ChangeFormValues = z.infer<typeof changeSchema>

export const ForceChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangeFormValues>({
    resolver: zodResolver(changeSchema),
  })

  const newPassword = watch('new_password', '')

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

  const strength = calculateStrength(newPassword)

  const onSubmit = async (data: ChangeFormValues) => {
    try {
      setSubmitError(null)
      await authService.changePassword(data)
      // Refresh user profile to clear the must_change_password flag
      await useAuthStore.getState().getProfile()
      const user = useAuthStore.getState().user
      // Navigate to the appropriate dashboard
      if (user?.role === 'superadmin') navigate('/super-admin', { replace: true })
      else if (user?.role === 'admin') navigate('/admin', { replace: true })
      else navigate('/member', { replace: true })
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Failed to change password.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Password Change Required
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your administrator has reset your password. For security, you must set a new password before continuing.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {submitError && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium text-center">
                {submitError}
              </div>
            )}

            {/* Current / Temporary Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Temporary Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your temporary password"
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border ${errors.current_password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                  {...register('current_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.current_password && <p className="text-xs text-red-500">{errors.current_password.message}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a strong password"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.new_password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                  {...register('new_password')}
                />
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
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
              {errors.new_password && <p className="text-xs text-red-500">{errors.new_password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.new_password_confirmation ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                  {...register('new_password_confirmation')}
                />
              </div>
              {errors.new_password_confirmation && <p className="text-xs text-red-500">{errors.new_password_confirmation.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#0B6B3A] hover:bg-[#095730] text-white rounded-xl font-semibold shadow-sm shadow-[#0B6B3A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Set New Password & Continue'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
