import { useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuthStore } from '../../stores/auth'
import { updateProfile, type UpdateProfileRequest } from '../../services/memberProfileService'
import { User, Mail, Phone, MapPin, CreditCard, Save, Camera, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '../../services/authService'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const getProfile = useAuthStore((state) => state.getProfile)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)

  const { user } = useAuthStore()
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profile_photo_url || null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    national_id: user?.national_id || '',
    region: user?.region || '',
    zone: user?.zone || '',
    town: user?.town || '',
    profile_photo: null as File | null,
  })

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update the auth store with fresh data
      useAuthStore.setState((state) => ({
        ...state,
        user: { ...state.user!, ...updatedUser },
      }))
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message
        toast.error(message || 'Failed to update profile.')
      } else {
        toast.error('Failed to update profile.')
      }
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData(prev => ({ ...prev, profile_photo: file }))
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disablePassword) {
      toast.error("Password is required")
      return
    }
    
    setIsDisabling(true)
    try {
      await authService.disableTwoFactor(disablePassword)
      toast.success("Two-factor authentication disabled successfully")
      await getProfile()
      setShowDisableConfirm(false)
      setDisablePassword('')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to disable 2FA. Check your password.")
    } finally {
      setIsDisabling(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: UpdateProfileRequest = { 
      name: formData.name,
      phone: formData.phone,
      national_id: formData.national_id,
      region: formData.region,
      zone: formData.zone,
      town: formData.town,
    }
    if (formData.profile_photo) {
      payload.profile_photo = formData.profile_photo;
    }
    mutation.mutate(payload)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-sm text-slate-500">Update your personal information and account details.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="relative h-32 w-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <User className="h-12 w-12" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white mb-1" />
                  <span className="text-white text-xs font-semibold">Change</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-slate-500 font-medium text-center">Click image to upload<br/>new profile photo</p>
            </div>

            <div className="flex-1 space-y-8 w-full">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400">Contact admin to change email.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">National ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Region</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Zone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Town/City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#0B6B3A] focus:ring-1 focus:ring-[#0B6B3A] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          
          {/* Two Factor Authentication Section */}
          <div className="space-y-6 mt-12">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Security Settings</h3>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-slate-200 text-slate-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-500">Add additional security to your account using TOTP.</p>
                </div>
              </div>
              
              <div className="p-6">
                {user?.two_factor_confirmed_at ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                      <Shield className="w-5 h-5 shrink-0" />
                      <span className="font-medium text-sm">Two-factor authentication is currently enabled.</span>
                    </div>
                    
                    {!showDisableConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDisableConfirm(true)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Disable Two-Factor Authentication
                      </button>
                    ) : (
                      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                        <p className="text-sm text-slate-700 font-medium">Please enter your password to confirm disabling 2FA.</p>
                        <div>
                          <input
                            type="password"
                            placeholder="Current Password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="w-full max-w-sm px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                            required
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleDisable2FA}
                            disabled={isDisabling || !disablePassword}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                          >
                            {isDisabling ? "Disabling..." : "Confirm Disable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisableConfirm(false)
                              setDisablePassword('')
                            }}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-6">
                      When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Google Authenticator application.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/member/two-factor-setup')}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm transition-colors hover:bg-slate-800"
                    >
                      Enable Two-Factor Authentication
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 bg-[#0B6B3A] hover:bg-[#065F46] text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          </div>
          </div>
        </form>
      </div>
    </div>
  )
}
