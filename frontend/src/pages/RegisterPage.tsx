import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { Shield, ShieldCheck, Eye, EyeOff, ArrowRight, Clock, CreditCard } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  const registerSchema = z.object({
    sacco_name: z.string().min(1, 'SACCO name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(9, 'Phone number is required'),
    address: z.string().optional(),
    name: z.string().min(1, t('auth.nameRequired')),
    admin_email: z.string().email('Invalid admin email'),
    password: z.string().min(8, t('auth.passwordMin')),
    password_confirmation: z.string(),
    national_id: z.string().min(1, 'National ID is required'),
    region: z.string().min(1, 'Region is required'),
    zone: z.string().min(1, 'Zone is required'),
    town: z.string().min(1, 'Town is required'),
  }).refine((data) => data.password === data.password_confirmation, {
    message: t('auth.passwordMatch'),
    path: ['password_confirmation'],
  })

  type RegisterForm = z.infer<typeof registerSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const passwordStrength = useMemo(() => {
    if (!passwordValue) return 0
    let score = 0
    if (passwordValue.length >= 8) score++
    if (/[A-Z]/.test(passwordValue)) score++
    if (/[0-9]/.test(passwordValue)) score++
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++
    return score
  }, [passwordValue])

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  const onSubmit = async (data: RegisterForm) => {
    try {
      const autoRegNum = `FCA-${Math.floor(100000 + Math.random() * 900000)}`
      const autoUsername = `${data.admin_email.split('@')[0]}${Math.floor(Math.random() * 1000)}`
      
      await registerUser({
        sacco_name: data.sacco_name,
        registration_number: autoRegNum,
        admin_name: data.name,
        admin_email: data.admin_email,
        admin_username: autoUsername,
        password: data.password,
        password_confirmation: data.password_confirmation,
        national_id: data.national_id,
        region: data.region,
        zone: data.zone,
        town: data.town,
      })
      toast.success('Account created successfully! Your SACCO is pending approval.')
      navigate('/admin')
    } catch (error: any) {
      const message = error.response?.data?.message || (error instanceof Error ? error.message : 'Registration failed')
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0B6B3A] to-[#065F46] dark:from-emerald-900 dark:to-emerald-950 relative overflow-hidden flex-col justify-end px-12 xl:px-20 pb-16 sticky top-0 h-screen">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
         
         <div className="relative z-10 text-white">
            <Link to="/" className="inline-block mb-16">
               <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl inline-flex mb-4 border border-white/10">
                 <Shield className="w-8 h-8 text-white" />
               </div>
               <h2 className="text-3xl font-bold">SACCO Manager</h2>
            </Link>

            <div className="mb-12">
              <h3 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight">
                Register Your SACCO
              </h3>
              <p className="text-green-100 text-lg max-w-md">
                Join the modern digital finance ecosystem designed for Ethiopian cooperative societies. Secure, fast, and reliable.
              </p>
            </div>

            <div className="space-y-5">
               <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                 <div className="bg-white/10 p-2 rounded-lg shrink-0">
                   <ShieldCheck className="w-5 h-5 text-green-300" />
                 </div>
                 <div>
                   <span className="font-semibold block">Bank-grade security</span>
                   <span className="text-green-200 text-sm">Your members' data is encrypted and secure.</span>
                 </div>
               </div>
               <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                 <div className="bg-white/10 p-2 rounded-lg shrink-0">
                   <Clock className="w-5 h-5 text-green-300" />
                 </div>
                 <div>
                   <span className="font-semibold block">24hr approval</span>
                   <span className="text-green-200 text-sm">Fast-tracked onboarding for registered entities.</span>
                 </div>
               </div>
               <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                 <div className="bg-white/10 p-2 rounded-lg shrink-0">
                   <CreditCard className="w-5 h-5 text-green-300" />
                 </div>
                 <div>
                   <span className="font-semibold block">Free to start</span>
                   <span className="text-green-200 text-sm">No upfront setup fees for new registrations.</span>
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="lg:hidden bg-[#0B6B3A] p-6 text-white flex items-center gap-2 shadow-md relative z-10">
        <Shield className="w-6 h-6" />
        <span className="font-bold text-xl">SACCO Manager</span>
      </div>

      {/* RIGHT PANEL (Register Form) */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 lg:p-12 xl:p-16 bg-white dark:bg-slate-900 min-h-screen overflow-y-auto transition-colors duration-300">
         <div className="w-full max-w-lg py-8">
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* SECTION 1: Organization Details */}
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                  1. Organization Details
                </h2>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">SACCO Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Awash Cooperative"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.sacco_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('sacco_name')}
                  />
                  {errors.sacco_name && <p className="text-sm text-red-500">{errors.sacco_name.message}</p>}
                </div>



                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Official Email</label>
                  <input
                    type="email"
                    placeholder="info@sacco.com"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('email')}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm shrink-0">
                      +251
                    </div>
                    <input
                      type="tel"
                      placeholder="911 234 567"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Physical Address <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Sub-city, Woreda, Building Name"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                    {...register('address')}
                  ></textarea>
                </div>
              </div>

              {/* SECTION 2: Admin Account */}
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                  2. Admin Account
                </h2>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Abebe Kebede"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('name')}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    placeholder="admin@sacco.com"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.admin_email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('admin_email')}
                  />
                  {errors.admin_email && <p className="text-sm text-red-500">{errors.admin_email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">National ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.national_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    {...register('national_id')}
                  />
                  {errors.national_id && <p className="text-sm text-red-500">{errors.national_id.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Region <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Oromia"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.region ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      {...register('region')}
                    />
                    {errors.region && <p className="text-sm text-red-500">{errors.region.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zone <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Shewa"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.zone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      {...register('zone')}
                    />
                    {errors.zone && <p className="text-sm text-red-500">{errors.zone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Town/City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Adama"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.town ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      {...register('town')}
                    />
                    {errors.town && <p className="text-sm text-red-500">{errors.town.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      {...register('password', {
                        onChange: (e) => setPasswordValue(e.target.value),
                      })}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {passwordValue && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 text-right">
                        {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Too short'}
                      </p>
                    </div>
                  )}
                  {!passwordValue && (
                    <p className="text-xs text-slate-400">Must be at least 8 characters</p>
                  )}
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.password_confirmation ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-[#0B6B3A] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#0B6B3A] outline-none transition-colors bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
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
                  {errors.password_confirmation && <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>}
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#0B6B3A] focus:ring-[#0B6B3A] dark:bg-slate-800" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    I agree to the <Link to="/terms" className="text-[#0B6B3A] dark:text-emerald-400 font-medium hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#0B6B3A] dark:text-emerald-400 font-medium hover:underline">Privacy Policy</Link>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? t('common.loading') : (
                    <>Register SACCO <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Already registered?{' '}
                    <Link to="/login" className="font-bold text-[#0B6B3A] dark:text-emerald-400 hover:underline">
                      Log in here
                    </Link>
                  </p>
                </div>
              </div>

            </form>

         </div>
      </div>

    </div>
  )
}
