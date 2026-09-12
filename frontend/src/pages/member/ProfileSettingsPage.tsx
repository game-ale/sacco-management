import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuthStore } from '../../stores/auth'
import { updateProfile, type UpdateProfileRequest } from '../../services/memberProfileService'
import { User, Mail, Phone, MapPin, CreditCard, Save, Camera } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfileSettingsPage() {
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
