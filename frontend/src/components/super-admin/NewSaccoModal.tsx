import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Building2, User, MapPin, Lock, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react'
import { adminSaccoService, type CreateSaccoPayload } from '../../services/adminSaccoService'

const baseSaccoSchema = z.object({
  sacco_name: z.string().min(2, 'SACCO name is required'),
  registration_number: z.string().min(2, 'Registration number is required'),
  admin_name: z.string().min(2, 'Admin full name is required'),
  admin_email: z.string().email('Valid admin email is required'),
  admin_username: z.string().min(3, 'Admin username must be at least 3 characters'),
  national_id: z.string().min(2, 'National ID is required'),
  region: z.string().min(2, 'Region is required'),
  zone: z.string().min(2, 'Zone is required'),
  town: z.string().min(2, 'Town/City is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(8, 'Password confirmation is required'),
})

const newSaccoSchema = baseSaccoSchema.refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type NewSaccoFormData = z.infer<typeof baseSaccoSchema>

interface NewSaccoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const NewSaccoModal: React.FC<NewSaccoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewSaccoFormData>({
    resolver: zodResolver(newSaccoSchema),
    defaultValues: {
      sacco_name: '',
      registration_number: '',
      admin_name: '',
      admin_email: '',
      admin_username: '',
      national_id: '',
      region: '',
      zone: '',
      town: '',
      password: '',
      password_confirmation: '',
    },
  })

  const adminEmail = watch('admin_email')

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      // Pre-fill a unique registration number by default for convenience
      const autoReg = `FCA-${Math.floor(100000 + Math.random() * 900000)}`
      setValue('registration_number', autoReg)
    } else {
      reset()
    }
  }, [isOpen, reset, setValue])

  const handleGenerateRegNumber = () => {
    const autoReg = `FCA-${Math.floor(100000 + Math.random() * 900000)}`
    setValue('registration_number', autoReg, { shouldValidate: true })
  }

  const handleGenerateUsername = () => {
    if (adminEmail && adminEmail.includes('@')) {
      const base = adminEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
      const autoUser = `${base}${Math.floor(100 + Math.random() * 900)}`
      setValue('admin_username', autoUser, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: NewSaccoFormData) => {
    setServerError(null)
    try {
      await adminSaccoService.createSacco(data as CreateSaccoPayload)
      toast.success(`SACCO Application for "${data.sacco_name}" created successfully!`)
      window.dispatchEvent(new CustomEvent('sacco-created'))
      reset()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      const resp = err.response?.data
      if (resp?.errors) {
        Object.keys(resp.errors).forEach((key) => {
          const fieldKey = key as keyof NewSaccoFormData
          const msg = Array.isArray(resp.errors[key]) ? resp.errors[key][0] : resp.errors[key]
          if (fieldKey in baseSaccoSchema.shape) {
            setError(fieldKey, { type: 'server', message: msg })
          }
        })
      }
      const message = resp?.message || (err instanceof Error ? err.message : 'Failed to create SACCO application')
      setServerError(message)
      toast.error(message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0F172A] px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30 text-[#F59E0B]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide">New SACCO Application</h2>
              <p className="text-xs text-slate-400">Register a new cooperative society application on the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-6 flex-1">
          {serverError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {serverError}
            </div>
          )}

          {/* Section 1: SACCO Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>1. SACCO Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SACCO Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Awash Savings & Credit Co-op"
                  {...register('sacco_name')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.sacco_name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.sacco_name && <p className="text-xs text-rose-500 mt-1">{errors.sacco_name.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRegNumber}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. FCA-123456"
                  {...register('registration_number')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.registration_number ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-mono`}
                />
                {errors.registration_number && (
                  <p className="text-xs text-rose-500 mt-1">{errors.registration_number.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Administrator Account */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>2. Primary Admin Account</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Kebede"
                  {...register('admin_name')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.admin_name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.admin_name && <p className="text-xs text-rose-500 mt-1">{errors.admin_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@sacco.com"
                  {...register('admin_email')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.admin_email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.admin_email && <p className="text-xs text-rose-500 mt-1">{errors.admin_email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Admin Username <span className="text-rose-500">*</span>
                  </label>
                  {adminEmail && (
                    <button
                      type="button"
                      onClick={handleGenerateUsername}
                      className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. abebe123"
                  {...register('admin_username')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.admin_username ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.admin_username && (
                  <p className="text-xs text-rose-500 mt-1">{errors.admin_username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  National ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  {...register('national_id')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.national_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.national_id && <p className="text-xs text-rose-500 mt-1">{errors.national_id.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Location Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>3. Location Info</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Region <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oromia"
                  {...register('region')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.region ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.region && <p className="text-xs text-rose-500 mt-1">{errors.region.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Zone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shewa"
                  {...register('zone')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.zone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.zone && <p className="text-xs text-rose-500 mt-1">{errors.zone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Town / City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adama"
                  {...register('town')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.town ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all`}
                />
                {errors.town && <p className="text-xs text-rose-500 mt-1">{errors.town.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 4: Admin Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <Lock className="w-4 h-4 text-purple-500" />
              <span>4. Security Credentials</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    {...register('password')}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                      errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    {...register('password_confirmation')}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                      errors.password_confirmation ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-xs text-rose-500 mt-1">{errors.password_confirmation.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Application</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
