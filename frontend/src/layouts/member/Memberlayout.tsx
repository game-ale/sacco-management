import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PiggyBank,
  Receipt,
  Bell,
  UserCircle,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useMemberNotifications } from "../../hooks/useMemberNotifications";

export const MemberLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useMemberNotifications();

  // Only members should ever see this layout. Anyone else (or a
  // not-yet-loaded user) gets bounced — adjust the fallback route to
  // wherever makes sense for other roles (e.g. an admin dashboard or login).
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "member") {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  const navItems = [
    {
      label: t("member.nav.dashboard"),
      path: "/member",
      icon: LayoutDashboard,
    },
    { label: t("member.nav.savings"), path: "/member/savings", icon: Wallet },
    {
      label: t("member.nav.apply_loan"),
      path: "/member/loans/apply",
      icon: CreditCard,
    },
    { label: t("member.nav.loans"), path: "/member/loans", icon: CreditCard },
    {
      label: t("member.nav.make_payment"),
      path: "/member/payments",
      icon: Zap,
    },
    {
      label: t("member.nav.dividends"),
      path: "/member/dividends",
      icon: PiggyBank,
    },
    {
      label: t("member.nav.statements"),
      path: "/member/statements",
      icon: Receipt,
    },
    {
      label: t("member.nav.notifications"),
      path: "/member/notifications",
      icon: Bell,
      badge: unreadCount,
    },
  ];

  const bottomNavItems = [
    {
      label: t("member.nav.profile"),
      path: "/member/profile",
      icon: UserCircle,
    },
    {
      label: t("member.nav.support"),
      path: "/member/help-support",
      icon: HelpCircle,
    },
  ];

  // Match a nav path against the current URL. "/member" only matches the
  // dashboard itself; every other path matches its own page as well as any
  // nested routes under it (e.g. "/member/loans" also matches
  // "/member/loans/5").
  const pathMatches = (pathname: string, path: string) => {
    if (path === "/member") {
      return pathname === "/member" || pathname === "/member/";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Some nav paths are prefixes of others (e.g. "/member/loans" is a
  // prefix of "/member/loans/apply"), which would otherwise highlight both
  // at once. Only the longest (most specific) matching path should be
  // treated as active.
  const activeNavPath = [...navItems, ...bottomNavItems]
    .map((item) => item.path)
    .filter((path) => pathMatches(location.pathname, path))
    .reduce<string | null>(
      (longest, path) =>
        longest === null || path.length > longest.length ? path : longest,
      null
    );

  const isActive = (path: string) => path === activeNavPath;

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  const memberIdDisplay = user?.id ?? "—";

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">
              {user?.name ?? ""}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {t("member.member_id", { id: memberIdDisplay })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex md:flex-col w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0 justify-between z-40 select-none`}
      >
        <div>
          {/* Profile block */}
          <div className="hidden md:flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                {user?.name ?? ""}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {t("member.member_id", { id: memberIdDisplay })}
              </div>
            </div>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-emerald-700 text-white font-semibold shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-700 text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            {t("member.logout")}
          </button>

          <Link
            to="/member/payments"
            className="mt-2 w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg"
          >
            <Zap className="w-4 h-4" />
            {t("member.quick_payment")}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F6F9] dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3 hidden md:flex items-center justify-end gap-4 sticky top-0 z-30">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label={t("member.nav.notifications")}
            onClick={() => navigate("/member/notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};