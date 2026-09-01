import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Landmark, PieChart, Shield, 
  Bell, Settings as SettingsIcon, Save
} from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import type { Sacco } from '../../types'

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: adminService.getSettings
  })

  // We can fetch shares summary to get the actual total share capital
  const { data: sharesSummary } = useQuery({
    queryKey: ['adminSharesSummary'],
    queryFn: () => adminService.getSharesSummary()
  })

  const totalCapital = (sharesSummary as any)?.summary?.total_capital || 0

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Sacco>) => adminService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] })
      alert('Settings updated successfully')
    },
    onError: () => {
      alert('Failed to update settings')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData as any)
    updateMutation.mutate(data)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  const tabVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
  }

  return (
    <motion.div 
      className="space-y-6 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your institution's core configuration and parameters.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-900 text-[#0B6B3A] dark:text-emerald-400 border-l-4 border-[#0B6B3A] dark:border-emerald-500 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            General
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-[#0B6B3A] dark:text-emerald-400 border-l-4 border-[#0B6B3A] dark:border-emerald-500 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
            }`}
          >
            <Shield className="w-5 h-5" />
            Security
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-slate-900 text-[#0B6B3A] dark:text-emerald-400 border-l-4 border-[#0B6B3A] dark:border-emerald-500 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
            }`}
          >
            <Bell className="w-5 h-5" />
            Notifications
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 space-y-6 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabVariants}
              className="space-y-6"
            >
              {activeTab === 'general' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Institution Information */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Institution Information</h3>
                    </div>
                
                    {isLoading ? (
                      <div className="p-12 text-center text-slate-500">Loading settings...</div>
                    ) : (
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">SACCO Name</label>
                            <input 
                              type="text" 
                              name="name"
                              defaultValue={settings?.name}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] focus:bg-white dark:focus:bg-slate-900 transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Registration Number</label>
                            <input 
                              type="text" 
                              name="registration_number"
                              defaultValue={settings?.registration_number}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] focus:bg-white dark:focus:bg-slate-900 transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Official Email</label>
                            <input 
                              type="email" 
                              name="email"
                              defaultValue={settings?.email}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] focus:bg-white dark:focus:bg-slate-900 transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Contact Phone</label>
                            <input 
                              type="tel" 
                              name="phone"
                              defaultValue={settings?.phone}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] focus:bg-white dark:focus:bg-slate-900 transition-all" 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Physical Address</label>
                            <textarea 
                              name="physical_address"
                              defaultValue={settings?.physical_address}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A] focus:bg-white dark:focus:bg-slate-900 transition-all resize-none h-20" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Loan & Share Config */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Loan Parameters */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
                      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loan Parameters</h3>
                      </div>
                      
                      {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading settings...</div>
                      ) : (
                        <div className="p-6 space-y-6 flex-1">
                          {/* Item 1 */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Default Interest Rate</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">Annual percentage rate applied to new loans.</div>
                            </div>
                            <div className="relative w-24 shrink-0">
                              <input type="number" step="0.01" name="loan_interest_rate" defaultValue={settings?.loan_interest_rate || 12.5} className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">%</span>
                            </div>
                          </div>

                          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

                          {/* Item 2 */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Maximum Loan Amount</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">Upper limit per individual borrower.</div>
                            </div>
                            <div className="relative w-32 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">ETB</span>
                              <input type="number" name="loan_max_amount" defaultValue={settings?.loan_max_amount || 500000} className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                            </div>
                          </div>

                          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

                          {/* Item 3 */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Maximum Loan Term</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">Longest permissible repayment period.</div>
                            </div>
                            <div className="relative w-24 shrink-0">
                              <input type="number" name="loan_max_term" defaultValue={settings?.loan_max_term || 60} className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">Mo.</span>
                            </div>
                          </div>

                          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

                          {/* Item 4 */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Loan-to-Savings Multiplier</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">Max loan multiple based on member savings.</div>
                            </div>
                            <div className="relative w-20 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">x</span>
                              <input type="number" step="0.1" name="loan_savings_multiplier" defaultValue={settings?.loan_savings_multiplier || 3} className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                            </div>
                          </div>

                          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

                          {/* Item 5 – Late Fee Penalty */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Late Fee Penalty</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">One-time penalty on overdue installments.</div>
                            </div>
                            <div className="relative w-24 shrink-0">
                              <input type="number" step="0.01" name="late_fee_percentage" defaultValue={settings?.late_fee_percentage || 0} className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Share Configuration */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
                      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                          <PieChart className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Configuration</h3>
                      </div>
                      
                      {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading settings...</div>
                      ) : (
                        <div className="p-6 space-y-6 flex-1 flex flex-col">
                          {/* Item 1 */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Nominal Share Value</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">Fixed cost of a single share unit.</div>
                            </div>
                            <div className="relative w-28 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">ETB</span>
                              <input type="number" name="share_value" defaultValue={settings?.share_value || 100} className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                            </div>
                          </div>

                          <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

                          {/* Item 2 */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Minimum Mandatory Shares</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pr-4">Required to maintain active membership.</div>
                            </div>
                            <div className="relative w-20 shrink-0">
                              <input type="number" name="min_mandatory_shares" defaultValue={settings?.min_mandatory_shares || 50} className="w-full px-3 py-2 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 focus:border-[#0B6B3A]" />
                            </div>
                          </div>

                          <div className="mt-auto pt-6">
                            <div className="bg-[#ECFDF5] dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-5 text-center flex flex-col items-center">
                              <PieChart className="w-6 h-6 text-[#0B6B3A] dark:text-emerald-400 mb-2" />
                              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Current Total Share Capital</div>
                              <div className="text-xl font-bold text-[#0B6B3A] dark:text-emerald-400">{totalCapital.toLocaleString()} ETB</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={updateMutation.isPending || isLoading} className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B6B3A] dark:bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-[#095730] dark:hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50">
                      <Save className="w-4 h-4" />
                      {updateMutation.isPending ? 'Saving...' : 'Save All Changes'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab !== 'general' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
                  {activeTab === 'security' ? <Shield className="w-12 h-12 mb-4 opacity-50" /> : <Bell className="w-12 h-12 mb-4 opacity-50" />}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 capitalize">{activeTab} Settings</h3>
                  <p className="text-sm">These settings are currently under development.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
