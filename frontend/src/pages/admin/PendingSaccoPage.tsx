import React from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Clock, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'

export const PendingSaccoPage: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-center border border-slate-100 dark:border-slate-800"
      >
        <div className="bg-amber-500/10 dark:bg-amber-500/20 p-8 flex justify-center border-b border-amber-500/20">
          <div className="bg-amber-100 dark:bg-amber-900/50 p-4 rounded-full">
            <Clock className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Pending</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Thank you for registering <strong>{user?.name || 'your SACCO'}</strong>. Your application is currently under review by our superadmin team. 
            You will be able to access your dashboard once your SACCO is approved.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-8 text-sm text-slate-500 dark:text-slate-400 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              This process typically takes 1-2 business days. We will notify you via email at <strong>{user?.email}</strong> once your account is active.
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-[#0B1727] hover:bg-slate-800 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
