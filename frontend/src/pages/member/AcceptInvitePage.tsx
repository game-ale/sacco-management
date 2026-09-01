import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'

const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(9, 'Phone number is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  national_id: z.string().min(1, 'National ID is required'),
  region: z.string().min(1, 'Region is required'),
  zone: z.string().min(1, 'Zone is required'),
  town: z.string().min(1, 'Town is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
})

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
  })

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Invalid Invitation Link</h2>
          <p className="text-slate-600">This invitation link is missing a valid token.</p>
          <Link to="/" className="text-[#0B6B3A] hover:underline block">Return to Homepage</Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: AcceptInviteForm) => {
    setIsLoading(true)
    try {
      await api.post('/members/register', {
        ...data,
        token,
      })
      
      toast.success('Registration successful! You can now log in.')
      navigate('/login')
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to complete registration.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-slate-50">
      <div className="w-full max-w-2xl mx-auto py-12 px-6">
        
        <div className="flex justify-center mb-8">
          <div className="bg-[#0B6B3A] p-3 rounded-xl shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Complete Your Profile</h1>
            <p className="text-slate-500">You've been invited to join the SACCO. Fill in your details below to activate your member account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Kebede"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. abebe123"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.username ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                  {...register('username')}
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium text-sm shrink-0">
                    +251
                  </div>
                  <input
                    type="tel"
                    placeholder="911 234 567"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                    {...register('phone')}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">National ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.national_id ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                  {...register('national_id')}
                />
                {errors.national_id && <p className="text-xs text-red-500">{errors.national_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Region <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Oromia"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.region ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                  {...register('region')}
                />
                {errors.region && <p className="text-xs text-red-500">{errors.region.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Zone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Shewa"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.zone ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                  {...register('zone')}
                />
                {errors.zone && <p className="text-xs text-red-500">{errors.zone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Town/City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Adama"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.town ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50`}
                  {...register('town')}
                />
                {errors.town && <p className="text-xs text-red-500">{errors.town.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Create Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50 pr-12`}
                    {...register('password')}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.password_confirmation ? 'border-red-500' : 'border-slate-200'} focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none bg-slate-50 pr-12`}
                    {...register('password_confirmation')}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? 'Processing...' : (
                  <>Create Account <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
