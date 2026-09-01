import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  CalendarDays,
  PieChart,
  Gift,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth'
import ThemeToggle from '../../components/ThemeToggle'
import { GlobalSearch } from '../../components/admin/GlobalSearch'
import { NotificationDropdown } from '../../components/admin/NotificationDropdown'
import { PendingSaccoPage } from '../../pages/admin/PendingSaccoPage'

export const AdminLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Savings', path: '/admin/savings', icon: Wallet },
    { label: 'Loans', path: '/admin/loans', icon: CreditCard },
    { label: 'Repayments', path: '/admin/repayments', icon: CalendarDays },
    { label: 'Shares', path: '/admin/shares', icon: PieChart },
    { label: 'Dividends', path: '/admin/dividends', icon: Gift },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/'
    }
    return location.pathname.startsWith(path)
  }

  // Find current page title based on path
  const currentTitle = navItems.find(item => isActive(item.path))?.label || 'Dashboard'

  if (user?.sacco_status === 'pending') {
    return <PendingSaccoPage />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0B1727] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="font-extrabold text-lg text-white tracking-tight">SACCO Manager</div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-[260px] bg-[#0B1727] text-slate-300 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between z-40`}
      >
        <div>
          {/* Brand Header */}
          <div className="hidden md:flex items-center px-6 py-5 border-b border-slate-800/80">
            <div className="font-extrabold text-xl text-white tracking-tight">SACCO Manager</div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#0B6B3A] text-white border-l-4 border-[#0B6B3A] shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  style={{ borderLeftWidth: active ? '3px' : '0' }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Profile Area (Bottom) */}
        <div className="p-4 border-t border-slate-800/80 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center font-bold border border-emerald-500/30">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-slate-400 truncate">Admin</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
        {/* Top Header Bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
          {/* Left Title */}
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">{currentTitle}</h1>
          </div>

          {/* Right Items */}
          <div className="flex items-center gap-5">
            <ThemeToggle />
            
            <GlobalSearch />
            
            <NotificationDropdown />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#0B6B3A]">
              SACCO Admin
            </span>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.name || 'Admin User'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg py-1 border border-slate-200 dark:border-slate-800">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link 
                    to="/admin/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
