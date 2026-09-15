import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "../../stores/auth";
import { NewSaccoModal } from "../../components/super-admin/NewSaccoModal";
import { LogoutConfirmDialog } from "../../components/ui/LogoutConfirmDialog";
import ThemeToggle from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { NotificationDropdown } from "../../components/admin/NotificationDropdown";
import { SuperAdminGlobalSearch } from "../../components/super-admin/SuperAdminGlobalSearch";

export const SuperAdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const isDashboard =
    location.pathname === "/super-admin" ||
    location.pathname === "/super-admin/";

  const mainNavItems = [
    { label: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
    { label: "SACCOs", path: "/super-admin/saccos", icon: Building2 },
    { label: "All Users", path: "/super-admin/users", icon: Users },
    { label: "Platform Reports", path: "/super-admin/reports", icon: BarChart3 },
    { label: "Platform Settings", path: "/super-admin/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/super-admin") {
      return (
        location.pathname === "/super-admin" ||
        location.pathname === "/super-admin/"
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base leading-tight tracking-wide">
              SACCO MS
            </div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              {isDashboard ? "PLATFORM ADMIN" : "Management System"}
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-slate-800 text-slate-300"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-[260px] bg-[#0F172A] text-slate-300 shrink-0 flex flex-col justify-between z-40 select-none border-r border-slate-800/80`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
            <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700/60 shadow-xs shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-white leading-snug tracking-wide">
                SACCO MS
              </div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                {isDashboard ? "PLATFORM ADMIN" : "Management System"}
              </div>
            </div>
          </div>

          {/* New Application CTA Button */}
          <div className="px-4 py-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsNewModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Application</span>
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="px-3 py-1 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-slate-800/80 text-[#F59E0B] font-semibold shadow-2xs border-l-4 border-[#F59E0B]"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-4 border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-[#F59E0B]" : "text-slate-400"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Navigation & User Profile */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {user?.name || "Admin User"}
              </div>
              <div className="text-[10px] text-[#F59E0B] font-bold uppercase tracking-wide">
                Superadmin
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F6F9] dark:bg-slate-950 transition-colors">
        {/* Top Bar Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-2xs transition-colors">
          {/* Left Title & Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              Platform Admin
            </h1>
          </div>

          {/* Right Header Search & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {/* Theme Toggle & Language */}
            <ThemeToggle />
            <LanguageSwitcher />

            <SuperAdminGlobalSearch />

            <NotificationDropdown />

            <button
              type="button"
              onClick={() => navigate('/super-admin/help-support')}
              aria-label="Help & Support"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
              title="Help & Support"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

            {/* Profile User Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 py-1 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
                  aria-label="User profile menu"
                >
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
                    alt="Admin Avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#F59E0B]/50 shrink-0"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                      {user?.name || "Admin User"}
                    </span>
                    <span className="text-[10px] text-[#F59E0B] font-semibold uppercase tracking-wide">
                      Platform Admin
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || "admin@sacco.org"}
                    </p>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#D97706] dark:text-[#F59E0B]">
                        Platform Admin
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <DropdownMenu.Item
                      onSelect={() => navigate("/super-admin/settings")}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer outline-none transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Settings</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      onSelect={() => navigate("/super-admin/help-support")}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer outline-none transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>Help & Support</span>
                    </DropdownMenu.Item>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <DropdownMenu.Item
                      onSelect={() => setShowLogoutConfirm(true)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer outline-none transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </DropdownMenu.Item>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global New SACCO Application Modal */}
      <NewSaccoModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new Event('sacco-created'))
          if (!location.pathname.startsWith('/super-admin/saccos')) {
            navigate('/super-admin/saccos?status=pending')
          }
        }}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
};
