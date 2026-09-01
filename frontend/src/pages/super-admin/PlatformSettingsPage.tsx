import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Save, 
  ShieldCheck, 
  Building2, 
  Bell, 
  Palette 
} from 'lucide-react'
import { platformSettingsService } from '../../services/platformSettingsService'
import type { PlatformSetting } from '../../types'

const settingsSchema = z.object({
  auto_approve_saccos: z.boolean(),
  require_registration_verification: z.boolean(),
  max_saccos_allowed: z.number().nullable().optional(),
  default_interest_rate: z.number().min(0).max(100),
  default_share_value: z.number().min(0),
  default_loan_to_savings_ratio: z.number().min(0),
  notify_new_sacco_registration: z.boolean(),
  notify_sacco_milestone: z.boolean(),
  weekly_platform_summary: z.boolean(),
  platform_name: z.string().min(2),
  support_email: z.string().email().nullable().or(z.literal('')),
  terms_of_service_url: z.string().url().nullable().or(z.literal('')),
  privacy_policy_url: z.string().url().nullable().or(z.literal('')),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export const PlatformSettingsPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: platformSettingsService.getSettings,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    if (data?.data) {
      reset({
        ...data.data,
        max_saccos_allowed: data.data.max_saccos_allowed || undefined,
        support_email: data.data.support_email || '',
        terms_of_service_url: data.data.terms_of_service_url || '',
        privacy_policy_url: data.data.privacy_policy_url || '',
      })
    }
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: (values: Partial<PlatformSetting>) => platformSettingsService.updateSettings(values),
    onSuccess: (res) => {
      toast.success(res.message || 'Settings updated successfully')
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      reset(res.data)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update settings')
    },
  })

  const onSubmit = (values: SettingsFormData) => {
    mutation.mutate({
      ...values,
      max_saccos_allowed: values.max_saccos_allowed || null,
      support_email: values.support_email || null,
      terms_of_service_url: values.terms_of_service_url || null,
      privacy_policy_url: values.privacy_policy_url || null,
    })
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">Loading settings...</div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure global platform behavior, defaults, and branding.
          </p>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty || isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Registration Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Registration Settings</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register('auto_approve_saccos')}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Auto-approve SACCOs</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automatically approve new SACCO registrations without manual review.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register('require_registration_verification')}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Require Document Verification</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mandate upload of registration documents during sign-up.</p>
                </div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max SACCOs Allowed</label>
              <input
                type="number"
                {...register('max_saccos_allowed', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                placeholder="Leave blank for unlimited"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Limit the total number of SACCOs on the platform.</p>
            </div>
          </div>
        </div>

        {/* Default SACCO Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Default SACCO Configuration</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('default_interest_rate', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              {errors.default_interest_rate && <p className="text-xs text-rose-500 mt-1">{errors.default_interest_rate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Share Value</label>
              <input
                type="number"
                step="0.01"
                {...register('default_share_value', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              {errors.default_share_value && <p className="text-xs text-rose-500 mt-1">{errors.default_share_value.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loan-to-Savings Ratio</label>
              <input
                type="number"
                step="0.01"
                {...register('default_loan_to_savings_ratio', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              {errors.default_loan_to_savings_ratio && <p className="text-xs text-rose-500 mt-1">{errors.default_loan_to_savings_ratio.message}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Email Notifications</h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register('notify_new_sacco_registration')}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">New SACCO Registration</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive an email when a new SACCO registers.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register('notify_sacco_milestone')}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">SACCO Milestones</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Notify when a SACCO hits major growth milestones.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register('weekly_platform_summary')}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Weekly Summary</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive a weekly digest of platform activity.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
              <Palette className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform Branding</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform Name</label>
                <input
                  type="text"
                  {...register('platform_name')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                {errors.platform_name && <p className="text-xs text-rose-500 mt-1">{errors.platform_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Support Email</label>
                <input
                  type="email"
                  {...register('support_email')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                {errors.support_email && <p className="text-xs text-rose-500 mt-1">{errors.support_email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Terms URL</label>
                  <input
                    type="text"
                    {...register('terms_of_service_url')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  {errors.terms_of_service_url && <p className="text-xs text-rose-500 mt-1">{errors.terms_of_service_url.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Privacy URL</label>
                  <input
                    type="text"
                    {...register('privacy_policy_url')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  {errors.privacy_policy_url && <p className="text-xs text-rose-500 mt-1">{errors.privacy_policy_url.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
