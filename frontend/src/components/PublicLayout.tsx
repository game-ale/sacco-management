import { Link, Outlet, useLocation } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export default function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-[#0B6B3A] text-white p-2 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-[#0B6B3A]">
                SACCO Manager
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex space-x-8">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-[#0B6B3A] dark:hover:text-emerald-400 ${
                      isActive
                        ? "text-[#0B6B3A] dark:text-emerald-400 border-b-2 border-[#0B6B3A] dark:border-emerald-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0B6B3A] dark:hover:text-emerald-400 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-[#0B6B3A] hover:bg-[#065F46] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md"
              >
                Register SACCO
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600 hover:text-[#0B6B3A] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.path
                        ? "bg-green-50 dark:bg-slate-800 text-[#0B6B3A] dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 flex flex-col">
                  <div className="px-3 pb-2">
                    <ThemeToggle />
                  </div>
                  <div className="px-3 pb-2">
                    <LanguageSwitcher />
                  </div>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-3 text-sm font-medium text-white bg-[#0B6B3A] rounded-lg text-center"
                  >
                    Register SACCO
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* MAIN CONTENT with page transition */}
      <main className="grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1F2937] text-slate-300 pt-16 pb-8 border-t-4 border-[#0B6B3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="bg-white/10 text-white p-2 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-white">
                  SACCO Manager
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Empowering Ethiopian cooperatives with secure, scalable, and
                intuitive management solutions. Modernize your cooperative
                finance today.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">
                Company
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    Team
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">
                Product
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/services"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">
                Resources
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-sm text-slate-500">
            <p className="order-2 lg:order-1">
              © {new Date().getFullYear()} SACCO Manager. All rights reserved.
            </p>

            <div className="order-1 lg:order-2 flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity">
              <span className="text-xs uppercase tracking-wider text-slate-500">
                Powered by
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#C62828] font-bold text-2xl tracking-tighter leading-none font-sans">
                  ][
                </span>
                <div className="flex flex-col justify-center">
                  <span
                    className="text-white font-serif text-xl tracking-wider leading-none"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    HAWI
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mt-1 leading-none">
                    Software Solutions
                  </span>
                </div>
              </div>
            </div>

            <div className="order-3 flex space-x-6">
              <Link to="/about" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
