import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  PiggyBank,
  FileSpreadsheet,
  Landmark,
  CreditCard,
  TrendingUp,
  FileText,
  Bell,
  User,
  HelpCircle,
  Search,
  Menu,
  X,
  Zap,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth'
import ThemeToggle from '../../components/ThemeToggle'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Savings', path: '/dashboard', icon: PiggyBank },
  { label: 'Apply for Loan', path: '/dashboard', icon: FileSpreadsheet },
  { label: 'My Loans', path: '/dashboard', icon: Landmark },
  { label: 'Make Payment', path: '/dashboard', icon: CreditCard },
  { label: 'My Dividends', path: '/dashboard', icon: TrendingUp },
  { label: 'Statements', path: '/member/statements', icon: FileText },
  { label: 'Notifications', path: '/member/notifications', icon: Bell },
  { label: 'My Profile', path: '/member/profile', icon: User },
  { label: 'Help & Support', path: '/member/help-support', icon: HelpCircle },
]

function initials(name?: string) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function MemberPortalLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const memberId = user?.id ? `#SAC-${String(user.id).padStart(4, '0')}` : '#SAC-0000'

  return (
    <div className="min-h-screen flex bg-[#F6F7FB] dark:bg-slate-950">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-4 py-3">
        <span className="font-bold text-[#0B6B3A] dark:text-emerald-400">EthioSACCO</span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed md:sticky top-0 md:top-0 h-screen z-30 pt-14 md:pt-0`}
      >
        {/* Member card */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center font-semibold shrink-0">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user?.name || 'Member'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Member ID: {memberId}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#0B6B3A] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 bg-[#0B6B3A] hover:bg-[#095430] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Quick Payment
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 text-xs font-semibold py-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col pt-14 md:pt-0">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 md:top-0 z-10">
          <h1 className="hidden md:block text-lg font-bold text-[#0B6B3A] dark:text-emerald-400 whitespace-nowrap">
            EthioSACCO Member Portal
          </h1>
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-100 border border-transparent rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/40 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              to="/member/notifications"
              className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
